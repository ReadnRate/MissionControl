/**
 * Morning Brief Email Analyzer
 * - Classifies emails (spam → deleted from Gmail, relevant → shown in Mission Control /emails)
 * - No automatic task/intel creation — Manuel acts manually via the UI
 * - Sends a summary to the morning brief email
 */

const { Client } = require('pg');
const { execSync } = require('child_process');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// ── Config ────────────────────────────────────────────────────────
const DB_URL = 'postgresql://postgres.zexumnlvkrjryvzrlavp:MissionControl2026!@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const GOG_KEYRING_PASSWORD_FILE = '/data/.openclaw/workspace/credentials/.gog_keyring_password';
const GOG_ACCOUNT = 'manu.denault@gmail.com';
const MAX_EMAILS = 20;
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM';

// ── Helpers ───────────────────────────────────────────────────────
function gogKeyringPassword() {
  try {
    return execSync('cat ' + GOG_KEYRING_PASSWORD_FILE, { encoding: 'utf8' }).trim();
  } catch {
    return process.env.GOG_KEYRING_PASSWORD || '';
  }
}

function gog(command, extraEnv = {}) {
  const env = {
    ...process.env,
    GOG_KEYRING_PASSWORD: gogKeyringPassword(),
    GOG_ACCOUNT,
    ...extraEnv
  };
  try {
    const out = execSync(`gog ${command}`, { env, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    return JSON.parse(out);
  } catch (e) {
    return [];
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function webFetchTitle(url) {
  return new Promise(resolve => {
    try {
      const parsedUrl = new URL(url);
      const lib = parsedUrl.protocol === 'https:' ? https : http;
      const req = lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 6000 }, res => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          const titleMatch = data.match(/<title[^>]*>([^<]+)<\/title>/i);
          const title = titleMatch ? titleMatch[1].trim().substring(0, 200) : null;
          resolve({ url, title });
        });
      });
      req.on('error', () => resolve({ url, title: null }));
      req.on('timeout', () => { req.destroy(); resolve({ url, title: null }); });
    } catch {
      resolve({ url, title: null });
    }
  });
}

function extractUrls(text) {
  if (!text) return [];
  const matches = text.match(/https?:\/\/[^\s"'<>]+/gi) || [];
  return [...new Set(matches)].filter(u => !u.includes('google.com/url') && !u.includes('click.track'));
}

// ── DB helpers ────────────────────────────────────────────────────
async function dbQuery(sql, params = []) {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    return await client.query(sql, params);
  } finally {
    await client.end();
  }
}

// ── Email Classification ───────────────────────────────────────────
const SPAM_DOMAINS = ['aliexpress', 'groupon', 'gearbest', 'temu', 'shein', 'lightinthebox', 'banggood', 'gearbest', 'tomtop', 'miniinthebox', 'dx'];
const SPAM_KEYWORDS = ['lottery', 'winner', 'you have won', '90% off', 'clearance sale', 'unsubscribe', 'claim prize', 'clearance'];

function classifyProject(subject, body) {
  const text = (subject + ' ' + body).toLowerCase();
  const readnrateKeywords = ['book', 'author', 'kdp', 'indie publishing', 'kindle', 'ebook', 'review platform', 'self-publish', 'manuscript', 'literary', 'book review', 'author tool'];
  const trymKeywords = ['local business', 'directory', 'yelp', 'google business', 'review management', 'reputation', 'lead generation', 'enrichment', 'B2B SaaS', 'SMB tool', 'client acquisition', 'local marketing', 'business directory'];
  const bothKeywords = ['AI tool', 'SaaS', 'productivity', 'automation', 'no-code', 'low-code', 'API', 'webinar', 'marketing tool', 'email CRM', 'email marketing'];

  const isReadNrate = readnrateKeywords.some(k => text.includes(k));
  const isTrym = trymKeywords.some(k => text.includes(k));
  const isBoth = bothKeywords.some(k => text.includes(k));

  if (isBoth || (isReadNrate && isTrym)) return 'both';
  if (isReadNrate) return 'readnrate';
  if (isTrym) return 'trym';
  return 'ignore';
}

function isSpam(email) {
  const text = ((email.subject || '') + ' ' + (email.body || '')).toLowerCase();
  const from = ((email.from || '')).toLowerCase();
  if (SPAM_KEYWORDS.some(k => (email.subject || '').toLowerCase().includes(k))) return true;
  if (SPAM_DOMAINS.some(d => from.includes(d))) return true;
  return false;
}

// ── Upsert email_leads ─────────────────────────────────────────────
async function upsertEmailLead(emailData) {
  const { data, error } = await dbQuery(
    `INSERT INTO public.email_leads (gmail_id, thread_id, subject, from_email, body_preview, classification, status, urls, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
     ON CONFLICT (gmail_id) DO UPDATE SET
       subject = EXCLUDED.subject,
       body_preview = EXCLUDED.body_preview,
       classification = EXCLUDED.classification,
       urls = EXCLUDED.urls,
       updated_at = NOW()`,
    [
      emailData.gmail_id,
      emailData.thread_id,
      emailData.subject,
      emailData.from,
      emailData.body_preview,
      emailData.classification,
      emailData.status,
      JSON.stringify(emailData.urls || []),
    ]
  );
  if (error) console.error('upsertEmailLead error:', error);
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  const lines = [];
  lines.push('## 📬 Emails analysés — ' + new Date().toLocaleString('fr-FR', { timeZone: 'America/New_York' }));
  lines.push('');

  // 1. Fetch recent emails from Gmail (last 7 days)
  let emails = [];
  try {
    const result = gog(`gmail messages search "in:inbox newer_than:7d" --max ${MAX_EMAILS} --json`);
    emails = Array.isArray(result) ? result : (result.messages || []);
  } catch {
    emails = [];
  }

  // Deduplicate by threadId — keep newest
  const seen = new Set();
  const deduped = [];
  for (const email of emails) {
    const tid = email.threadId || email.id;
    if (!seen.has(tid)) {
      seen.add(tid);
      deduped.push(email);
    }
  }
  emails = deduped;

  lines.push(`**${emails.length} email(s) trouvé(s) dans la boîte de réception (7 derniers jours)**`);
  lines.push('');

  const spamToDelete = [];
  const relevantEmails = [];

  for (const email of emails) {
    const gmailId = email.id || email.messageId;
    if (!gmailId) continue;

    // Get full email body
    let fullEmail = { subject: email.subject, from: email.from, body: email.snippet || '' };
    try {
      const bodyStr = execSync(`gog gmail get ${gmailId} --json`, {
        env: { ...process.env, GOG_KEYRING_PASSWORD: gogKeyringPassword(), GOG_ACCOUNT },
        encoding: 'utf8',
        maxBuffer: 5 * 1024 * 1024
      });
      fullEmail = JSON.parse(bodyStr);
    } catch { /* use snippet */ }

    const headers = fullEmail.headers || {};
    const subject = headers.subject || fullEmail.subject || '(sans objet)';
    const from = headers.from || fullEmail.from || 'Inconnu';
    const bodyText = fullEmail.body || email.snippet || '';
    const urls = extractUrls(bodyText);

    // ── Classify ──
    if (isSpam({ subject, from, body: bodyText })) {
      spamToDelete.push(gmailId);
      lines.push(`### 🗑️ SPAM SUPPRIMÉ: ${subject}`);
      lines.push(`- **De:** ${from}`);
      lines.push('');
      continue;
    }

    const classification = classifyProject(subject, bodyText);

    if (classification === 'ignore') {
      // Auto-delete non-relevant emails
      spamToDelete.push(gmailId);
      lines.push(`### ⏭️ IGNORÉ & SUPPRIMÉ: ${subject}`);
      lines.push(`- **De:** ${from}`);
      lines.push('');
      continue;
    }

    // ── Relevant email — upsert to DB for Mission Control UI ──
    const urlInfo = [];
    for (const url of urls.slice(0, 4)) {
      const info = await webFetchTitle(url);
      if (info.title) urlInfo.push(info);
      await sleep(150);
    }

    await upsertEmailLead({
      gmail_id: gmailId,
      thread_id: email.threadId || gmailId,
      subject: subject.substring(0, 500),
      from,
      body_preview: bodyText.substring(0, 300),
      classification,
      status: 'pending',
      urls: urlInfo.map(u => ({ url: u.url, title: u.title })),
    });

    const projectBadge = classification === 'readnrate' ? '📚 Read & Rate'
      : classification === 'trym' ? '🔍 Trym' : '🌐 Both';
    const projectLabel = classification === 'readnrate' ? 'Read & Rate'
      : classification === 'trym' ? 'Trym' : 'Both';

    relevantEmails.push({ subject, from, classification, urls, urlInfo, gmailId });
    lines.push(`### ${projectBadge} [${projectLabel}] ${subject}`);
    lines.push(`- **De:** ${from}`);
    if (urlInfo.length > 0) {
      lines.push(`- **Liens:**`);
      for (const u of urlInfo) {
        lines.push(`  - ${u.title || u.url}`);
      }
    }
    lines.push('');
  }

  // ── Delete spam & irrelevant emails from Gmail ──
  if (spamToDelete.length > 0) {
    lines.push(`**Suppression de ${spamToDelete.length} email(s) de Gmail...**`);
    try {
      // Delete in batches of 10
      for (let i = 0; i < spamToDelete.length; i += 10) {
        const batch = spamToDelete.slice(i, i + 10);
        execSync(`gog gmail batch delete ${batch.join(' ')}`, {
          env: { ...process.env, GOG_KEYRING_PASSWORD: gogKeyringPassword(), GOG_ACCOUNT },
          encoding: 'utf8',
          maxBuffer: 1024 * 1024
        });
      }
      lines.push('✅ Emails supprimés avec succès.');
    } catch (e) {
      lines.push(`⚠️ Erreur lors de la suppression: ${e.message}`);
    }
    lines.push('');
  }

  // ── Action Required ──
  if (relevantEmails.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push(`**⚠️ ACTION REQUISE — ${relevantEmails.length} email(s) à traiter dans Mission Control**`);
    lines.push(`→ Voir [Mission Control /emails](https://mission-control.readnrate.com/emails) pour les classer en Task ou Intel`);
    lines.push('');
  }

  const report = lines.join('\n');
  console.log(report);

  // Save to /tmp for integration with send-morning-brief.sh
  require('fs').writeFileSync('/tmp/email-analyzer-report.md', report);
  require('fs').writeFileSync('/tmp/email-relevant-count.txt', String(relevantEmails.length));
}

main().catch(e => {
  console.error('Email analyzer error:', e.message);
  process.exit(1);
});
