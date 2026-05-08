import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateScript, ScriptGenerationError } from '@/lib/reels/script-generator';

const Body = z.object({
  quoteId: z.string().min(1),
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

  try {
    const result = await generateScript({ quoteId: body.quoteId });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ScriptGenerationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('generate-script:', err);
    return NextResponse.json({ error: 'Script generation failed' }, { status: 500 });
  }
}
