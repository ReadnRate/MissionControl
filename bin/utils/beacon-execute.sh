#!/bin/bash
# Hook triggered by heartbeat when trigger file exists
if [ -f /data/.openclaw/workspace/inbox/beacon_trigger.json ]; then
  cat /data/.openclaw/workspace/inbox/beacon_trigger.json
fi
