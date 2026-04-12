#!/usr/bin/env node
/**
 * email-watcher.js — Lightweight email poller using AgentMail REST API (PM2-managed, zero AI context)
 * Checks AgentMail every 5 minutes. If new emails found, writes to inbox/emails.jsonl
 * and sets a trigger flag. OpenClaw Heartbeat picks it up on next ping.
 */
const fs = require('fs');
const https = require('https');
const http = require('http');

const INBOX = 'joebot@agentmail.to';
const STATE_FILE = '/data/.openclaw/workspace/inbox/.last_email_id';
const EMAILS_FILE = '/data/.openclaw/workspace/inbox/emails.jsonl';
const TRIGGER_FILE = '/data/.openclaw/workspace/inbox/.email_trigger';
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

let lastProcessedId = null;

function getLastProcessed() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return fs.readFileSync(STATE_FILE, 'utf8').trim();
    }
  } catch (_) {}
  return null;
}

function setLastProcessed(msgId) {
  fs.writeFileSync(STATE_FILE, msgId, 'utf8');
}

function apiRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, 'https://api.agentmail.to');
    const reqOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.AGENTMAIL_API_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };
    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (_) { resolve(data); }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function getMessages() {
  return apiRequest(`/v0/inboxes/${encodeURIComponent(INBOX)}/messages?limit=20`);
}

async function getMessage(messageId) {
  return apiRequest(`/v0/inboxes/${encodeURIComponent(INBOX)}/messages/${messageId}`);
}

async function main() {
  const apiKey = process.env.AGENTMAIL_API_KEY;
  if (!apiKey) {
    console.error('[email-watcher] AGENTMAIL_API_KEY not set, exiting.');
    process.exit(1);
  }

  lastProcessedId = getLastProcessed();
  console.log(`[email-watcher] Started. Last processed: ${lastProcessedId || '(none)'}`);

  await poll(); // Run immediately on start
  setInterval(poll, POLL_INTERVAL_MS);
}

async function poll() {
  try {
    const messagesData = await getMessages();
    // Handle { messages: [...] } or direct array
    const messages = messagesData.messages || messagesData || [];

    const newMessages = [];
    for (const msg of messages) {
      if (msg.message_id === lastProcessedId || msg.id === lastProcessedId) break;
      newMessages.push(msg);
    }

    if (newMessages.length > 0) {
      for (const msg of newMessages.reverse()) {
        const msgId = msg.message_id || msg.id;
        let body = msg.preview || msg.text || msg.html || '';
        try {
          const full = await getMessage(msgId);
          body = full.text || full.html || full.preview || body;
        } catch (_) {}

        const record = JSON.stringify({
          id: msgId,
          from: msg.from || msg.from_ || msg.sender || '',
          subject: msg.subject || '(no subject)',
          body,
          received_at: msg.created_at || msg.timestamp || new Date().toISOString()
        });

        fs.appendFileSync(EMAILS_FILE, record + '\n', 'utf8');
        console.log(`[email-watcher] New email: ${msg.subject || '(no subject)'} from ${msg.from || msg.from_ || '?'}`);
      }

      const newestId = newMessages[newMessages.length - 1].message_id || newMessages[newMessages.length - 1].id;
      setLastProcessed(newestId);
      fs.writeFileSync(TRIGGER_FILE, new Date().toISOString(), 'utf8');
      console.log(`[email-watcher] Trigger set. Total new: ${newMessages.length}`);
    } else {
      console.log(`[email-watcher] No new emails.`);
    }
  } catch (err) {
    console.error(`[email-watcher] Error polling: ${err.message}`);
  }
}

process.on('SIGTERM', () => { console.log('[email-watcher] SIGTERM, exiting.'); process.exit(0); });
process.on('SIGINT',  () => { console.log('[email-watcher] SIGINT, exiting.');  process.exit(0); });

main();
