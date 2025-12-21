#!/usr/bin/env python3
"""Script to test different dates until the API returns data"""
import time
import sys
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
import zeep

# Load environment variables
load_dotenv()

DEFAULT_URL = 'https://servicesenligne2.ville.montreal.qc.ca/api/infoneige/InfoneigeWebService?WSDL'

def convert_datetime_to_string(obj):
    """Recursively convert datetime objects to ISO format strings"""
    if isinstance(obj, datetime):
        return obj.replace(microsecond=0).isoformat()
    elif isinstance(obj, dict):
        return {key: convert_datetime_to_string(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_datetime_to_string(item) for item in obj]
    return obj


def test_date(token: str, test_date: str, wsdl_url: str = DEFAULT_URL):
    """Test a specific date with the API"""
    try:
        transport = zeep.Transport()
        transport.session.headers['User-Agent'] = (
            "planif-neige-client https://github.com/poboisvert"
        )
        client = zeep.Client(wsdl=wsdl_url, transport=transport)
        
        request = {'fromDate': test_date, 'tokenString': token}
        response = client.service.GetPlanificationsForDate(request)
        result = zeep.helpers.serialize_object(response)
        
        status = result.get('responseStatus', -1)
        
        if status == 0:
            planifications = result.get('planifications', {})
            planification_list = planifications.get('planification', [])
            
            # If single item, convert to list
            if isinstance(planification_list, dict):
                planification_list = [planification_list]
            
            if planification_list:
                return True, len(planification_list), None
            else:
                return False, 0, f"Status {status}: No data returned"
        else:
            error_message = result.get('responseMessage', '')
            return False, 0, f"Status {status}: {error_message}"
            
    except Exception as e:
        return False, 0, str(e)


def main():
    """Main function to test dates"""
    # Get token from environment
    token = os.getenv("TokenString") or os.getenv("PLANIF_NEIGE_TOKEN", "")
    if not token:
        print("ERROR: TokenString or PLANIF_NEIGE_TOKEN not set in .env file or environment")
        sys.exit(1)
    
    # Get WSDL URL from environment if set
    wsdl_url = os.getenv("WSDL_URL", DEFAULT_URL)
    print(f"Using WSDL URL: {wsdl_url}")
    print(f"Token: {token[:20]}...")
    print("\nStarting date testing...")
    print("="*80)
    
    # Configuration
    wait_minutes = 5
    max_days_back = 365  # Try up to 1 year back
    start_date_str = os.getenv("START_DATE")  # Optional: start from a specific date
    
    # Determine starting date
    if start_date_str:
        try:
            current_date = datetime.strptime(start_date_str, '%Y-%m-%dT%H:%M:%S')
            print(f"Starting from provided date: {start_date_str}")
        except ValueError:
            print(f"Invalid START_DATE format. Using today instead.")
            current_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    else:
        # Start from today and go backwards
        current_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        print(f"Starting from today: {current_date.isoformat()}")
    
    attempt = 1
    log_file = "date_test_log.txt"
    
    # Write header to log file
    with open(log_file, "w", encoding="utf-8") as f:
        f.write(f"Date Testing Log - Started at {datetime.now().isoformat()}\n")
        f.write("="*80 + "\n\n")
    
    for days_back in range(max_days_back):
        test_date_str = current_date.isoformat()
        days_ago = (datetime.now() - current_date).days
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"\n[{timestamp}] Attempt #{attempt}")
        print(f"Testing date: {test_date_str} ({days_ago} days ago)")
        print(f"Waiting {wait_minutes} minutes before request...")
        
        # Log to file
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"[{timestamp}] Attempt #{attempt} - Testing date: {test_date_str}\n")
        
        # Wait 5 minutes before making the request
        print(f"Waiting {wait_minutes} minutes... (Press Ctrl+C to stop)")
        try:
            time.sleep(wait_minutes * 60)
        except KeyboardInterrupt:
            print("\n\nInterrupted by user. Stopping...")
            break
        
        print(f"Making API request...")
        success, count, error = test_date(token, test_date_str, wsdl_url)
        
        if success:
            print(f"\n{'='*80}")
            print(f"✅ SUCCESS! Data found for date: {test_date_str}")
            print(f"Number of records: {count}")
            print(f"{'='*80}\n")
            
            # Log success
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(f"✅ SUCCESS! Date: {test_date_str}, Records: {count}\n")
                f.write("="*80 + "\n")
            
            print(f"Results logged to: {log_file}")
            break
        else:
            print(f"  ❌ Failed: {error}")
            print(f"  Next attempt in {wait_minutes} minutes...")
            
            # Log failure
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(f"  ❌ Failed: {error}\n\n")
        
        # Move to previous day
        current_date = current_date - timedelta(days=1)
        attempt += 1
        
        # Safety check - don't go too far back
        if days_back >= max_days_back - 1:
            print(f"\n{'='*80}")
            print(f"Reached maximum days back ({max_days_back}). No data found.")
            print(f"{'='*80}\n")
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(f"\nReached maximum days back ({max_days_back}). No data found.\n")
            break
    
    print(f"\nTesting completed. Full log saved to: {log_file}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nScript interrupted by user.")
        sys.exit(0)

