#!/usr/bin/env node
/**
 * orchestrator-watcher.js — Lightweight Supabase poller (PM2-managed, zero AI context)
 * Checks orchestrator_events table every 5 minutes. If pending events found,
 * writes to inbox/events.txt. OpenClaw Heartbeat picks it up on next ping.
 */
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zexumnlvkrjryvzrlavp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM';
const EVENTS_FILE = '/data/.openclaw/workspace/inbox/events.txt';
const TRIGGER_FILE = '/data/.openclaw/workspace/inbox/.orchestrator_trigger';
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('[orchestrator-watcher] Started.');
  await poll();
  setInterval(poll, POLL_INTERVAL_MS);
}

async function poll() {
  try {
    const { data, error } = await supabase
      .from('orchestrator_events')
      .select('*')
      .eq('status', 'pending')
      .limit(20);

    if (error) throw error;

    if (data && data.length > 0) {
      const summary = `[orchestrator-watcher] ${data.length} pending event(s) found at ${new Date().toISOString()}:\n` +
        data.map(e => `  - id=${e.id}, type=${e.event_type}, created=${e.created_at}`).join('\n');

      fs.writeFileSync(EVENTS_FILE, summary + '\n', 'utf8');
      fs.writeFileSync(TRIGGER_FILE, new Date().toISOString(), 'utf8');

      // Mark as processing to avoid re-processing
      for (const row of data) {
        await supabase.from('orchestrator_events').update({ status: 'processing' }).eq('id', row.id);
      }

      console.log(`[orchestrator-watcher] Events found: ${data.length}. Trigger set.`);
    } else {
      console.log('[orchestrator-watcher] No pending events.');
    }
  } catch (err) {
    console.error(`[orchestrator-watcher] Error: ${err.message}`);
  }
}

process.on('SIGTERM', () => { console.log('[orchestrator-watcher] SIGTERM, exiting.'); process.exit(0); });
process.on('SIGINT',  () => { console.log('[orchestrator-watcher] SIGINT, exiting.');  process.exit(0); });

main();
