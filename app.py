"""FastAPI application for Montreal snow planning data"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import os
import json
import zeep
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# Load environment variables from .env file
load_dotenv()

DEFAULT_URL = ('https://servicesenligne2.ville.montreal.qc.ca/api/infoneige/InfoneigeWebService?WSDL')

app = FastAPI(title="Info Neige MTL API", version="1.0.0")


def get_etat_deneig_status(etat: int) -> str:
    """Convert etatDeneig number to human-readable status string"""
    status_map = {
        1: "Déneigé",
        2: "Planifié",
        3: "Replanifié",
        4: "Sera replanifié ultérieurement",
        5: "Chargement en cours",
        10: "Dégagé (entre 2 chargements de neige)"
    }
    return status_map.get(etat, f"État inconnu ({etat})")


class PlanificationResponse(BaseModel):
    """Response model for planification data"""
    munid: int
    coteRueId: int
    etatDeneig: int
    status: str  # Human-readable status string
    dateDebutPlanif: Optional[str]
    dateFinPlanif: Optional[str]
    dateDebutReplanif: Optional[str]
    dateFinReplanif: Optional[str]
    dateMaj: Optional[str]
    streetFeature: Optional[Dict[str, Any]] = None  # Full feature object from gbdouble.json


def validate_date_format(date_str: str) -> bool:
    """Validate that date string is in format YYYY-MM-DDTHH:MM:SS"""
    try:
        datetime.strptime(date_str, '%Y-%m-%dT%H:%M:%S')
        return True
    except ValueError:
        return False


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
    """Client class for the PlanifNeige API without database storage"""
    
    def __init__(self, token: str, url: Optional[str] = None):
        self.transport = zeep.Transport()
        self.transport.session.headers['User-Agent'] = (
            "planif-neige-client https://github.com/poboisvert"
        )
        
        if url is None:
            url = DEFAULT_URL
        self.wsdl = url
        self.client = zeep.Client(wsdl=self.wsdl, transport=self.transport)
        self.token = token
    
    def get_planification_for_date(self, from_date: Optional[str] = None):
        """Get planification data from API for all streets since a specified date"""
        if from_date is None:
            # Default to 60 days ago if no date provided
            from_date = (
                datetime.now() - timedelta(days=60)
            ).replace(microsecond=0).isoformat()
        
        request = {'fromDate': from_date, 'tokenString': self.token}
        response = self.client.service.GetPlanificationsForDate(request)
        result = zeep.helpers.serialize_object(response)
        
        status = result.get('responseStatus', -1)
        if status != 0:
            raise HTTPException(
                status_code=400,
                detail=f"API returned status code: {status}"
            )
        
        planifications = result.get('planifications', {})
        planification_list = planifications.get('planification', [])
        
        # If single item, convert to list
        if isinstance(planification_list, dict):
            planification_list = [planification_list]
        
        # Convert datetime objects to strings for Pydantic validation
        planification_list = convert_datetime_to_string(planification_list)
        
        return planification_list
    
    def get_planification_for_street(self, street_side_id: int):
        """Get planification data for a specific street side"""
        # Get all recent planifications and filter
        planifications = self.get_planification_for_date()
        for planif in planifications:
            if planif.get('coteRueId') == street_side_id:
                return planif
        return None


# Global client instance (will be initialized with token)
client: Optional[PlanifNeigeClient] = None

# Global mapping from COTE_RUE_ID to full feature object
gbdouble_mapping: Dict[int, Dict[str, Any]] = {}


@app.on_event("startup")
async def startup_event():
    """Initialize the client on startup"""
    # Token can be set via .env file (TokenString) or environment variable (PLANIF_NEIGE_TOKEN)
    token = os.getenv("TokenString") or os.getenv("PLANIF_NEIGE_TOKEN", "")
    if not token:
        print("WARNING: TokenString or PLANIF_NEIGE_TOKEN not set in .env file or environment")
    else:
        print(f"Client initialized with token (first 20 chars): {token[:20]}...")
    global client
    client = PlanifNeigeClient(token)
    
    # Load gbdouble.json and create mapping from COTE_RUE_ID to full feature object
    global gbdouble_mapping
    try:
        print("Loading gbdouble.json...")
        with open("gbdouble.json", "r", encoding="utf-8") as f:
            geojson_data = json.load(f)
        
        features = geojson_data.get("features", [])
        for feature in features:
            properties = feature.get("properties", {})
            cote_rue_id = properties.get("COTE_RUE_ID")
            if cote_rue_id is not None:
                # Store the entire feature object (type, geometry, properties)
                gbdouble_mapping[cote_rue_id] = feature
        
        print(f"Loaded {len(gbdouble_mapping)} features from gbdouble.json")
    except FileNotFoundError:
        print("WARNING: gbdouble.json not found. Street features will not be included.")
    except Exception as e:
        print(f"WARNING: Error loading gbdouble.json: {str(e)}. Street features will not be included.")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Info Neige MTL API",
        "endpoints": {
            "/planifications": "Get all planifications since a date",
            "/planifications/{street_side_id}": "Get planification for a specific street side",
            "/health": "Health check"
        }
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "client_initialized": client is not None}


@app.get("/planifications", response_model=list[PlanificationResponse])
async def get_planifications(from_date: Optional[str] = None):
    """
    Get planification data for all streets since a specified date.
    
    Args:
        from_date: Date string in format YYYY-MM-DDTHH:MM:SS (e.g., '2024-12-09T08:00:00'). 
                   If not provided, defaults to 60 days ago.
    
    Returns:
        List of planification data
    """
    if client is None:
        raise HTTPException(
            status_code=500,
            detail="Client not initialized. Please set PLANIF_NEIGE_TOKEN environment variable."
        )
    
    # Validate date format if provided
    if from_date is not None:
        if not validate_date_format(from_date):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid date format: '{from_date}'. Expected format: YYYY-MM-DDTHH:MM:SS (e.g., '2024-12-09T08:00:00')"
            )
    
    try:
        planifications = client.get_planification_for_date(from_date)

        # Enrich planifications with status and street feature from gbdouble.json
        for planif in planifications:
            # Add human-readable status (always required)
            etat_deneig = planif.get('etatDeneig')
            planif['status'] = get_etat_deneig_status(etat_deneig) if etat_deneig is not None else "État inconnu"
            
            # Add full feature object from gbdouble.json if match found
            cote_rue_id = planif.get('coteRueId')
            if cote_rue_id and cote_rue_id in gbdouble_mapping:
                planif['streetFeature'] = gbdouble_mapping[cote_rue_id]

        # Prepare log content
        log_lines = []
        log_lines.append("\n" + "="*80)
        log_lines.append(f"Planification Data Retrieved: {len(planifications)} records")
        log_lines.append("="*80)
        for planif in planifications:
            log_lines.append(f"\nStreet Side ID: {planif.get('coteRueId')}")
            log_lines.append(f"  Municipality ID: {planif.get('munid')}")
            log_lines.append(f"  Snow Removal State: {planif.get('etatDeneig')} - {planif.get('status', 'N/A')}")
            log_lines.append(f"  Planning Start: {planif.get('dateDebutPlanif')}")
            log_lines.append(f"  Planning End: {planif.get('dateFinPlanif')}")
            log_lines.append(f"  Replanning Start: {planif.get('dateDebutReplanif')}")
            log_lines.append(f"  Replanning End: {planif.get('dateFinReplanif')}")
            log_lines.append(f"  Last Updated: {planif.get('dateMaj')}")
        log_lines.append("="*80 + "\n")

        # Print to console
        for l in log_lines:
            print(l)
        
        # Save log to a file
        try:
            with open("planification_log.txt", "a", encoding="utf-8") as log_file:
                for l in log_lines:
                    log_file.write(f"{l}\n")
        except Exception as log_error:
            print(f"Failed to write log file: {log_error}")

        return planifications
    except Exception as e:
        print(f"Error retrieving planifications: {str(e)}")
        # Also append error to log file
        try:
            with open("planification_log.txt", "a", encoding="utf-8") as log_file:
                log_file.write(f"Error retrieving planifications: {str(e)}\n")
        except Exception as log_error:
            print(f"Failed to write error to log file: {log_error}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/planifications/{street_side_id}", response_model=PlanificationResponse)
async def get_planification_for_street(street_side_id: int):
    """
    Get planification data for a specific street side.
    
    Args:
        street_side_id: The street side ID (coteRueId)
    
    Returns:
        Planification data for the specified street side
    """
    if client is None:
        raise HTTPException(
            status_code=500,
            detail="Client not initialized. Please set PLANIF_NEIGE_TOKEN environment variable."
        )
    
    try:
        planif = client.get_planification_for_street(street_side_id)
        
        if planif is None:
            raise HTTPException(
                status_code=404,
                detail=f"No planification found for street side ID: {street_side_id}"
            )
        
        # Enrich planification with status and street feature from gbdouble.json
        etat_deneig = planif.get('etatDeneig')
        planif['status'] = get_etat_deneig_status(etat_deneig) if etat_deneig is not None else "État inconnu"
        
        cote_rue_id = planif.get('coteRueId')
        if cote_rue_id and cote_rue_id in gbdouble_mapping:
            planif['streetFeature'] = gbdouble_mapping[cote_rue_id]
        
        # Print result as requested
        print("\n" + "="*80)
        print(f"Planification Data for Street Side ID: {street_side_id}")
        print("="*80)
        print(f"  Municipality ID: {planif.get('munid')}")
        print(f"  Snow Removal State: {planif.get('etatDeneig')} - {planif.get('status', 'N/A')}")
        print(f"  Planning Start: {planif.get('dateDebutPlanif')}")
        print(f"  Planning End: {planif.get('dateFinPlanif')}")
        print(f"  Replanning Start: {planif.get('dateDebutReplanif')}")
        print(f"  Replanning End: {planif.get('dateFinReplanif')}")
        print(f"  Last Updated: {planif.get('dateMaj')}")
        print("="*80 + "\n")
        
        return planif
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error retrieving planification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

