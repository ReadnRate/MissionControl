import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// MiniMax — workspace default model
const MODEL = "MiniMax-M2.7";

const openai = new OpenAI({
  baseURL: "https://api.minimax.chat/v1",
  apiKey: process.env.MINIMAX_API_KEY!,
});

function extractVideoId(url: string): string | null {
  const m =
    url.match(/[?&]v=([^&\s]+)/) ||
    url.match(/youtu\.be\/([^?&\s]+)/) ||
    url.match(/youtube\.com\/embed\/([^?&\s]+)/);
  return m ? m[1] : null;
}

async function getTranscript(youtubeUrl: string): Promise<string | null> {
  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) return null;

  const encoded = encodeURIComponent(youtubeUrl);
  const res = await fetch(
    `https://api.supadata.ai/v1/transcript?url=${encoded}&text=true`,
    { headers: { "x-api-key": apiKey } }
  );

  if (!res.ok) return null;
  const data = await res.json();

  if (data.content) return data.content;

  if (data.jobId) {
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const poll = await fetch(
        `https://api.supadata.ai/v1/transcript/${data.jobId}`,
        { headers: { "x-api-key": apiKey } }
      );
      if (!poll.ok) continue;
      const pollData = await poll.json();
      if (pollData.status === "completed" && pollData.content)
        return pollData.content;
      if (pollData.status === "failed") return null;
    }
  }

  return null;
}

async function analyzeTranscript(
  transcript: string,
  title: string | null
): Promise<{
  short_summary: string;
  detailed_summary: string;
  key_points: { text: string; context: string }[];
} | null> {
  const prompt = `You are analyzing a YouTube video transcript. Produce a structured analysis as valid JSON.

Video title: ${title || "Unknown"}

Transcript:
${transcript.substring(0, 12000)}

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "short_summary": "3-4 sentences describing what the video is about, who made it, and the core message",
  "detailed_summary": "A multi-section breakdown of the full video content. Use markdown with ## headings for each section. Cover the video from start to finish with specific details, examples, tools, and numbers mentioned.",
  "key_points": [
    {"text": "direct quote or close paraphrase from the video", "context": "one sentence explaining why this matters"},
    {"text": "...", "context": "..."}
  ]
}

Include 5-8 key_points. Be specific — cite actual content from the transcript.`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.choices[0]?.message?.content ?? "";
    const clean = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("MiniMax analysis error:", e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { youtube_url, project = "general" } = body;

    if (!youtube_url) {
      return NextResponse.json({ error: "youtube_url is required" }, { status: 400 });
    }

    const videoId = extractVideoId(youtube_url);
    const thumbnailUrl = videoId
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : null;

    const transcript = await getTranscript(youtube_url);
    if (!transcript) {
      return NextResponse.json(
        { error: "Could not fetch transcript. The video may not have captions." },
        { status: 422 }
      );
    }

    let title: string | null = null;
    let channel: string | null = null;
    try {
      const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      const html = await pageRes.text();
      const titleM = html.match(/"title":"([^"]+)"/);
      if (titleM) title = titleM[1];
      const channelM = html.match(/"ownerChannelName":"([^"]+)"/);
      if (channelM) channel = channelM[1];
    } catch {}

    const analysis = await analyzeTranscript(transcript, title);
    if (!analysis) {
      return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("video_analyses")
      .insert({
        youtube_url,
        video_id: videoId,
        title,
        channel,
        thumbnail_url: thumbnailUrl,
        short_summary: analysis.short_summary,
        detailed_summary: analysis.detailed_summary,
        key_points: analysis.key_points,
        project,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("YouTube analyze error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}