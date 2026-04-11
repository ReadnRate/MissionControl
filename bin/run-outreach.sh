#!/bin/bash
export $(grep -v '^#' /data/.openclaw/workspace/.env | xargs)
cd /data/.openclaw/workspace
python3 scripts/outreach_sender.py >> /data/.openclaw/workspace/logs/outreach.log 2>&1
echo "Exit code: $?" >> /data/.openclaw/workspace/logs/outreach.log
