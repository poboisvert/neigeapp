#!/bin/bash
# Wrapper script to run fetch_planifications.py with proper environment setup
# This script is designed to be run from cron

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

# Set up logging
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/fetch_planifications_$(date +%Y%m%d_%H%M%S).log"
ERROR_LOG="$LOG_DIR/fetch_planifications_errors.log"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting fetch_planifications.py"
log "Working directory: $SCRIPT_DIR"

# Activate virtual environment
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    log "Virtual environment activated"
else
    log "ERROR: Virtual environment not found at venv/bin/activate"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Virtual environment not found" >> "$ERROR_LOG"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    log "WARNING: .env file not found"
fi

# Run the Python script
log "Executing fetch_planifications.py..."
python3 fetch_planifications_batch.py >> "$LOG_FILE" 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    log "fetch_planifications.py completed successfully"
else
    log "ERROR: fetch_planifications.py exited with code $EXIT_CODE"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] fetch_planifications.py exited with code $EXIT_CODE" >> "$ERROR_LOG"
fi

# Deactivate virtual environment
deactivate 2>/dev/null

log "Script execution finished"
exit $EXIT_CODE

