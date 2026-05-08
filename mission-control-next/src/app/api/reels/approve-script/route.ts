import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';

const Body = z.object({
  quoteId: z.string().min(1),
  editedScript: z.string().min(1).max(5000).optional(),
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

  const update: {
    status: 'script_approved';
    script_approved_at: string;
    script?: string;
  } = {
    status: 'script_approved',
    script_approved_at: new Date().toISOString(),
  };
  if (body.editedScript) update.script = body.editedScript;

  const { data, error } = await supabaseAdmin
    .from('author_quotes')
    .update(update)
    .eq('id', body.quoteId)
    .select('id, status, script, script_word_count, script_approved_at')
    .maybeSingle();

  if (error) {
    console.error('approve-script:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}
