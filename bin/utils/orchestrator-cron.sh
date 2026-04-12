#!/bin/bash
# Ce script roule toutes les minutes via le cron du serveur ou OpenClaw Heartbeat
cd /data/.openclaw/workspace/bin
OUTPUT=$(node check-orchestrator-events-rest.js)

if [[ "$OUTPUT" != *"NO_EVENTS"* ]]; then
  echo "[CRON] Events detected! Waking up Main Agent."
  # Trigger the heartbeat logic to ping the agent
  echo "New orchestrator events found. Review orchestrator_events table." > /data/.openclaw/workspace/inbox/events.txt
fi
