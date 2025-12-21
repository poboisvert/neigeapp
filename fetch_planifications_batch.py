#!/usr/bin/env python3
"""Script to fetch all planifications from the last 60 days and upsert streets to Supabase"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import os
import json
import zeep
from dotenv import load_dotenv
from supabase import create_client
from shapely.geometry import shape, LineString, MultiLineString
from shapely.ops import linemerge
import psycopg2
from psycopg2.extras import Json as PGJson
from psycopg2 import pool
import pathlib
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
import requests

# Load environment variables from .env file
load_dotenv()

DEFAULT_URL = ('https://servicesenligne2.ville.montreal.qc.ca/api/infoneige/InfoneigeWebService?WSDL')

# Initialize Supabase client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
else:
    supabase = None
    print("WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Upsert will be skipped.")

# Thread-local storage for database connections
thread_local = threading.local()

# Connection pool for database connections (initialized in main)
db_pool = None


def normalize_to_linestring(geometry):
    """
    Normalize geometry to LineString.
    Converts MultiLineString to LineString by merging connected segments.
    If segments cannot be merged, uses the longest segment.
    
    Args:
        geometry: GeoJSON geometry object with 'type' and 'coordinates' keys
    
    Returns:
        GeoJSON geometry object with type 'LineString', or None if conversion fails
    """
    geom_type = geometry.get("type")
    coordinates = geometry.get("coordinates")
    
    if not coordinates:
        return None
    
    if geom_type == "LineString":
        return geometry
    elif geom_type == "MultiLineString":
        # Convert MultiLineString to LineString
        try:
            # Create MultiLineString object
            multi_linestring = MultiLineString(coordinates)
            
            # Try to merge connected segments
            merged = linemerge(multi_linestring)
            
            if isinstance(merged, LineString):
                # Successfully merged into a single LineString
                return {
                    "type": "LineString",
                    "coordinates": list(merged.coords)
                }
            else:
                # Could not merge completely (segments are disconnected)
                # Use the longest segment from the merged result as fallback
                if isinstance(merged, MultiLineString):
                    longest_line = max(merged.geoms, key=lambda g: g.length)
                else:
                    # Fallback to original if merged is unexpected type
                    longest_line = max(multi_linestring.geoms, key=lambda g: g.length)
                return {
                    "type": "LineString",
                    "coordinates": list(longest_line.coords)
                }
        except Exception as e:
            # If merging fails, use the first segment
            print(f"Warning: Could not merge MultiLineString, using first segment: {str(e)}")
            if coordinates and len(coordinates) > 0:
                return {
                    "type": "LineString",
                    "coordinates": coordinates[0]
                }
            return None
    else:
        # Unsupported geometry type
        return None


def geojson_to_wkt(geometry):
    """
    Convert GeoJSON geometry to WKT format.
    Converts MultiLineString to LineString before converting to WKT.
    
    Args:
        geometry: GeoJSON geometry object with 'type' and 'coordinates' keys
    
    Returns:
        WKT string if geometry type is supported, None otherwise
    """
    # Normalize to LineString first
    normalized = normalize_to_linestring(geometry)
    
    if not normalized:
        return None
    
    coordinates = normalized.get("coordinates")
    if not coordinates:
        return None
    
    return LineString(coordinates).wkt


def convert_datetime_to_string(obj):
    """Recursively convert datetime objects to ISO format strings"""
    if isinstance(obj, datetime):
        return obj.replace(microsecond=0).isoformat()
    elif isinstance(obj, dict):
        return {key: convert_datetime_to_string(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_datetime_to_string(item) for item in obj]
    return obj


class PlanifNeigeClient:
    """Client class for the PlanifNeige API"""
    
    def __init__(self, token: str, url: str = None):
        self.transport = zeep.Transport()
        self.transport.session.headers['User-Agent'] = (
            "planif-neige-client https://github.com/poboisvert"
        )
        
        if url is None:
            url = DEFAULT_URL
        self.wsdl = url
        self.client = zeep.Client(wsdl=self.wsdl, transport=self.transport)
        self.token = token
    
    def get_planification_for_date(self, from_date: str = None):
        """Get planification data from API for all streets since a specified date"""
        if from_date is None:
            raise ValueError("from_date parameter is required")
        print('from_date', from_date)
        request = {'fromDate': str(from_date), 'tokenString': self.token}
        response = self.client.service.GetPlanificationsForDate(request)
        result = zeep.helpers.serialize_object(response)

        status = result.get('responseStatus', -1)
        if status != 0:
            raise Exception(f"API returned status code: {status}")
        
        planifications = result.get('planifications', {})
        planification_list = planifications.get('planification', [])
        
        # If single item, convert to list
        if isinstance(planification_list, dict):
            planification_list = [planification_list]
        
        # Convert datetime objects to strings
        planification_list = convert_datetime_to_string(planification_list)
        
        return planification_list, result


def get_etat_deneig_status(etat: int) -> str:
    """Convert etatDeneig number to human-readable status string"""
    status_map = {
        0: "Enneigé",
        1: "Déneigé",
        2: "Planifié",
        3: "Replanifié",
        4: "Sera replanifié ultérieurement",
        5: "Chargement en cours",
        10: "Dégagé (entre 2 chargements de neige)"
    }
    return status_map.get(etat, f"État inconnu ({etat})")


def get_supabase_client():
    """Get a thread-local Supabase client instance"""
    if not hasattr(thread_local, 'supabase_client'):
        if SUPABASE_URL and SUPABASE_SERVICE_KEY:
            thread_local.supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        else:
            thread_local.supabase_client = None
    return thread_local.supabase_client


def get_db_connection():
    """Get a database connection from the pool or create a new one"""
    if db_pool:
        return db_pool.getconn()
    
    database_url = os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")
    if database_url:
        try:
            return psycopg2.connect(database_url)
        except Exception:
            return None
    return None


def return_db_connection(conn):
    """Return a database connection to the pool"""
    if db_pool and conn:
        db_pool.putconn(conn)
    elif conn:
        conn.close()


def street_exists(cote_rue_id: int, db_conn=None, local_supabase=None) -> bool:
    """Check if a street exists in the streets table"""
    if db_conn:
        try:
            with db_conn.cursor() as cur:
                cur.execute("SELECT 1 FROM streets WHERE cote_rue_id = %s LIMIT 1", (cote_rue_id,))
                return cur.fetchone() is not None
        except Exception:
            return False
    
    client = local_supabase or get_supabase_client()
    if client is None:
        return False
    
    try:
        res = client.table("streets") \
            .select("cote_rue_id") \
            .eq("cote_rue_id", cote_rue_id) \
            .limit(1) \
            .execute()
        return len(res.data) > 0
    except Exception:
        return False


def get_current_state(cote_rue_id: int, local_supabase=None) -> Optional[Dict[str, Any]]:
    """Get the current state from deneigement_current table"""
    client = local_supabase or get_supabase_client()
    if client is None:
        return None
    
    try:
        res = client.table("deneigement_current") \
            .select("*") \
            .eq("cote_rue_id", cote_rue_id) \
            .single() \
            .execute()
        return res.data
    except Exception:
        # If no record found, single() will raise an exception
        # Return None to indicate no current state
        return None


def insert_event(cote_rue_id: int, old: Optional[Dict[str, Any]], new: Dict[str, Any], local_supabase=None):
    """Insert an event into deneigement_events table when state changes"""
    client = local_supabase or get_supabase_client()
    if client is None:
        return
    
    event = {
        "cote_rue_id": cote_rue_id,
        "old_etat": old["etat_deneig"] if old else None,
        "new_etat": new["etatDeneig"],
        "old_status": old["status"] if old else None,
        "new_status": new["status"],
        "event_date": new["dateMaj"]
    }
    
    try:
        client.table("deneigement_events").insert(event).execute()
    except Exception as e:
        print(f"Error inserting event for cote_rue_id {cote_rue_id}: {str(e)}")


def upsert_current(item: Dict[str, Any], db_conn=None, local_supabase=None, gbdouble_mapping: Dict[int, Dict[str, Any]] = None):
    """Upsert current state and track events when state changes"""
    client = local_supabase or get_supabase_client()
    if client is None:
        return
    
    cote_rue_id = item.get("coteRueId")
    if not cote_rue_id:
        return
    
    # Check if street exists, if not try to create it
    if not street_exists(cote_rue_id, db_conn=db_conn, local_supabase=client):
        # Try to find and insert the street from gbdouble_mapping
        if gbdouble_mapping and cote_rue_id in gbdouble_mapping:
            feature = gbdouble_mapping[cote_rue_id]
            print(f"⚠ Street {cote_rue_id} not found in database, attempting to insert from gbdouble mapping...")
            result = upsert_street(feature, db_conn, local_supabase=client)
            if result:
                print(f"✓ Successfully inserted missing street: cote_rue_id={cote_rue_id}")
            else:
                print(f"✗ Failed to insert missing street: cote_rue_id={cote_rue_id}")
                # Still try to insert deneigement_current, it might fail but we'll catch the error
        else:
            print(f"⚠ Street {cote_rue_id} not found in database and not in gbdouble mapping. Cannot insert into deneigement_current.")
            # Check one more time if it exists (maybe it was just created)
            if not street_exists(cote_rue_id, db_conn=db_conn, local_supabase=client):
                print(f"✗ Skipping deneigement_current insert for cote_rue_id {cote_rue_id}: street does not exist")
                return
    
    current = get_current_state(cote_rue_id, local_supabase=client)
    
    # Check if state has changed
    has_changed = (
        current is None or
        current.get("etat_deneig") != item.get("etatDeneig") 
    )
    
    if has_changed:
        insert_event(cote_rue_id, current, item, local_supabase=client)
    
    record = {
        "cote_rue_id": cote_rue_id,
        "etat_deneig": item.get("etatDeneig"),
        "status": item.get("status"),
        "date_debut_planif": item.get("dateDebutPlanif"),
        "date_fin_planif": item.get("dateFinPlanif"),
        "date_debut_replanif": item.get("dateDebutReplanif"),
        "date_fin_replanif": item.get("dateFinReplanif"),
        "date_maj": item.get("dateMaj")
    }
    
    # Remove None values
    record = {k: v for k, v in record.items() if v is not None}
    
    try:
        client.table("deneigement_current").upsert(record, on_conflict="cote_rue_id").execute()
    except Exception as e:
        error_str = str(e)
        # Check if it's a foreign key constraint violation
        if "foreign key constraint" in error_str.lower() or "23503" in error_str:
            print(f"✗ Foreign key violation for cote_rue_id {cote_rue_id}: street does not exist in streets table")
            # Try one more time to find and insert the street
            if gbdouble_mapping and cote_rue_id in gbdouble_mapping:
                feature = gbdouble_mapping[cote_rue_id]
                print(f"  Attempting to insert street {cote_rue_id} from gbdouble mapping...")
                result = upsert_street(feature, db_conn, local_supabase=client)
                if result:
                    print(f"  ✓ Street inserted, retrying deneigement_current upsert...")
                    try:
                        client.table("deneigement_current").upsert(record, on_conflict="cote_rue_id").execute()
                        print(f"  ✓ Successfully upserted deneigement_current after inserting street")
                    except Exception as e2:
                        print(f"  ✗ Still failed after inserting street: {str(e2)}")
                else:
                    print(f"  ✗ Failed to insert street, cannot proceed with deneigement_current")
            else:
                print(f"  ✗ Street {cote_rue_id} not found in gbdouble mapping, cannot create it")
        else:
            print(f"Error upserting current state for cote_rue_id {cote_rue_id}: {error_str}")


def ingest(api_response: list, gbdouble_mapping: Dict[int, Dict[str, Any]] = None, db_conn=None, local_supabase=None):
    """
    Process API response and upsert both streets and current states.
    
    Args:
        api_response: List of planification items from the API
        gbdouble_mapping: Optional mapping of cote_rue_id to GeoJSON features
        db_conn: Optional database connection for PostGIS support
        local_supabase: Optional thread-local Supabase client
    """
    upserted_streets_count = 0
    skipped_streets_count = 0
    upserted_current_count = 0
    # https://donnees.montreal.ca/dataset/geobase-double/resource/16f7fa0a-9ce6-4b29-a7fc-00842c593927
    
    for item in api_response:
        cote_rue_id = item.get('coteRueId')
        
        # Add human-readable status to planification
        etat_deneig = item.get('etatDeneig')
        item['status'] = get_etat_deneig_status(etat_deneig) if etat_deneig is not None else "État inconnu"
        
        # Upsert street feature if available
        if cote_rue_id and gbdouble_mapping and cote_rue_id in gbdouble_mapping:
            feature = gbdouble_mapping[cote_rue_id]
            result = upsert_street(feature, db_conn, local_supabase=local_supabase)
            
            if result:
                upserted_streets_count += 1
                print(f"✓ Upserted street: cote_rue_id={cote_rue_id}, status={item['status']}")
            else:
                skipped_streets_count += 1
                print(f"✗ Failed to upsert street: cote_rue_id={cote_rue_id}")
        else:
            if cote_rue_id:
                skipped_streets_count += 1
                if gbdouble_mapping is None:
                    print(f"⚠ Skipped street: No gbdouble mapping available for coteRueId={cote_rue_id}")
                else:
                    print(f"⚠ Skipped street: No matching feature for coteRueId={cote_rue_id}")
        
        # Upsert current state and track events
        # Ensure street exists first (upsert_current will handle this)
        if cote_rue_id:
            try:
                upsert_current(item, db_conn=db_conn, local_supabase=local_supabase, gbdouble_mapping=gbdouble_mapping)
                # Check if street exists before counting as success
                if street_exists(cote_rue_id, db_conn=db_conn, local_supabase=local_supabase):
                    upserted_current_count += 1
                    print(f"✓ Updated current state: cote_rue_id={cote_rue_id}, status={item['status']}")
                else:
                    print(f"⚠ Skipped current state update: street {cote_rue_id} does not exist")
            except Exception as e:
                print(f"✗ Failed to upsert current state for cote_rue_id={cote_rue_id}: {str(e)}")
    
    return {
        "total": len(api_response),
        "streets_upserted": upserted_streets_count,
        "streets_skipped": skipped_streets_count,
        "current_upserted": upserted_current_count
    }


def upsert_street(feature: Dict[str, Any], db_conn=None, local_supabase=None) -> Optional[Dict[str, Any]]:
    """
    Upsert a street feature into the Supabase streets table.
    
    Args:
        feature: GeoJSON feature object with properties and geometry
        db_conn: Optional psycopg2 connection for direct database access
        local_supabase: Optional thread-local Supabase client
    
    Returns:
        True if successful, False otherwise
    """
    client = local_supabase or get_supabase_client()
    if client is None and db_conn is None:
        return None
    
    properties = feature.get("properties", {})
    cote_rue_id = properties.get("COTE_RUE_ID")
    
    if cote_rue_id is None:
        return None
    geom = feature["geometry"]
    
    # Normalize geometry to LineString (convert MultiLineString to LineString)
    normalized_geometry = normalize_to_linestring(geom)
    if normalized_geometry is None:
        print(f"Warning: Could not normalize geometry for cote_rue_id {cote_rue_id}, using original geometry")
        normalized_geometry = geom
    else:
        # Update the feature's geometry to the normalized version
        feature_copy = feature.copy()
        feature_copy["geometry"] = normalized_geometry
        feature = feature_copy

    # Extract fields from properties (matching table column names)
    street_data = {
        "cote_rue_id": cote_rue_id,
        "id_trc": properties.get("ID_TRC"),
        "id_voie": properties.get("ID_VOIE"),
        "nom_voie": properties.get("NOM_VOIE"),
        "nom_ville": properties.get("NOM_VILLE"),
        "debut_adresse": properties.get("DEBUT_ADRESSE"),
        "fin_adresse": properties.get("FIN_ADRESSE"),
        "cote": properties.get("COTE"),
        "type_f": properties.get("TYPE_F"),
        "sens_cir": properties.get("SENS_CIR"),
        "geometry": f"SRID=4326;{geojson_to_wkt(normalized_geometry)}",
        "street_feature": PGJson(feature),  # Store the entire feature as jsonb
    }
    geometry = normalized_geometry
    
    try:
        if db_conn:
            # Use direct psycopg2 connection for proper PostGIS support
            with db_conn.cursor() as cur:
                # Build the upsert query with PostGIS geometry
                if geometry:
                    # Convert GeoJSON to PostGIS geography
                    cur.execute("""
                        INSERT INTO streets (
                            cote_rue_id, id_trc, id_voie, nom_voie, nom_ville,
                            debut_adresse, fin_adresse, cote, type_f, sens_cir,
                            geometry, street_feature, updated_at
                        ) VALUES (
                            %(cote_rue_id)s, %(id_trc)s, %(id_voie)s, %(nom_voie)s, %(nom_ville)s,
                            %(debut_adresse)s, %(fin_adresse)s, %(cote)s, %(type_f)s, %(sens_cir)s,
                            ST_GeomFromGeoJSON(%(geometry)s)::geography, %(street_feature)s, now()
                        )
                        ON CONFLICT (cote_rue_id) DO UPDATE SET
                            id_trc = EXCLUDED.id_trc,
                            id_voie = EXCLUDED.id_voie,
                            nom_voie = EXCLUDED.nom_voie,
                            nom_ville = EXCLUDED.nom_ville,
                            debut_adresse = EXCLUDED.debut_adresse,
                            fin_adresse = EXCLUDED.fin_adresse,
                            cote = EXCLUDED.cote,
                            type_f = EXCLUDED.type_f,
                            sens_cir = EXCLUDED.sens_cir,
                            geometry = EXCLUDED.geometry,
                            street_feature = EXCLUDED.street_feature,
                            updated_at = now()
                    """, {
                        **street_data,
                        'geometry': json.dumps(geometry)
                    })
                else:
                    # Upsert without geometry
                    cur.execute("""
                        INSERT INTO streets (
                            cote_rue_id, id_trc, id_voie, nom_voie, nom_ville,
                            debut_adresse, fin_adresse, cote, type_f, sens_cir,
                            street_feature, updated_at
                        ) VALUES (
                            %(cote_rue_id)s, %(id_trc)s, %(id_voie)s, %(nom_voie)s, %(nom_ville)s,
                            %(debut_adresse)s, %(fin_adresse)s, %(cote)s, %(type_f)s, %(sens_cir)s,
                            %(street_feature)s, now()
                        )
                        ON CONFLICT (cote_rue_id) DO UPDATE SET
                            id_trc = EXCLUDED.id_trc,
                            id_voie = EXCLUDED.id_voie,
                            nom_voie = EXCLUDED.nom_voie,
                            nom_ville = EXCLUDED.nom_ville,
                            debut_adresse = EXCLUDED.debut_adresse,
                            fin_adresse = EXCLUDED.fin_adresse,
                            cote = EXCLUDED.cote,
                            type_f = EXCLUDED.type_f,
                            sens_cir = EXCLUDED.sens_cir,
                            street_feature = EXCLUDED.street_feature,
                            updated_at = now()
                    """, street_data)
                db_conn.commit()
                return True
        else:
            # Fallback to Supabase client (without geometry for now)
            client = local_supabase or get_supabase_client()
            if client is None:
                return False
            
            # Remove None values
            street_data_clean = {k: v for k, v in street_data.items() if v is not None and k != 'street_feature'}
            street_data_clean['street_feature'] = feature
            
            result = client.table("streets").upsert(
                street_data_clean,
                on_conflict="cote_rue_id"
            ).execute()
            
            return result.data is not None
    except Exception as e:
        print(f"Error upserting street {cote_rue_id}: {str(e)}")
        if db_conn:
            db_conn.rollback()
        return False


def split_planifications_into_batches(
    planification_list: List[Dict[str, Any]], 
    batch_size: int = 100,
    output_dir: str = "planification_batches"
) -> List[str]:
    """
    Split planification list into smaller batches and save each to a JSON file.
    
    Args:
        planification_list: List of planification items
        batch_size: Number of items per batch
        output_dir: Directory to save batch files
    
    Returns:
        List of file paths for the created batch files
    """
    # Create output directory if it doesn't exist
    pathlib.Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    batch_files = []
    total_items = len(planification_list)
    num_batches = (total_items + batch_size - 1) // batch_size  # Ceiling division
    
    print(f"Splitting {total_items} planifications into {num_batches} batch(es) of up to {batch_size} items each...")
    
    for i in range(0, total_items, batch_size):
        batch_num = (i // batch_size) + 1
        batch = planification_list[i:i + batch_size]
        
        batch_filename = f"planification_batch_{batch_num:04d}.json"
        batch_filepath = os.path.join(output_dir, batch_filename)
        
        try:
            with open(batch_filepath, "w", encoding="utf-8") as f:
                json.dump(batch, f, ensure_ascii=False, indent=2)
            
            batch_files.append(batch_filepath)
            print(f"  ✓ Created batch {batch_num}/{num_batches}: {batch_filename} ({len(batch)} items)")
        except Exception as e:
            print(f"  ✗ Error creating batch {batch_num}: {str(e)}")
    
    return batch_files


def process_batch_file(
    batch_filepath: str,
    gbdouble_mapping: Dict[int, Dict[str, Any]] = None
) -> Dict[str, int]:
    """
    Process a single batch file and update streets, deneigement_current, and events.
    This function is designed to be called in parallel and creates its own connections.
    
    Args:
        batch_filepath: Path to the batch JSON file
        gbdouble_mapping: Optional mapping of cote_rue_id to GeoJSON features
    
    Returns:
        Summary dictionary with processing statistics
    """
    # Get thread-local Supabase client
    local_supabase = get_supabase_client()
    
    # Get database connection from pool or create new one
    db_conn = get_db_connection()
    
    try:
        with open(batch_filepath, "r", encoding="utf-8") as f:
            batch_data = json.load(f)
        
        # Ensure batch_data is a list
        if isinstance(batch_data, dict):
            batch_data = [batch_data]
        
        print(f"\n[Thread {threading.current_thread().name}] Processing batch: {os.path.basename(batch_filepath)} ({len(batch_data)} items)")
        print("-" * 80)
        
        result = ingest(batch_data, gbdouble_mapping, db_conn, local_supabase=local_supabase)
        
        print(f"[Thread {threading.current_thread().name}] Completed batch: {os.path.basename(batch_filepath)}")
        return result
    except Exception as e:
        print(f"Error processing batch file {batch_filepath}: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "total": 0,
            "streets_upserted": 0,
            "streets_skipped": 0,
            "current_upserted": 0
        }
    finally:
        # Return connection to pool
        if db_conn:
            return_db_connection(db_conn)


def main():
    """Main function to fetch planifications and upsert streets to Supabase"""
    # Get token from environment
    token = os.getenv("TokenString") or os.getenv("PLANIF_NEIGE_TOKEN", "")
    if not token:
        print("ERROR: TokenString or PLANIF_NEIGE_TOKEN not set in .env file or environment")
        return 1
    
    # Check Supabase configuration
    if supabase is None:
        print("ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env file")
        return 1
    
    # Get batch size from environment or use default
    batch_size = int(os.getenv("BATCH_SIZE", "100"))
    batch_output_dir = os.getenv("BATCH_OUTPUT_DIR", "planification_batches")
    
    # Get max workers for parallel processing (default: 5, max: 20 to avoid overwhelming DB)
    max_workers = min(int(os.getenv("MAX_WORKERS", "5")), 20)
    print(f"Parallel processing enabled with max {max_workers} workers")
    
    # Initialize database connection pool if DATABASE_URL is available
    global db_pool
    database_url = os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")
    if database_url:
        try:
            # Create a connection pool with min 2, max max_workers connections
            db_pool = psycopg2.pool.ThreadedConnectionPool(
                minconn=2,
                maxconn=max_workers + 2,  # Extra connections for safety
                dsn=database_url
            )
            print(f"Database connection pool created (min: 2, max: {max_workers + 2})")
        except Exception as e:
            print(f"Warning: Could not create connection pool: {e}")
            print("Will create individual connections per thread")
            db_pool = None
    
    # Initialize client
    client = PlanifNeigeClient(token)
    
    # Use current date to get all recent planifications
    from_date = datetime.now().replace(microsecond=0, second=0).isoformat()
    print(f"Fetching planifications from date: {from_date}")
    print("=" * 80)
    
    # Load gbdouble.json to get street features
    gbdouble_mapping = {}
    try:
        # https://donnees.montreal.ca/dataset/geobase-double
        gbdouble_url = "https://donnees.montreal.ca/dataset/88493b16-220f-4709-b57b-1ea57c5ba405/resource/16f7fa0a-9ce6-4b29-a7fc-00842c593927/download/gbdouble.json"
        print("Downloading the latest gbdouble.json...")

        try:
            response = requests.get(gbdouble_url)
            response.raise_for_status()
            geojson_data = response.json()
            print("Successfully downloaded latest gbdouble.json")
        except Exception as e:
            print(f"ERROR: Failed to download gbdouble.json: {e}")
            return 1
        
        features = geojson_data.get("features", [])
        for idx, feature in enumerate(features):
            properties = feature.get("properties", {})
            geometry = feature.get("geometry", {})
            coordinates = geometry.get("coordinates", [])
            cote_rue_id = properties.get("COTE_RUE_ID")
            if not coordinates:
                print(f"Empty coordinates at gbdouble.json ({6338 + idx}-{6338 + idx + 24}): cote_rue_id={cote_rue_id}")
            if cote_rue_id is not None:
                gbdouble_mapping[cote_rue_id] = feature
        
        print(f"Loaded {len(gbdouble_mapping)} features from gbdouble.json")
    except FileNotFoundError:
        print("ERROR: gbdouble.json not found.")
        return 1
    except Exception as e:
        print(f"ERROR: Error loading gbdouble.json: {str(e)}")
        return 1
    
    try:
        # Get all planifications
        planifications, raw_result = client.get_planification_for_date(from_date)
        
        print(f"\nFound {len(planifications)} planification(s)")
        print("=" * 80)
        
        # Split planifications into batches and save to JSON files
        batch_files = split_planifications_into_batches(
            planifications,
            batch_size=batch_size,
            output_dir=batch_output_dir
        )
        
        if not batch_files:
            print("ERROR: No batch files were created")
            return 1
        
        print(f"\nCreated {len(batch_files)} batch file(s)")
        print("=" * 80)
        
        # Process batch files in parallel using ThreadPoolExecutor
        total_summary = {
            "total": 0,
            "streets_upserted": 0,
            "streets_skipped": 0,
            "current_upserted": 0
        }
        
        print(f"\nProcessing {len(batch_files)} batch file(s) in parallel (max {max_workers} workers)...")
        print("=" * 80)
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all batch processing tasks
            future_to_batch = {
                executor.submit(process_batch_file, batch_file, gbdouble_mapping): batch_file
                for batch_file in batch_files
            }
            
            # Process completed tasks as they finish
            completed = 0
            for future in as_completed(future_to_batch):
                batch_file = future_to_batch[future]
                completed += 1
                try:
                    batch_summary = future.result()
                    
                    # Aggregate statistics
                    total_summary["total"] += batch_summary["total"]
                    total_summary["streets_upserted"] += batch_summary["streets_upserted"]
                    total_summary["streets_skipped"] += batch_summary["streets_skipped"]
                    total_summary["current_upserted"] += batch_summary["current_upserted"]
                    
                    print(f"\n[Progress] {completed}/{len(batch_files)} batches completed")
                except Exception as e:
                    print(f"\n✗ Error processing batch {os.path.basename(batch_file)}: {str(e)}")
                    import traceback
                    traceback.print_exc()
        
        print("\n" + "=" * 80)
        print("FINAL SUMMARY:")
        print(f"  Total planifications processed: {total_summary['total']}")
        print(f"  Streets upserted: {total_summary['streets_upserted']}")
        print(f"  Streets skipped: {total_summary['streets_skipped']}")
        print(f"  Current states upserted: {total_summary['current_upserted']}")
        print(f"  Batch files created: {len(batch_files)}")
        print("=" * 80)
        
        # Close connection pool if it was created
        if db_pool:
            db_pool.closeall()
            print("Database connection pool closed")
        
        return 0
        
    except Exception as e:
        print(f"ERROR: Failed to fetch planifications: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Close connection pool if it was created
        if db_pool:
            db_pool.closeall()
        
        return 1


if __name__ == "__main__":
    exit(main())

