#!/bin/bash
# Cleanup stale OpenClaw session locks on startup

LOCKS_DIR="/data/.openclaw/agents/main/sessions"
LOCK_PATTERN="*.jsonl.lock"
LOG_FILE="/tmp/openclaw/cleanup.log"
GRACE_PERIOD=3600  # 1 hour in seconds

mkdir -p "$(dirname "$LOG_FILE")"

# Function to log
log_msg() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_msg "🔍 Scanning for stale locks in $LOCKS_DIR"

# Find and remove stale locks
cleaned=0
for lock_file in "$LOCKS_DIR"/$LOCK_PATTERN; do
  if [ ! -f "$lock_file" ]; then
    continue
  fi
  
  # Extract PID from lock file
  pid=$(grep -oP '"pid":\s*\K[0-9]+' "$lock_file" 2>/dev/null || echo "unknown")
  
  # Check if process is alive
  if [ "$pid" != "unknown" ] && ! kill -0 "$pid" 2>/dev/null; then
    # Check if lock is older than grace period
    lock_age=$(($(date +%s) - $(stat -f%m "$lock_file" 2>/dev/null || stat -c%Y "$lock_file")))
    
    if [ "$lock_age" -gt "$GRACE_PERIOD" ]; then
      log_msg "🗑️  Removing stale lock for dead PID $pid: $lock_file"
      rm -f "$lock_file"
      ((cleaned++))
    fi
  fi
done

if [ "$cleaned" -gt 0 ]; then
  log_msg "✅ Cleaned $cleaned stale lock(s)"
else
  log_msg "✅ No stale locks found"
fi
