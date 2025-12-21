# Cron Job Setup for fetch_planifications.py

This document explains how to set up a cron job to run `fetch_planifications.py` every hour.

## Quick Setup

Run the setup script:

```bash
./setup_cron.sh
```

This will:

- Make the wrapper script executable
- Create a logs directory
- Add a cron job that runs every hour
- Set up proper logging

## Manual Setup

If you prefer to set up the cron job manually:

1. **Make the wrapper script executable:**

   ```bash
   chmod +x run_fetch_planifications.sh
   ```

2. **Create logs directory:**

   ```bash
   mkdir -p logs
   ```

3. **Edit your crontab:**

   ```bash
   crontab -e
   ```

4. **Add this line (replace with your actual path):**
   ```
   0 * * * * /Users/poboisvert/Desktop/GIT/info-neige-MTL/run_fetch_planifications.sh
   ```

## Cron Schedule Format

The cron job runs every hour at minute 0:

- `0 * * * *` means: minute 0 of every hour, every day, every month, every day of week

To change the schedule:

- Every 30 minutes: `*/30 * * * *`
- Every 15 minutes: `*/15 * * * *`
- Every 2 hours: `0 */2 * * *`
- At specific times: `0 8,12,18 * * *` (8 AM, 12 PM, 6 PM)

## Logs

Logs are stored in the `logs/` directory:

- Individual run logs: `logs/fetch_planifications_YYYYMMDD_HHMMSS.log`
- Error log: `logs/fetch_planifications_errors.log`

## Viewing Cron Jobs

To view your current cron jobs:

```bash
crontab -l
```

## Removing the Cron Job

To remove the cron job:

```bash
crontab -e
```

Then delete the line containing `run_fetch_planifications.sh`

Or remove all cron jobs:

```bash
crontab -r
```

## macOS Specific Notes

On macOS, you may need to grant Full Disk Access to cron:

1. Go to **System Settings** > **Privacy & Security** > **Full Disk Access**
2. Click the **+** button
3. Navigate to `/usr/sbin/cron` and add it
4. Restart your Mac or run: `sudo launchctl stop com.apple.cron` then `sudo launchctl start com.apple.cron`

Alternatively, you can use `launchd` instead of cron on macOS (see below).

## Using launchd (macOS Alternative)

On macOS, you can use `launchd` instead of cron. Create a plist file:

```bash
# Create the plist file
cat > ~/Library/LaunchAgents/com.fetchplanifications.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.fetchplanifications</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/poboisvert/Desktop/GIT/info-neige-MTL/run_fetch_planifications.sh</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/Users/poboisvert/Desktop/GIT/info-neige-MTL/logs/launchd.out.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/poboisvert/Desktop/GIT/info-neige-MTL/logs/launchd.err.log</string>
</dict>
</plist>
EOF

# Load the job
launchctl load ~/Library/LaunchAgents/com.fetchplanifications.plist

# To unload: launchctl unload ~/Library/LaunchAgents/com.fetchplanifications.plist
```

## Troubleshooting

### Check if cron is running

```bash
# On macOS, check if cron daemon is running
sudo launchctl list | grep cron
```

### View system logs

```bash
# macOS
log show --predicate 'process == "cron"' --last 1h
```

### Test the wrapper script manually

```bash
./run_fetch_planifications.sh
```

### Check script permissions

```bash
ls -l run_fetch_planifications.sh
# Should show: -rwxr-xr-x (executable)
```

## Notes

- The script automatically activates the virtual environment
- The script exits when completed (process terminates naturally)
- Each run creates a timestamped log file
- Errors are also logged to a separate error log file
- The script changes to the correct directory before running
