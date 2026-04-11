#!/bin/bash
echo "Starting Massive Lead Gen batch..."
python3 /data/.openclaw/workspace/bin/massive-lead-gen.py > /data/.openclaw/workspace/logs/lead-gen.log 2>&1 &
echo "Process started in background."
