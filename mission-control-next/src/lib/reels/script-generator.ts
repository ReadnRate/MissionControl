import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase-admin';

const SCRIPT_PROMPT_KEY = 'reel_script_generator_v2';

export class ScriptGenerationError extends Error {
  readonly status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = 'ScriptGenerationError';
    this.status = status;
  }
}

export interface GenerateScriptResult {
  script: string;
  wordCount: number;
  regenerationCount: number;
}

export async function generateScript(args: {
  quoteId: string;
  feedback?: string;
}): Promise<GenerateScriptResult> {
  const { quoteId, feedback } = args;

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ScriptGenerationError('ANTHROPIC_API_KEY missing on server', 500);
  }

  const { data: ctx, error: ctxErr } = await supabaseAdmin
    .from('quotes_with_author_context')
    .select('*')
    .eq('quote_id', quoteId)
    .maybeSingle();

  if (ctxErr) throw new ScriptGenerationError(`DB error fetching quote: ${ctxErr.message}`);
  if (!ctx) throw new ScriptGenerationError('Quote not found', 404);

  const { data: prompt, error: promptErr } = await supabaseAdmin
    .from('system_prompts')
    .select('prompt, model, temperature, max_tokens')
    .eq('key', SCRIPT_PROMPT_KEY)
    .eq('active', true)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (promptErr) throw new ScriptGenerationError(`DB error fetching prompt: ${promptErr.message}`);
  if (!prompt) throw new ScriptGenerationError(`Active prompt '${SCRIPT_PROMPT_KEY}' not found`);

  const lines = [
    `author: ${ctx.author ?? ''}`,
    `quote: "${ctx.quote ?? ''}"`,
    `theme: ${ctx.theme ?? ''}`,
    `source: ${ctx.source ?? ''}`,
    `intro_hook: ${ctx.intro_hook ?? ''}`,
    `hidden_story: ${ctx.hidden_story ?? ''}`,
    `self_pub_relevant: ${ctx.self_pub_relevant ?? false}`,
    `self_pub_story: ${ctx.self_pub_story ?? 'n/a'}`,
  ];
  if (feedback?.trim()) {
    lines.push('', `Previous attempt feedback: ${feedback.trim()}. Try again with this in mind.`);
  }
  const userMessage = lines.join('\n');

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await anthropic.messages.create({
    model: prompt.model,
    max_tokens: prompt.max_tokens,
    temperature: Number(prompt.temperature),
    system: [
      {
        type: 'text',
        text: prompt.prompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userMessage }],
  });

  const script = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();

  if (!script) throw new ScriptGenerationError('Anthropic returned empty script', 502);

  const { data: current, error: readErr } = await supabaseAdmin
    .from('author_quotes')
    .select('regeneration_count')
    .eq('id', quoteId)
    .maybeSingle();

  if (readErr) throw new ScriptGenerationError(`DB error reading quote row: ${readErr.message}`);
  if (!current) throw new ScriptGenerationError('Quote row vanished mid-generation', 404);

  const nextCount = (current.regeneration_count ?? 0) + 1;

  const { data: updated, error: upErr } = await supabaseAdmin
    .from('author_quotes')
    .update({
      script,
      status: 'script_pending',
      script_generated_at: new Date().toISOString(),
      regeneration_count: nextCount,
    })
    .eq('id', quoteId)
    .select('script_word_count, regeneration_count')
    .maybeSingle();

  if (upErr) throw new ScriptGenerationError(`DB error saving script: ${upErr.message}`);
  if (!updated) throw new ScriptGenerationError('Quote row vanished during update', 404);

  return {
    script,
    wordCount: updated.script_word_count ?? 0,
    regenerationCount: updated.regeneration_count,
  };
}
