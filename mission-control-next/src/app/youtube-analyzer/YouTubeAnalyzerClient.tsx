"use client";
import React, { useState } from "react";
import { Youtube, ExternalLink, ChevronDown, ChevronUp, Loader2, X } from "lucide-react";

interface VideoAnalysis {
  id: string;
  youtube_url: string;
  video_id: string | null;
  title: string | null;
  channel: string | null;
  thumbnail_url: string | null;
  short_summary: string | null;
  detailed_summary: string | null;
  key_points: { text: string; context: string }[] | null;
  project: string | null;
  created_at: string;
}

interface Props {
  initialAnalyses: VideoAnalysis[];
}

export default function YouTubeAnalyzerClient({ initialAnalyses }: Props) {
  const [analyses, setAnalyses] = useState<VideoAnalysis[]>(initialAnalyses);
  const [url, setUrl] = useState("");
  const [project, setProject] = useState("general");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function handleAnalyze() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/youtube-analyzer/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtube_url: url.trim(), project }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Analysis failed");
      setAnalyses((prev) => [json.data, ...prev]);
      setUrl("");
      setExpanded(json.data.id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  return (
    <div className="p-6 space-y-6 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Video Analyzer</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            YouTube · Facebook Reels · Instagram Reels · TikTok — transcript, summary, key moments
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-800/50 border border-slate-700/50 px-3 py-1.5 rounded-full">
          <Youtube size={12} className="text-red-400" />
          {analyses.length} analyzed
        </div>
      </div>

      {/* Input form */}
      <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-5 space-y-4">
        <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-widest flex items-center gap-2">
          <Youtube size={13} className="text-red-400" />
          Analyze a video
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleAnalyze()}
            placeholder="YouTube, Facebook Reel, Instagram Reel, TikTok URL…"
            className="flex-1 bg-slate-900 border border-slate-700/60 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 font-mono"
          />
          <select
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="bg-slate-900 border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/60"
          >
            <option value="general">General</option>
            <option value="trym">Trym</option>
            <option value="readnrate">ReadnRate</option>
          </select>
          <button
            onClick={handleAnalyze}
            disabled={loading || !url.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-sm font-bold rounded-lg transition-colors"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Youtube size={14} />
                Analyze
              </>
            )}
          </button>
        </div>
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            <X size={14} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}
        {loading && (
          <p className="text-xs text-slate-500 font-mono animate-pulse">
            Fetching transcript and analyzing… this may take 30-90s for Reels/TikTok
          </p>
        )}
      </div>

      {/* Video cards */}
      {analyses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-slate-600 space-y-2">
          <Youtube size={32} className="opacity-30" />
          <p className="text-sm">No videos analyzed yet. Paste a YouTube, Facebook, Instagram, or TikTok URL above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {analyses.map((a) => (
            <div
              key={a.id}
              className="bg-slate-800/30 border border-slate-700/40 rounded-xl overflow-hidden hover:border-slate-600/60 transition-colors"
            >
              {/* Card header */}
              <div
                className="flex items-start gap-4 p-4 cursor-pointer"
                onClick={() => toggle(a.id)}
              >
                {/* Thumbnail */}
                <div className="shrink-0 w-28 h-16 bg-slate-900 rounded-lg overflow-hidden">
                  {a.thumbnail_url ? (
                    <img
                      src={a.thumbnail_url}
                      alt={a.title || ""}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Youtube size={20} className="text-slate-700" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white line-clamp-1">
                        {a.title || a.youtube_url}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {a.channel && <span className="text-slate-400">{a.channel} · </span>}
                        {new Date(a.created_at).toLocaleDateString()}
                        {a.project && a.project !== "general" && (
                          <span className="ml-2 px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 text-[10px] rounded font-mono uppercase">
                            {a.project}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={a.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <ExternalLink size={13} />
                      </a>
                      {expanded === a.id ? (
                        <ChevronUp size={14} className="text-slate-500" />
                      ) : (
                        <ChevronDown size={14} className="text-slate-500" />
                      )}
                    </div>
                  </div>
                  {a.short_summary && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {a.short_summary}
                    </p>
                  )}
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === a.id && (
                <div className="border-t border-slate-700/40 p-5 space-y-5">
                  {/* Detailed summary */}
                  {a.detailed_summary && (
                    <div>
                      <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
                        Detailed Summary
                      </h3>
                      <div className="text-sm text-slate-300 leading-relaxed space-y-3 prose prose-invert prose-sm max-w-none">
                        {a.detailed_summary.split(/\n(?=##\s)/).map((section, i) => {
                          const [heading, ...body] = section.split("\n");
                          const title = heading.replace(/^#+\s*/, "");
                          return (
                            <div key={i}>
                              {title && (
                                <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wide mb-1">
                                  {title}
                                </p>
                              )}
                              <p className="text-slate-400 text-xs leading-relaxed">
                                {body.join(" ").trim()}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Key moments */}
                  {a.key_points && a.key_points.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
                        Key Moments
                      </h3>
                      <div className="space-y-2.5">
                        {a.key_points.map((kp, i) => (
                          <div
                            key={i}
                            className="bg-slate-900/60 border border-slate-800 rounded-lg p-3"
                          >
                            <p className="text-xs text-slate-200 italic leading-relaxed">
                              "{kp.text}"
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1.5">{kp.context}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
