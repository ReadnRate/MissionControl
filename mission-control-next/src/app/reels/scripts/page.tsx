'use client';

import React, { useMemo, useState } from 'react';
import useSWR from 'swr';
import { ClipboardCheck, RefreshCw, X, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

interface AuthorRel {
  name: string | null;
  intro_hook: string | null;
  hidden_story: string | null;
  self_pub_relevant: boolean | null;
}

interface ScriptRow {
  id: string;
  quote: string;
  theme: string | null;
  source: string | null;
  script: string;
  script_word_count: number | null;
  script_generated_at: string | null;
  regeneration_count: number;
  language: string;
  author: string;
  author_id: string | null;
  authors: AuthorRel | null;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
};

function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function wordCountClass(n: number): string {
  if (n >= 75 && n <= 85) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  if (n >= 60 && n <= 100) return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
}

function wordCountLabel(n: number): string {
  if (n >= 75 && n <= 85) return 'on target';
  if (n >= 60 && n <= 100) return 'in range';
  return n < 60 ? 'too short' : 'too long';
}

export default function ScriptsToReviewPage() {
  const { data, error, isLoading, mutate } = useSWR<{ rows: ScriptRow[] }>(
    '/api/reels/scripts-to-review',
    fetcher,
  );

  const [regenerateFor, setRegenerateFor] = useState<ScriptRow | null>(null);
  const [rejectFor, setRejectFor] = useState<ScriptRow | null>(null);

  if (isLoading) {
    return (
      <div className="p-6 min-h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-mono tracking-widest">LOADING SCRIPTS…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 min-h-full">
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Failed to load scripts</p>
            <p className="text-sm text-rose-300/80 mt-1">{String(error)}</p>
          </div>
        </div>
      </div>
    );
  }

  const rows = data?.rows ?? [];

  return (
    <div className="p-6 space-y-6 min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <ClipboardCheck size={20} className="text-cyan-400" />
            Scripts to Review
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Edit, approve, regenerate, or reject AI-drafted reel scripts.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-800/60 border border-slate-700/50 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          {rows.length} pending
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-12 text-center text-slate-500">
          <Sparkles size={28} className="mx-auto text-slate-600 mb-3" />
          <p className="text-sm">No scripts waiting on review.</p>
          <p className="text-xs text-slate-600 mt-1">
            Generate scripts from approved quotes to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {rows.map((row) => (
            <ScriptCard
              key={row.id}
              row={row}
              onMutate={mutate}
              onRegenerate={() => setRegenerateFor(row)}
              onReject={() => setRejectFor(row)}
            />
          ))}
        </div>
      )}

      {regenerateFor && (
        <RegenerateModal
          row={regenerateFor}
          onClose={() => setRegenerateFor(null)}
          onDone={() => {
            setRegenerateFor(null);
            mutate();
          }}
        />
      )}
      {rejectFor && (
        <RejectModal
          row={rejectFor}
          onClose={() => setRejectFor(null)}
          onDone={() => {
            setRejectFor(null);
            mutate();
          }}
        />
      )}
    </div>
  );
}

function ScriptCard({
  row,
  onMutate,
  onRegenerate,
  onReject,
}: {
  row: ScriptRow;
  onMutate: () => void;
  onRegenerate: () => void;
  onReject: () => void;
}) {
  const [draft, setDraft] = useState(row.script);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const liveCount = useMemo(() => countWords(draft), [draft]);
  const dirty = draft !== row.script;
  const authorName = row.authors?.name ?? row.author;
  const introHook = row.authors?.intro_hook ?? null;

  async function handleApprove() {
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch('/api/reels/approve-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: row.id,
          editedScript: dirty ? draft : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `${res.status}`);
      onMutate();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-white">{authorName}</h3>
            {row.theme && (
              <span className="text-[10px] uppercase tracking-wider text-slate-400 bg-slate-900/80 border border-slate-700 px-2 py-0.5 rounded">
                {row.theme}
              </span>
            )}
            {row.regeneration_count > 1 && (
              <span className="text-[10px] uppercase tracking-wider text-violet-300 bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 rounded">
                regen ×{row.regeneration_count}
              </span>
            )}
          </div>
          {introHook && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-1" title={introHook}>
              {introHook}
            </p>
          )}
          <p className="text-sm italic text-slate-300 mt-3 leading-relaxed">
            &ldquo;{row.quote}&rdquo;
          </p>
          {row.source && (
            <p className="text-[11px] text-slate-600 mt-1">— {row.source}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded border ${wordCountClass(liveCount)}`}
            title={`${wordCountLabel(liveCount)} (target 75–85, healthy 60–100)`}
          >
            {liveCount} words · {wordCountLabel(liveCount)}
          </span>
          {dirty && (
            <span className="text-[10px] text-amber-400 font-mono uppercase tracking-wider">
              edited
            </span>
          )}
        </div>
      </div>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={8}
        className="w-full bg-slate-900 border border-slate-600 text-slate-100 rounded-lg px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-cyan-500 resize-y font-mono"
        spellCheck
      />

      {err && (
        <div className="mt-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg px-3 py-2 text-xs flex items-start gap-2">
          <AlertCircle size={13} className="shrink-0 mt-0.5" />
          <span>{err}</span>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleApprove}
          disabled={submitting || draft.trim().length === 0}
          className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 size={14} className="animate-spin" /> APPROVING…
            </>
          ) : dirty ? (
            <>
              <ClipboardCheck size={14} /> APPROVE EDITED
            </>
          ) : (
            <>
              <ClipboardCheck size={14} /> APPROVE
            </>
          )}
        </button>
        <button
          onClick={onRegenerate}
          disabled={submitting}
          className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-slate-200 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw size={14} /> REGENERATE
        </button>
        <button
          onClick={onReject}
          disabled={submitting}
          className="px-4 py-2.5 bg-rose-600/80 hover:bg-rose-500 disabled:bg-slate-800 text-white font-semibold text-sm rounded-lg transition-colors"
        >
          REJECT
        </button>
      </div>
    </div>
  );
}

function RegenerateModal({
  row,
  onClose,
  onDone,
}: {
  row: ScriptRow;
  onClose: () => void;
  onDone: () => void;
}) {
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleConfirm() {
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch('/api/reels/regenerate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: row.id,
          feedback: feedback.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `${res.status}`);
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="text-white font-bold text-base flex items-center gap-2">
            <RefreshCw size={16} className="text-cyan-400" /> Regenerate script
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-400">
            Optional feedback for Claude (e.g. &ldquo;shorter, target 75 words&rdquo;,
            &ldquo;cut the trap framing&rdquo;, &ldquo;more specific to romance writers&rdquo;).
          </p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            placeholder="Leave empty to retry with the same prompt."
            className="w-full bg-slate-900 border border-slate-600 text-slate-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-cyan-500 resize-none"
          />
          {err && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg px-3 py-2 text-xs flex items-start gap-2">
              <AlertCircle size={13} className="shrink-0 mt-0.5" />
              <span>{err}</span>
            </div>
          )}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white font-bold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> REGENERATING…
              </>
            ) : (
              <>
                <RefreshCw size={14} /> REGENERATE
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2.5 text-slate-400 hover:text-white font-medium text-sm transition-colors"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}

function RejectModal({
  row,
  onClose,
  onDone,
}: {
  row: ScriptRow;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleConfirm() {
    if (!reason.trim()) {
      setErr('Reason is required.');
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch('/api/reels/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: row.id, reason: reason.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `${res.status}`);
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="text-white font-bold text-base">Reject this quote</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-400">
            Why is this quote being rejected? Stored on the row for review.
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="e.g. Quote is misattributed; can't find a credible source."
            className="w-full bg-slate-900 border border-slate-600 text-slate-100 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-rose-500 resize-none"
          />
          {err && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg px-3 py-2 text-xs flex items-start gap-2">
              <AlertCircle size={13} className="shrink-0 mt-0.5" />
              <span>{err}</span>
            </div>
          )}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-700 text-white font-bold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> REJECTING…
              </>
            ) : (
              'CONFIRM REJECTION'
            )}
          </button>
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2.5 text-slate-400 hover:text-white font-medium text-sm transition-colors"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
