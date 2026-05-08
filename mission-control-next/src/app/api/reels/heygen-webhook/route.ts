import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { uploadToR2 } from '@/lib/reels/r2';

function timingSafeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(req: Request) {
  const expected = process.env.HEYGEN_WEBHOOK_SECRET;
  if (!expected) {
    console.error('heygen-webhook: HEYGEN_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const provided = req.headers.get('x-heygen-secret') ?? '';
  if (!provided || !timingSafeEq(provided, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { video_id?: string; status?: string; video_url?: string; duration?: number; error?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const heygenVideoId = body.video_id;
  if (!heygenVideoId) {
    return NextResponse.json({ error: 'Missing video_id in body' }, { status: 400 });
  }

  const { data: quote, error: qErr } = await supabaseAdmin
    .from('author_quotes')
    .select('id, status, r2_video_url')
    .eq('heygen_video_id', heygenVideoId)
    .maybeSingle();

  if (qErr) {
    console.error('heygen-webhook DB error:', qErr);
    return NextResponse.json({ error: qErr.message }, { status: 500 });
  }
  if (!quote) {
    console.warn('heygen-webhook: no row matches', heygenVideoId);
    return NextResponse.json({ ok: true, note: 'no matching row' });
  }

  if (body.status === 'failed') {
    const { error } = await supabaseAdmin
      .from('author_quotes')
      .update({
        status: 'rejected',
        rejection_reason: `HeyGen video generation failed: ${body.error ?? 'unknown'}`,
        rejected_at: new Date().toISOString(),
      })
      .eq('id', quote.id);
    if (error) {
      console.error('heygen-webhook reject DB error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, marked: 'rejected' });
  }

  if (body.status !== 'completed') {
    return NextResponse.json({ ok: true, ignored: body.status ?? 'unknown' });
  }

  if (!body.video_url) {
    return NextResponse.json({ error: 'completed status without video_url' }, { status: 400 });
  }

  if (quote.r2_video_url) {
    return NextResponse.json({ ok: true, note: 'already uploaded' });
  }

  let mp4: Buffer;
  try {
    const dl = await fetch(body.video_url);
    if (!dl.ok) throw new Error(`download HTTP ${dl.status}`);
    mp4 = Buffer.from(await dl.arrayBuffer());
  } catch (err) {
    console.error('heygen-webhook download error:', err);
    return NextResponse.json(
      { error: `Download failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 },
    );
  }

  const { data: r2Key, error: keyErr } = await supabaseAdmin.rpc('generate_r2_key_for_quote', {
    quote_id: quote.id,
  });
  if (keyErr || !r2Key) {
    console.error('heygen-webhook key gen error:', keyErr);
    return NextResponse.json({ error: keyErr?.message ?? 'R2 key generator returned empty' }, { status: 500 });
  }

  const { data: publicUrl, error: urlErr } = await supabaseAdmin.rpc('generate_public_url_for_quote', {
    quote_id: quote.id,
  });
  if (urlErr || !publicUrl) {
    console.error('heygen-webhook url gen error:', urlErr);
    return NextResponse.json({ error: urlErr?.message ?? 'Public URL generator returned empty' }, { status: 500 });
  }

  try {
    await uploadToR2({ key: r2Key, body: mp4, contentType: 'video/mp4' });
  } catch (err) {
    console.error('heygen-webhook R2 upload error:', err);
    return NextResponse.json(
      { error: `R2 upload failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 },
    );
  }

  const { error: upErr } = await supabaseAdmin
    .from('author_quotes')
    .update({
      r2_video_url: publicUrl,
      r2_video_key: r2Key,
      status: 'video_pending',
    })
    .eq('id', quote.id);

  if (upErr) {
    console.error('heygen-webhook DB update error:', upErr);
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, key: r2Key, url: publicUrl, bytes: mp4.length });
}
