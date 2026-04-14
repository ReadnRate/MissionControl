import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { execFile } from "child_process";
import { promisify } from "util";
import { readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

const execFileAsync = promisify(execFile);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_URL = "https://api.minimax.io/v1/chat/completions";
const MINIMAX_MODEL = "MiniMax-Text-01";

function isYouTube(url: string): boolean {
  return /youtube\.com|youtu\.be/i.test(url);
}

function detectPlatform(url: string): string {
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  if (/facebook\.com|fb\.watch/i.test(url)) return "facebook";
  if (/instagram\.com/i.test(url)) return "instagram";
  if (/tiktok\.com/i.test(url)) return "tiktok";
  return "video";
}

function extractVideoId(url: string): string | null {
  const m =
    url.match(/[?&]v=([^&\s]+)/) ||
    url.match(/youtu\.be\/([^?&\s]+)/) ||
    url.match(/youtube\.com\/embed\/([^?&\s]+)/);
  return m ? m[1] : null;
}

// ── YouTube path: Supadata transcript API ─────────────────────────────────

async function getYouTubeTranscript(youtubeUrl: string): Promise<string | null> {
  const encoded = encodeURIComponent(youtubeUrl);
  const apiKey = process.env.SUPADATA_API_KEY || "sd_9135790e9d053651876512b2785d978e";

  console.log("[transcript] fetching via Supadata:", youtubeUrl);

  const res = await fetch(
    `https://api.supadata.ai/v1/transcript?url=${encoded}&text=true`,
    { headers: { "x-api-key": apiKey } }
  );

  if (!res.ok) {
    const body = await res.text();
    console.error("[transcript] Supadata error:", res.status, body);
    return null;
  }

  const data = await res.json();
  console.log("[transcript] Supadata response keys:", Object.keys(data));

  if (data.content) {
    console.log("[transcript] got content, length:", data.content.length);
    return data.content;
  }

  if (data.jobId) {
    console.log("[transcript] async job:", data.jobId);
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const poll = await fetch(
        `https://api.supadata.ai/v1/transcript/${data.jobId}`,
        { headers: { "x-api-key": apiKey } }
      );
      if (!poll.ok) continue;
      const pollData = await poll.json();
      console.log(`[transcript] poll ${i + 1}: status=${pollData.status}`);
      if (pollData.status === "completed" && pollData.content) return pollData.content;
      if (pollData.status === "failed") {
        console.error("[transcript] job failed:", pollData);
        return null;
      }
    }
  }

  console.error("[transcript] no content and no jobId in response:", data);
  return null;
}

// ── Non-YouTube path: yt-dlp + Whisper ───────────────────────────────────

async function getTranscriptViaYtDlp(url: string): Promise<{
  transcript: string | null;
  title: string | null;
  channel: string | null;
  thumbnail_url: string | null;
  error?: string;
}> {
  const tmpBase = join(tmpdir(), `mc-video-${Date.now()}`);
  const downloadedFiles: string[] = [];

  try {
    let title: string | null = null;
    let channel: string | null = null;
    let thumbnail_url: string | null = null;

    // Step 1: metadata
    try {
      console.log("[yt-dlp] fetching metadata for:", url);
      const { stdout } = await execFileAsync(
        "yt-dlp",
        ["--dump-json", "--no-playlist", url],
        { timeout: 30000, maxBuffer: 2 * 1024 * 1024 }
      );
      const meta = JSON.parse(stdout.trim());
      title = meta.title || null;
      channel = meta.uploader || meta.channel || null;
      thumbnail_url = meta.thumbnail || null;
      console.log("[yt-dlp] metadata OK, title:", title);
    } catch (e: any) {
      console.error("[yt-dlp] metadata error:", e.message);
    }

    // Step 2: download audio
    console.log("[yt-dlp] downloading audio to:", tmpBase);
    try {
      const { stdout, stderr } = await execFileAsync(
        "yt-dlp",
        ["-x", "--format", "bestaudio", "--no-playlist", "-o", `${tmpBase}.%(ext)s`, url],
        { timeout: 180000, maxBuffer: 1024 * 1024 }
      );
      console.log("[yt-dlp] download stdout:", stdout.slice(0, 500));
      if (stderr) console.warn("[yt-dlp] stderr:", stderr.slice(0, 500));
    } catch (e: any) {
      console.error("[yt-dlp] download error:", e.message);
      return { transcript: null, title, channel, thumbnail_url, error: `yt-dlp download failed: ${e.message}` };
    }

    // Step 3: find file
    let audioFile: string | null = null;
    for (const ext of ["m4a", "webm", "mp4", "opus", "ogg", "mp3", "flac"]) {
      const candidate = `${tmpBase}.${ext}`;
      try {
        await readFile(candidate);
        audioFile = candidate;
        downloadedFiles.push(candidate);
        console.log("[yt-dlp] found audio file:", candidate);
        break;
      } catch {}
    }

    if (!audioFile) {
      return { transcript: null, title, channel, thumbnail_url, error: "No audio file found after download" };
    }

    // Step 4: Whisper transcription
    if (!process.env.OPENAI_API_KEY) {
      return { transcript: null, title, channel, thumbnail_url, error: "OPENAI_API_KEY not set" };
    }

    const audioBuffer = await readFile(audioFile);
    const ext = audioFile.split(".").pop() ?? "m4a";
    const mimeMap: Record<string, string> = {
      m4a: "audio/mp4", mp4: "audio/mp4", webm: "audio/webm",
      opus: "audio/ogg", ogg: "audio/ogg", mp3: "audio/mpeg", flac: "audio/flac",
    };
    const mime = mimeMap[ext] ?? "audio/mp4";

    console.log("[whisper] sending", audioBuffer.length, "bytes, mime:", mime);

    const formData = new FormData();
    formData.append("file", new Blob([audioBuffer], { type: mime }), `audio.${ext}`);
    formData.append("model", "whisper-1");

    const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: formData,
    });

    if (!whisperRes.ok) {
      const err = await whisperRes.text();
      console.error("[whisper] error:", whisperRes.status, err);
      return { transcript: null, title, channel, thumbnail_url, error: `Whisper API error ${whisperRes.status}: ${err}` };
    }

    const whisperData = await whisperRes.json();
    const transcript = whisperData.text || null;
    console.log("[whisper] transcript length:", transcript?.length ?? 0);
    return { transcript, title, channel, thumbnail_url };

  } finally {
    for (const f of downloadedFiles) {
      try { await unlink(f); } catch {}
    }
  }
}

// ── MiniMax analysis ──────────────────────────────────────────────────────

async function analyzeTranscript(
  transcript: string,
  title: string | null,
  platform: string
): Promise<{
  result: { short_summary: string; detailed_summary: string; key_points: { text: string; context: string }[] } | null;
  error?: string;
}> {
  if (!MINIMAX_API_KEY) {
    return { result: null, error: "MINIMAX_API_KEY env var is not set" };
  }

  const prompt = `You are analyzing a ${platform} video transcript. Produce a structured analysis as valid JSON.

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

  console.log("[minimax] calling API, model:", MINIMAX_MODEL, "key prefix:", MINIMAX_API_KEY.slice(0, 8));

  try {
    const res = await fetch(MINIMAX_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MINIMAX_API_KEY}`,
      },
      body: JSON.stringify({
        model: MINIMAX_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4096,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[minimax] API error:", res.status, err);
      return { result: null, error: `MiniMax API error ${res.status}: ${err.slice(0, 300)}` };
    }

    const data = await res.json();
    console.log("[minimax] response choices:", data.choices?.length ?? 0);

    const text: string = data.choices?.[0]?.message?.content ?? "";
    if (!text) {
      console.error("[minimax] empty content, full response:", JSON.stringify(data).slice(0, 500));
      return { result: null, error: "MiniMax returned empty content" };
    }

    const clean = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    console.log("[minimax] raw response preview:", clean.slice(0, 200));

    try {
      const parsed = JSON.parse(clean);
      return { result: parsed };
    } catch (e: any) {
      console.error("[minimax] JSON parse error:", e.message, "| raw:", clean.slice(0, 500));
      return { result: null, error: `JSON parse failed: ${e.message}` };
    }
  } catch (e: any) {
    console.error("[minimax] fetch error:", e.message);
    return { result: null, error: `MiniMax request failed: ${e.message}` };
  }
}

// ── POST handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { youtube_url, project = "general" } = body;

    if (!youtube_url) {
      return NextResponse.json({ error: "youtube_url is required" }, { status: 400 });
    }

    console.log("[analyze] URL:", youtube_url, "project:", project);
    const platform = detectPlatform(youtube_url);
    console.log("[analyze] platform:", platform);

    let transcript: string | null = null;
    let title: string | null = null;
    let channel: string | null = null;
    let thumbnailUrl: string | null = null;

    if (isYouTube(youtube_url)) {
      const videoId = extractVideoId(youtube_url);
      thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

      transcript = await getYouTubeTranscript(youtube_url);

      if (!transcript) {
        return NextResponse.json(
          { error: "Could not fetch transcript. The video may not have captions, or Supadata failed." },
          { status: 422 }
        );
      }

      try {
        const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
          headers: { "User-Agent": "Mozilla/5.0" },
        });
        const html = await pageRes.text();
        const titleM = html.match(/"title":"([^"]+)"/);
        if (titleM) title = titleM[1];
        const channelM = html.match(/"ownerChannelName":"([^"]+)"/);
        if (channelM) channel = channelM[1];
        console.log("[analyze] YouTube metadata: title=", title, "channel=", channel);
      } catch (e: any) {
        console.warn("[analyze] YouTube page scrape failed:", e.message);
      }
    } else {
      const result = await getTranscriptViaYtDlp(youtube_url);
      transcript = result.transcript;
      title = result.title;
      channel = result.channel;
      thumbnailUrl = result.thumbnail_url;

      if (!transcript) {
        return NextResponse.json(
          { error: result.error || "Could not transcribe video. Make sure the URL is public." },
          { status: 422 }
        );
      }
    }

    console.log("[analyze] transcript length:", transcript.length);

    const { result: analysis, error: analysisError } = await analyzeTranscript(transcript, title, platform);

    if (!analysis) {
      console.error("[analyze] analysis failed:", analysisError);
      return NextResponse.json(
        { error: `Analysis failed: ${analysisError}` },
        { status: 500 }
      );
    }

    const videoId = isYouTube(youtube_url) ? extractVideoId(youtube_url) : null;

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

    if (error) {
      console.error("[analyze] Supabase insert error:", error);
      throw error;
    }

    console.log("[analyze] saved to Supabase, id:", data.id);
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("[analyze] unhandled error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
