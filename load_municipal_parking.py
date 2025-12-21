#!/usr/bin/env python3
"""Script to fetch and load municipal parking data from Montreal Open Data into Supabase"""
import os
import requests
from typing import Dict, Any, List, Optional, Tuple
from dotenv import load_dotenv
from supabase import create_client
import psycopg2

# Load environment variables from .env file
load_dotenv()

# Montreal parking data GeoJSON URL
PARKING_DATA_URL = "https://donnees.montreal.ca/fr/dataset/575ecf37-9097-44cd-817f-a2fbd8de314b/resource/def63739-6295-4745-97e9-74755ee0bf92/download/stationnements-h-2025-2026.geojson"

# Initialize Supabase client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")

if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
else:
    supabase = None
    print("WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Data loading will be skipped.")


def convert_mtm_to_wgs84(x: float, y: float) -> Tuple[Optional[float], Optional[float]]:
    """
    Convert MTM Zone 8 (Quebec) coordinates to WGS84 (lat/lon).
    
    MTM Zone 8 parameters:
    - EPSG:32188 (NAD83 / MTM zone 8)
    - False Easting: 304800 m
    - Central Meridian: -73.5°
    - Scale Factor: 0.9999
    - Datum: NAD83
    
    Args:
        x: MTM Zone 8 X coordinate (easting)
        y: MTM Zone 8 Y coordinate (northing)
    
    Returns:
        Tuple of (latitude, longitude) in WGS84
    """
    try:
        # Try using pyproj if available (recommended)
        from pyproj import Transformer
        transformer = Transformer.from_crs("EPSG:32188", "EPSG:4326", always_xy=True)
        lon, lat = transformer.transform(x, y)
        return lat, lon
    except ImportError:
        # Fallback: Simple approximation for Montreal area
        # This is a rough approximation - for production, pyproj should be installed
        # Installation: pip install pyproj
        print("WARNING: pyproj not installed. Using approximation for coordinate conversion.")
        print("  For better accuracy, install pyproj: pip install pyproj")
        
        # Rough approximation using known reference points
        # Montreal area: roughly lat 45.5, lon -73.5
        # MTM Zone 8 false easting is 304800, central meridian -73.5
        # This is a simplified conversion - not highly accurate
        lon = -73.5 + (x - 304800) / 111320.0 * 0.9999
        lat = 45.5 + (y - 5045000) / 110540.0  # Approximate offset for Montreal
        return lat, lon
    except Exception as e:
        print(f"Error converting coordinates ({x}, {y}): {str(e)}")
        return None, None


def parse_coordinate(coord_str: str) -> Optional[float]:
    """Parse coordinate string (may contain comma as decimal separator)"""
    if not coord_str:
        return None
    try:
        # Replace comma with dot for decimal separator
        coord_str = str(coord_str).replace(',', '.')
        return float(coord_str)
    except (ValueError, TypeError):
        return None


def process_parking_feature(feature: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Process a single parking feature from the GeoJSON and convert it to database record format.
    
    Args:
        feature: GeoJSON feature object
    
    Returns:
        Dictionary ready for database insertion, or None if invalid
    """
    props = feature.get("properties", {})
    geometry = feature.get("geometry")
    
    # Extract required fields
    station_id = str(props.get("ID_STA", ""))
    if not station_id:
        print("Warning: Feature missing ID_STA, skipping")
        return None
    
    borough = props.get("ARRONDISSEMENT") or props.get("BOROUGH", "")
    if not borough:
        print(f"Warning: Feature {station_id} missing borough, skipping")
        return None
    
    # Parse coordinates
    x_str = props.get("X", "")
    y_str = props.get("Y", "")
    
    x = parse_coordinate(x_str)
    y = parse_coordinate(y_str)
    
    if x is None or y is None:
        print(f"Warning: Feature {station_id} has invalid coordinates, skipping")
        return None
    
    # Convert coordinates to WGS84
    lat, lon = convert_mtm_to_wgs84(x, y)
    if lat is None or lon is None:
        print(f"Warning: Feature {station_id} coordinate conversion failed, skipping")
        return None
    
    # Build database record
    record = {
        "station_id": station_id,
        "borough": borough,
        "number_of_spaces": props.get("NBR_PLA"),
        "latitude": lat,
        "longitude": lon,
        "jurisdiction": props.get("JURIDICTION"),
        "location_fr": props.get("EMPLACEMENT"),
        "location_en": props.get("LOCATION"),
        "hours_fr": props.get("HEURES"),
        "hours_en": props.get("HOURS"),
        "note_fr": props.get("NOTE_FR"),
        "note_en": props.get("NOTE_EN"),
        "payment_type": str(props.get("TYPE_PAY", "0")),
    }
    
    # Remove None values
    record = {k: v for k, v in record.items() if v is not None}
    
    return record


def fetch_parking_data() -> Optional[Dict[str, Any]]:
    """Fetch parking data from Montreal Open Data"""
    try:
        print(f"Fetching parking data from {PARKING_DATA_URL}...")
        response = requests.get(PARKING_DATA_URL, timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching parking data: {str(e)}")
        return None


def load_parking_data_to_supabase(data: Dict[str, Any], batch_size: int = 100) -> None:
    """
    Load parking data into Supabase.
    
    Args:
        data: GeoJSON FeatureCollection
        batch_size: Number of records to insert per batch
    """
    features = data.get("features", [])
    if not features:
        print("No features found in GeoJSON data")
        return
    
    print(f"Processing {len(features)} parking locations...")
    
    processed_records = []
    skipped_count = 0
    
    for feature in features:
        record = process_parking_feature(feature)
        if record:
            processed_records.append(record)
        else:
            skipped_count += 1
    
    print(f"Processed {len(processed_records)} records, skipped {skipped_count}")
    
    if not processed_records:
        print("No valid records to insert")
        return
    
    # Try to use direct database connection for proper PostGIS geometry support
    if DATABASE_URL:
        try:
            conn = psycopg2.connect(DATABASE_URL)
            load_parking_data_via_db(conn, processed_records, batch_size)
            conn.close()
            return
        except Exception as e:
            print(f"Warning: Could not connect to database directly ({str(e)}). Falling back to Supabase client.")
    
    # Fallback to Supabase client (without geometry)
    if not supabase:
        print("Supabase client not initialized. Cannot load data.")
        return
    
    # Insert records in batches
    total_inserted = 0
    errors = 0
    
    for i in range(0, len(processed_records), batch_size):
        batch = processed_records[i:i + batch_size]
        # Use records directly (no special cleaning needed)
        batch_clean = batch
        
        try:
            # Use upsert to handle duplicates (based on station_id)
            result = supabase.table("municipal_parking").upsert(
                batch_clean,
                on_conflict="station_id"
            ).execute()
            
            batch_count = len(batch)
            total_inserted += batch_count
            print(f"Upserted batch {i // batch_size + 1} ({batch_count} records)")
            
        except Exception as e:
            errors += len(batch)
            print(f"Error inserting batch {i // batch_size + 1}: {str(e)}")
            # Try inserting records one by one to identify problematic records
            for record in batch_clean:
                try:
                    supabase.table("municipal_parking").upsert(
                        [record],
                        on_conflict="station_id"
                    ).execute()
                    total_inserted += 1
                except Exception as err:
                    print(f"  Error inserting station_id {record.get('station_id')}: {str(err)}")
                    errors += 1
    
    print(f"\nSummary:")
    print(f"  Total records processed: {len(processed_records)}")
    print(f"  Successfully upserted: {total_inserted}")
    print(f"  Errors: {errors}")


def load_parking_data_via_db(conn: psycopg2.extensions.connection, records: List[Dict[str, Any]], batch_size: int = 100) -> None:
    """
    Load parking data using direct database connection with PostGIS geometry support.
    
    Args:
        conn: psycopg2 database connection
        records: List of processed parking records
        batch_size: Number of records to insert per batch
    """
    total_inserted = 0
    errors = 0
    
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        
        try:
            with conn.cursor() as cur:
                for record in batch:
                    lat = record.get("latitude")
                    lon = record.get("longitude")
                    
                    if lat is None or lon is None:
                        print(f"Warning: Record {record.get('station_id')} missing coordinates, skipping")
                        continue
                    
                    # Build the upsert query with PostGIS geometry
                    cur.execute("""
                        INSERT INTO municipal_parking (
                            station_id, borough, number_of_spaces, latitude, longitude,
                            jurisdiction, location_fr, location_en, hours_fr, hours_en,
                            note_fr, note_en, payment_type, geometry, updated_at
                        ) VALUES (
                            %(station_id)s, %(borough)s, %(number_of_spaces)s, %(latitude)s, %(longitude)s,
                            %(jurisdiction)s, %(location_fr)s, %(location_en)s, %(hours_fr)s, %(hours_en)s,
                            %(note_fr)s, %(note_en)s, %(payment_type)s,
                            ST_SetSRID(ST_MakePoint(%(longitude)s, %(latitude)s), 4326), now()
                        )
                        ON CONFLICT (station_id) DO UPDATE SET
                            borough = EXCLUDED.borough,
                            number_of_spaces = EXCLUDED.number_of_spaces,
                            latitude = EXCLUDED.latitude,
                            longitude = EXCLUDED.longitude,
                            jurisdiction = EXCLUDED.jurisdiction,
                            location_fr = EXCLUDED.location_fr,
                            location_en = EXCLUDED.location_en,
                            hours_fr = EXCLUDED.hours_fr,
                            hours_en = EXCLUDED.hours_en,
                            note_fr = EXCLUDED.note_fr,
                            note_en = EXCLUDED.note_en,
                            payment_type = EXCLUDED.payment_type,
                            geometry = EXCLUDED.geometry,
                            updated_at = now()
                    """, record)
                
                conn.commit()
                total_inserted += len(batch)
                print(f"Upserted batch {i // batch_size + 1} ({len(batch)} records)")
                
        except Exception as e:
            conn.rollback()
            errors += len(batch)
            print(f"Error inserting batch {i // batch_size + 1}: {str(e)}")
            # Try inserting records one by one to identify problematic records
            for record in batch:
                try:
                    with conn.cursor() as cur:
                        lat = record.get("latitude")
                        lon = record.get("longitude")
                        
                        if lat is None or lon is None:
                            print(f"Warning: Record {record.get('station_id')} missing coordinates, skipping")
                            continue
                        
                        cur.execute("""
                            INSERT INTO municipal_parking (
                                station_id, borough, number_of_spaces, latitude, longitude,
                                jurisdiction, location_fr, location_en, hours_fr, hours_en,
                                note_fr, note_en, payment_type, geometry, updated_at
                            ) VALUES (
                                %(station_id)s, %(borough)s, %(number_of_spaces)s, %(latitude)s, %(longitude)s,
                                %(jurisdiction)s, %(location_fr)s, %(location_en)s, %(hours_fr)s, %(hours_en)s,
                                %(note_fr)s, %(note_en)s, %(payment_type)s,
                                ST_SetSRID(ST_MakePoint(%(longitude)s, %(latitude)s), 4326), now()
                            )
                            ON CONFLICT (station_id) DO UPDATE SET
                                borough = EXCLUDED.borough,
                                number_of_spaces = EXCLUDED.number_of_spaces,
                                latitude = EXCLUDED.latitude,
                                longitude = EXCLUDED.longitude,
                                jurisdiction = EXCLUDED.jurisdiction,
                                location_fr = EXCLUDED.location_fr,
                                location_en = EXCLUDED.location_en,
                                hours_fr = EXCLUDED.hours_fr,
                                hours_en = EXCLUDED.hours_en,
                                note_fr = EXCLUDED.note_fr,
                                note_en = EXCLUDED.note_en,
                                payment_type = EXCLUDED.payment_type,
                                geometry = EXCLUDED.geometry,
                                updated_at = now()
                        """, record)
                        conn.commit()
                        total_inserted += 1
                except Exception as err:
                    conn.rollback()
                    print(f"  Error inserting station_id {record.get('station_id')}: {str(err)}")
                    errors += 1
    
    print(f"\nSummary:")
    print(f"  Total records processed: {len(records)}")
    print(f"  Successfully upserted: {total_inserted}")
    print(f"  Errors: {errors}")


def main():
    """Main function"""
    print("Starting municipal parking data load...")
    
    # Fetch data
    data = fetch_parking_data()
    if not data:
        print("Failed to fetch parking data. Exiting.")
        return
    
    # Load data to Supabase
    load_parking_data_to_supabase(data)
    
    print("Municipal parking data load completed.")


if __name__ == "__main__":
    main()

