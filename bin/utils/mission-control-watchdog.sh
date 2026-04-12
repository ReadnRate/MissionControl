#!/bin/bash
if ! /data/.npm-global/lib/node_modules/pm2/bin/pm2 jlist | grep -q '"name":"mission-backend"'; then
  echo "[$(date)] mission-backend not found in PM2! Resurrecting..."
  /data/.npm-global/lib/node_modules/pm2/bin/pm2 resurrect
else
  echo "[$(date)] Mission Control is running."
fi
