#!/usr/bin/env node
/**
 * author-daily-scheduler.js — PM2-managed daily lead gen runner
 * Runs /data/.openclaw/workspace/bin/author-daily-gen.js once per day at 8 AM EST
 * Checks time every minute — when 8 AM EST hits, runs the script.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCRIPT = path.join(__dirname, 'author-daily-gen.js');
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT ?? path.join(__dirname, '../..');
const LAST_RUN_FILE = path.join(WORKSPACE_ROOT, 'inbox/.author_daily_lastrun');
const CHECK_INTERVAL_MS = 60 * 1000; // check every minute

function getEasternNow() {
  // Approximate EST (UTC-5, no DST adjustment)
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc - 5 * 3600000);
}

function shouldRunToday() {
  try {
    if (fs.existsSync(LAST_RUN_FILE)) {
      const last = fs.readFileSync(LAST_RUN_FILE, 'utf8').trim();
      const lastDate = new Date(last);
      const today = getEasternNow().toDateString();
      if (lastDate.toDateString() === today) return false;
    }
  } catch (_) {}
  return true;
}

function markRan() {
  fs.writeFileSync(LAST_RUN_FILE, getEasternNow().toISOString(), 'utf8');
}

function runScript() {
  return new Promise((resolve) => {
    console.log('[scheduler] 8 AM EST — launching author-daily-gen.js...');
    const child = spawn('node', [SCRIPT], { cwd: __dirname });
    let out = '';
    child.stdout.on('data', d => out += d.toString());
    child.stderr.on('data', d => out += d.toString());
    child.on('close', code => {
      console.log(`[scheduler] author-daily-gen.js finished (code ${code})`);
      if (out.includes('Added')) console.log('[scheduler] ' + out.split('\n').filter(l => l.includes('Added') || l.includes('✅')).slice(0,3).join('\n'));
      markRan();
      resolve();
    });
    child.on('error', err => { console.error('[scheduler] Error:', err.message); resolve(); });
  });
}

async function checkAndRun() {
  const now = getEasternNow();
  const hour = now.getHours();
  const min = now.getMinutes();
  console.log(`[scheduler] Check: ${now.toISOString()} EST=${hour}:${min.toString().padStart(2,'0')}`);
  if (hour === 8 && min <= 5 && shouldRunToday()) {
    await runScript();
  }
}

console.log('[author-daily-scheduler] Started. Checking for 8 AM EST run...');
checkAndRun();
setInterval(checkAndRun, CHECK_INTERVAL_MS);
