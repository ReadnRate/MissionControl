#!/usr/bin/env node
/**
 * beacon-watcher.js — Lightweight Supabase poller for @Beacon mentions (PM2-managed)
 * Polls idea_comments for @Beacon mentions every 5 minutes.
 * If new triggers found, writes to inbox/beacon_trigger.json.
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://zexumnlvkrjryvzrlavp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM';
const TRIGGER_FILE = '/data/.openclaw/workspace/inbox/.beacon_trigger';
const POLL_INTERVAL_MS = 5 * 60 * 1000;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('[beacon-watcher] Started.');
  await poll();
  setInterval(poll, POLL_INTERVAL_MS);
}

async function poll() {
  try {
    const { data: comments } = await supabase
      .from('idea_comments')
      .select('id, idea_id, content, author, ideas(title, details)')
      .ilike('content', '%@Beacon%');

    if (!comments || comments.length === 0) {
      console.log('[beacon-watcher] No @Beacon mentions.');
      return;
    }

    const { data: sysComments } = await supabase
      .from('idea_comments')
      .select('idea_id')
      .eq('author', 'Beacon (Agent)');

    const handled = new Set((sysComments || []).map(c => c.idea_id));
    const newTriggers = comments.filter(c => !handled.has(c.idea_id));

    if (newTriggers.length > 0) {
      const triggerData = {
        triggers: newTriggers.map(c => ({
          idea_id: c.idea_id,
          content: c.content,
          author: c.author,
          idea_title: c.ideas?.title
        })),
        found_at: new Date().toISOString()
      };
      fs.writeFileSync(TRIGGER_FILE, JSON.stringify(triggerData, null, 2), 'utf8');
      console.log(`[beacon-watcher] ${newTriggers.length} new @Beacon trigger(s).`);
    } else {
      console.log('[beacon-watcher] @Beacon mentions found but already handled.');
    }
  } catch (err) {
    console.error(`[beacon-watcher] Error: ${err.message}`);
  }
}

process.on('SIGTERM', () => { console.log('[beacon-watcher] SIGTERM, exiting.'); process.exit(0); });
process.on('SIGINT',  () => { console.log('[beacon-watcher] SIGINT, exiting.');  process.exit(0); });

main();
