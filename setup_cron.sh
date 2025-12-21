#!/bin/bash
# Script to set up cron job for fetch_planifications.py
# This will add a cron job to run the script every hour

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WRAPPER_SCRIPT="$SCRIPT_DIR/run_fetch_planifications.sh"

# Ensure the wrapper script is executable
chmod +x "$WRAPPER_SCRIPT"

# Create logs directory
mkdir -p "$SCRIPT_DIR/logs"

# Get the current user's crontab
CRON_TEMP=$(mktemp)
crontab -l > "$CRON_TEMP" 2>/dev/null || true

# Check if the cron job already exists
if grep -q "run_fetch_planifications.sh" "$CRON_TEMP"; then
    echo "Cron job already exists. Removing old entry..."
    grep -v "run_fetch_planifications.sh" "$CRON_TEMP" > "${CRON_TEMP}.new"
    mv "${CRON_TEMP}.new" "$CRON_TEMP"
fi

# Add the new cron job (runs every hour at minute 0)
# Format: minute hour day month weekday command
echo "0 * * * * $WRAPPER_SCRIPT" >> "$CRON_TEMP"

# Install the new crontab
crontab "$CRON_TEMP"
rm "$CRON_TEMP"

echo "✓ Cron job installed successfully!"
echo ""
echo "The script will run every hour at minute 0 (e.g., 1:00, 2:00, 3:00, etc.)"
echo ""
echo "To view your cron jobs, run: crontab -l"
echo "To remove the cron job, run: crontab -e (then delete the line)"
echo ""
echo "Logs will be saved to: $SCRIPT_DIR/logs/"

