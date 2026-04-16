import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GOG_KEYRING_PASSWORD_FILE = '/data/.openclaw/workspace/credentials/.gog_keyring_password';
const GOG_ACCOUNT = 'manu.denault@gmail.com';

function getKeyringPassword(): string {
  try {
    return require('fs').readFileSync(GOG_KEYRING_PASSWORD_FILE, 'utf8').trim();
  } catch {
    return process.env.GOG_KEYRING_PASSWORD || '';
  }
}

// ── Extract URLs ────────────────────────────────────────────────────
function extractUrls(text: string): { url: string; title: string | null; description: string | null }[] {
  if (!text) return [];
  const matches = (text.match(/https?:\/\/[^\s"'<>]+/gi) || []) as string[];
  const unique = [...new Set(matches)].filter(u => !u.includes('google.com/url') && !u.includes('click.track'));
  return unique.map(url => ({ url, title: null, description: null }));
}

// ── GET /api/emails/[id] ────────────────────────────────────────────
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check Supabase first
    const { data: email } = await supabase
      .from('email_leads')
      .select('*')
      .eq('gmail_id', id)
      .single();

    if (email) {
      // Already in DB — return cached
      return NextResponse.json({ email });
    }

    // Not cached — fetch directly from Gmail
    const env = {
      ...process.env,
      GOG_KEYRING_PASSWORD: getKeyringPassword(),
      GOG_ACCOUNT,
    };

    let fullEmail: any = {};
    try {
      const out = execSync(`gog gmail get ${id} --json`, {
        env,
        encoding: 'utf8',
        maxBuffer: 5 * 1024 * 1024,
      });
      fullEmail = JSON.parse(out);
    } catch {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    const body = fullEmail.body || fullEmail.snippet || '';
    const urls = extractUrls(body);

    const result = {
      gmail_id: id,
      thread_id: fullEmail.threadId || id,
      subject: fullEmail.headers?.subject || '(sans objet)',
      from_email: fullEmail.headers?.from || 'Inconnu',
      body_preview: body.substring(0, 300),
      body_full: body,
      urls,
      classification: null,
      status: 'pending',
    };

    return NextResponse.json({ email: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── DELETE /api/emails/[id] ─────────────────────────────────────────
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Mark as deleted in Supabase
    await supabase
      .from('email_leads')
      .update({ status: 'deleted', updated_at: new Date().toISOString() })
      .eq('gmail_id', id);

    // Delete from Gmail
    const env = {
      ...process.env,
      GOG_KEYRING_PASSWORD: getKeyringPassword(),
      GOG_ACCOUNT,
    };

    try {
      execSync(`gog gmail delete ${id}`, {
        env,
        encoding: 'utf8',
        maxBuffer: 1024 * 1024,
      });
    } catch (e) {
      console.error('Gmail delete error:', e);
    }

    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
