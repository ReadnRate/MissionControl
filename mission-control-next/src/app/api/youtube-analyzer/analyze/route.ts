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

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY!;
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

// ── YouTube path: Supadata transcript API ──────────────────────────────────

async function getYouTubeTranscript(youtubeUrl: string): Promise<string | null> {
  const encoded = encodeURIComponent(youtubeUrl);
  const apiKey = process.env.SUPADATA_API_KEY || "sd_9135790e9d053651876512b2785d978e";

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

// ── Non-YouTube path: yt-dlp download + Whisper transcription ─────────────

async function getTranscriptViaYtDlp(url: string): Promise<{
  transcript: string | null;
  title: string | null;
  channel: string | null;
  thumbnail_url: string | null;
}> {
  const tmpBase = join(tmpdir(), `mc-video-${Date.now()}`);
  const downloadedFiles: string[] = [];

  try {
    // Step 1: fetch metadata (title, channel, thumbnail)
    let title: string | null = null;
    let channel: string | null = null;
    let thumbnail_url: string | null = null;

    try {
      const { stdout } = await execFileAsync(
        "yt-dlp",
        ["--dump-json", "--no-playlist", url],
        { timeout: 30000, maxBuffer: 2 * 1024 * 1024 }
      );
      const meta = JSON.parse(stdout.trim());
      title = meta.title || null;
      channel = meta.uploader || meta.channel || null;
      thumbnail_url = meta.thumbnail || null;
    } catch (e) {
      console.error("yt-dlp metadata error:", e);
    }

    // Step 2: download best audio (native format, no ffmpeg needed)
    const outputTemplate = `${tmpBase}.%(ext)s`;
    await execFileAsync(
      "yt-dlp",
      [
        "-x",
        "--format", "bestaudio",
        "--no-playlist",
        "-o", outputTemplate,
        url,
      ],
      { timeout: 180000, maxBuffer: 1024 * 1024 }
    );

    // Step 3: find the downloaded file
    let audioFile: string | null = null;
    for (const ext of ["m4a", "webm", "mp4", "opus", "ogg", "mp3", "flac"]) {
      const candidate = `${tmpBase}.${ext}`;
      try {
        await readFile(candidate); // throws if not found
        audioFile = candidate;
        downloadedFiles.push(candidate);
        break;
      } catch {}
    }

    if (!audioFile) {
      return { transcript: null, title, channel, thumbnail_url };
    }

    // Step 4: transcribe with Whisper
    const audioBuffer = await readFile(audioFile);
    const ext = audioFile.split(".").pop() ?? "m4a";
    const mimeMap: Record<string, string> = {
      m4a: "audio/mp4",
      mp4: "audio/mp4",
      webm: "audio/webm",
      opus: "audio/ogg",
      ogg: "audio/ogg",
      mp3: "audio/mpeg",
      flac: "audio/flac",
    };
    const mime = mimeMap[ext] ?? "audio/mp4";

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
      console.error("Whisper error:", whisperRes.status, err);
      return { transcript: null, title, channel, thumbnail_url };
    }

    const whisperData = await whisperRes.json();
    return {
      transcript: whisperData.text || null,
      title,
      channel,
      thumbnail_url,
    };
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
  short_summary: string;
  detailed_summary: string;
  key_points: { text: string; context: string }[];
} | null> {
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
      console.error("MiniMax error:", res.status, err);
      return null;
    }

    const data = await res.json();
    const text: string = data.choices?.[0]?.message?.content ?? "";
    const clean = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("analyzeTranscript error:", e);
    return null;
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

    const platform = detectPlatform(youtube_url);

    let transcript: string | null = null;
    let title: string | null = null;
    let channel: string | null = null;
    let thumbnailUrl: string | null = null;

    if (isYouTube(youtube_url)) {
      // YouTube: Supadata transcript + page scrape for metadata
      const videoId = extractVideoId(youtube_url);
      thumbnailUrl = videoId
        ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        : null;

      transcript = await getYouTubeTranscript(youtube_url);

      if (!transcript) {
        return NextResponse.json(
          { error: "Could not fetch transcript. The video may not have captions." },
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
      } catch {}
    } else {
      // Facebook / Instagram / TikTok: yt-dlp + Whisper
      const result = await getTranscriptViaYtDlp(youtube_url);
      transcript = result.transcript;
      title = result.title;
      channel = result.channel;
      thumbnailUrl = result.thumbnail_url;

      if (!transcript) {
        return NextResponse.json(
          {
            error:
              "Could not transcribe video. Make sure the URL is public and the video has audio.",
          },
          { status: 422 }
        );
      }
    }

    const analysis = await analyzeTranscript(transcript, title, platform);
    if (!analysis) {
      return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
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

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("Video analyze error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
