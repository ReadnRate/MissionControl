#!/usr/bin/env node
// Entry point for cron: delegates to bin/leads/enrich-trym-leads.js
const path = require('path');
const { spawnSync } = require('child_process');
const result = spawnSync(
  process.execPath,
  [path.join(__dirname, 'leads', 'enrich-trym-leads.js'), ...process.argv.slice(2)],
  { stdio: 'inherit' }
);
process.exit(result.status || 0);
