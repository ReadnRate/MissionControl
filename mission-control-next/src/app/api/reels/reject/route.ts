import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';

const Body = z.object({
  quoteId: z.string().min(1),
  reason: z.string().min(1).max(1000),
});

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

  const { data, error } = await supabaseAdmin
    .from('author_quotes')
    .update({
      status: 'rejected',
      rejection_reason: body.reason,
      rejected_at: new Date().toISOString(),
    })
    .eq('id', body.quoteId)
    .select('id, status, rejection_reason, rejected_at')
    .maybeSingle();

  if (error) {
    console.error('reject:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}
