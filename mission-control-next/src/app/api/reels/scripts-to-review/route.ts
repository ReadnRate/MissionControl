import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('author_quotes')
    .select(
      `
      id,
      quote,
      theme,
      source,
      script,
      script_word_count,
      script_generated_at,
      regeneration_count,
      language,
      author,
      author_id,
      authors ( name, intro_hook, hidden_story, self_pub_relevant )
    `,
    )
    .eq('status', 'script_pending')
    .order('script_generated_at', { ascending: true });

  if (error) {
    console.error('scripts-to-review:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rows: data ?? [] });
}
