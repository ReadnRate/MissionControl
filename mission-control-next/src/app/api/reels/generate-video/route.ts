import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';

const Body = z.object({
  quoteId: z.string().min(1),
});

const HEYGEN_ENDPOINT = 'https://api.heygen.com/v3/video-agents';

export async function POST(req: Request) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid request body', details: err instanceof z.ZodError ? err.issues : String(err) },
      { status: 400 },
    );
  }

  const apiKey = process.env.HEYGEN_API_KEY;
  const avatarId = process.env.HEYGEN_AVATAR_ID;
  const voiceId = process.env.HEYGEN_VOICE_ID;
  const webhookSecret = process.env.HEYGEN_WEBHOOK_SECRET;
  const baseUrl = process.env.PUBLIC_BASE_URL ?? 'https://mission.oliverowl.com';

  if (!apiKey || !avatarId || !voiceId || !webhookSecret) {
    return NextResponse.json(
      { error: 'HeyGen env vars not configured (need HEYGEN_API_KEY / HEYGEN_AVATAR_ID / HEYGEN_VOICE_ID / HEYGEN_WEBHOOK_SECRET)' },
      { status: 500 },
    );
  }

  const { data: quote, error: qErr } = await supabaseAdmin
    .from('author_quotes')
    .select('id, script, status, video_aspect_ratio')
    .eq('id', body.quoteId)
    .maybeSingle();

  if (qErr) {
    console.error('generate-video DB error:', qErr);
    return NextResponse.json({ error: qErr.message }, { status: 500 });
  }
  if (!quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
  }
  if (!quote.script || quote.script.trim().length === 0) {
    return NextResponse.json({ error: 'Quote has no script' }, { status: 409 });
  }

  const callbackUrl = `${baseUrl.replace(/\/$/, '')}/api/reels/heygen-webhook`;

  let heygenRes: Response;
  try {
    heygenRes = await fetch(HEYGEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: quote.script,
        avatar_id: avatarId,
        voice_id: voiceId,
        aspect_ratio: quote.video_aspect_ratio ?? '9:16',
        callback_url: callbackUrl,
        callback_secret: webhookSecret,
      }),
    });
  } catch (err) {
    console.error('generate-video HeyGen fetch error:', err);
    return NextResponse.json(
      { error: `HeyGen request failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 },
    );
  }

  const responseText = await heygenRes.text();
  let heygenJson: unknown = null;
  try {
    heygenJson = JSON.parse(responseText);
  } catch {
    /* leave as null */
  }

  if (!heygenRes.ok) {
    console.error(`generate-video HeyGen ${heygenRes.status}:`, responseText.slice(0, 500));
    return NextResponse.json(
      { error: `HeyGen ${heygenRes.status}: ${responseText.slice(0, 500)}` },
      { status: 502 },
    );
  }

  const heygenVideoId = extractVideoId(heygenJson);
  if (!heygenVideoId) {
    console.error('generate-video unexpected HeyGen response:', heygenJson);
    return NextResponse.json(
      { error: 'HeyGen response missing video_id', heygenResponse: heygenJson },
      { status: 502 },
    );
  }

  const { error: upErr } = await supabaseAdmin
    .from('author_quotes')
    .update({
      heygen_video_id: heygenVideoId,
      status: 'video_pending',
      video_generated_at: new Date().toISOString(),
    })
    .eq('id', body.quoteId);

  if (upErr) {
    console.error('generate-video DB update error:', upErr);
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  return NextResponse.json({ heygenVideoId });
}

function extractVideoId(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  if (typeof p.video_id === 'string') return p.video_id;
  if (typeof p.id === 'string') return p.id;
  const data = p.data;
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (typeof d.video_id === 'string') return d.video_id;
    if (typeof d.id === 'string') return d.id;
  }
  return null;
}
