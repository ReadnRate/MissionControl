import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GOG_KEYRING_PASSWORD_FILE = '/data/.openclaw/workspace/credentials/.gog_keyring_password';
const GOG_ACCOUNT = 'manu.denault@gmail.com';

// ── GOG helpers ─────────────────────────────────────────────────────
function getKeyringPassword(): string {
  try {
    return require('fs').readFileSync(GOG_KEYRING_PASSWORD_FILE, 'utf8').trim();
  } catch {
    return process.env.GOG_KEYRING_PASSWORD || '';
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function gogCommand(cmd: string): any {
  const env = {
    ...process.env,
    GOG_KEYRING_PASSWORD: getKeyringPassword(),
    GOG_ACCOUNT,
  };
  try {
    const out = execSync(`gog ${cmd}`, { env, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    return JSON.parse(out);
  } catch (e: any) {
    console.error('gog error:', e.message);
    return null;
  }
}

// ── Email Classification ─────────────────────────────────────────────
function classifyEmail(email: { from?: string; subject?: string; body?: string }): 'readnrate' | 'trym' | 'both' | 'ignore' {
  const text = ((email.subject || '') + ' ' + (email.body || '')).toLowerCase();
  const from = ((email.from || '')).toLowerCase();

  const spamDomains = ['aliexpress', 'groupon', 'gearbest', 'temu', 'shein', 'lightinthebox', 'banggood', 'gearbest', 'tomtop', 'miniinthebox', 'dx'];
  if (spamDomains.some(d => from.includes(d))) return 'ignore';

  const spamSubjects = ['lottery', 'winner', 'you have won', '90% off', 'clearance sale', 'unsubscribe', 'claim prize'];
  if (spamSubjects.some(k => (email.subject || '').toLowerCase().includes(k))) return 'ignore';

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

// ── Extract URLs from text ───────────────────────────────────────────
function extractUrls(text: string): string[] {
  if (!text) return [];
  const matches = (text.match(/https?:\/\/[^\s"'<>]+/gi) || []) as string[];
  return [...new Set(matches)].filter(u => !u.includes('google.com/url') && !u.includes('click.track'));
}

// ── GET /api/emails ──────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    // 1. Fetch from Supabase first (cached/prior emails)
    const { data: cachedEmails } = await supabase
      .from('email_leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    // 2. Refresh latest emails from Gmail (last 7 days)
    let gmailEmails: any[] = [];
    try {
      const raw = gogCommand('gmail messages search "in:inbox newer_than:7d" --max 50 --json');
      if (Array.isArray(raw)) gmailEmails = raw;
      else if (raw && Array.isArray(raw.messages)) gmailEmails = raw.messages;
      else gmailEmails = [];
    } catch {
      gmailEmails = [];
    }

    // 3. Deduplicate by threadId
    const seen = new Set<string>();
    gmailEmails = gmailEmails.filter((e: any) => {
      const tid = e.threadId || e.id;
      if (seen.has(tid)) return false;
      seen.add(tid);
      return true;
    });

    // 4. Process new emails — classify & upsert to Supabase
    const processedEmails = [];
    for (const gmailEmail of gmailEmails) {
      const gmailId = gmailEmail.id || gmailEmail.messageId;
      if (!gmailId) continue;

      // Check if already in DB
      const existing = (cachedEmails || []).find((c: any) => c.gmail_id === gmailId);

      if (!existing) {
        // New email — classify it
        const classification = classifyEmail({
          from: gmailEmail.from || '',
          subject: gmailEmail.subject || '',
          body: gmailEmail.snippet || '',
        });

        // Skip 'ignore' — mark as such in DB (they will be hidden in UI)
        // Get full body for non-ignore emails
        let fullBody = gmailEmail.snippet || '';
        let urls: string[] = [];
        if (classification !== 'ignore') {
          try {
            const full = gogCommand(`gmail get ${gmailId} --json`);
            fullBody = full.body || full.snippet || gmailEmail.snippet || '';
            urls = extractUrls(fullBody);
          } catch { /* ignore */ }
        }

        const { error: upsertError } = await supabase
          .from('email_leads')
          .upsert({
            gmail_id: gmailId,
            thread_id: gmailEmail.threadId || gmailId,
            subject: (gmailEmail.subject || '(sans objet)').substring(0, 500),
            from_email: gmailEmail.from || 'Inconnu',
            body_preview: fullBody.substring(0, 300),
            classification,
            status: classification === 'ignore' ? 'deleted' : 'pending',
            urls,
            created_at: gmailEmail.date ? new Date(gmailEmail.date) : new Date(),
            updated_at: new Date(),
          }, { onConflict: 'gmail_id' });

        if (!upsertError) {
          processedEmails.push({
            gmail_id: gmailId,
            thread_id: gmailEmail.threadId || gmailId,
            subject: (gmailEmail.subject || '(sans objet)').substring(0, 500),
            from_email: gmailEmail.from || 'Inconnu',
            body_preview: fullBody.substring(0, 300),
            classification,
            status: classification === 'ignore' ? 'deleted' : 'pending',
            urls,
            created_at: gmailEmail.date || new Date().toISOString(),
          });
        }
      } else {
        processedEmails.push(existing);
      }
    }

    // 5. Merge: DB emails + newly processed, dedupe by threadId
    const allEmails: any[] = [...processedEmails];
    for (const cached of (cachedEmails || [])) {
      if (!allEmails.find(e => e.gmail_id === cached.gmail_id)) {
        allEmails.push(cached);
      }
    }

    // 6. Deduplicate by threadId — keep newest per thread
    const byThread: Record<string, any> = {};
    for (const email of allEmails) {
      const tid = email.thread_id || email.gmail_id;
      if (!byThread[tid] || new Date(email.created_at) > new Date(byThread[tid].created_at)) {
        byThread[tid] = email;
      }
    }

    const finalEmails = Object.values(byThread) as any[];
    finalEmails.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ emails: finalEmails });
  } catch (error: any) {
    console.error('GET /api/emails error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
