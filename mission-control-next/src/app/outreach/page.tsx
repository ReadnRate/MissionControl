"use client";

import useSWR from "swr";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    sent: "bg-green-100 text-green-800",
    bounced: "bg-red-100 text-red-800",
    failed: "bg-red-100 text-red-800",
    pending: "bg-yellow-100 text-yellow-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-slate-100 text-slate-800"}`}>
      {status}
    </span>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
      <div className="text-3xl">{icon}</div>
      <div>
        <div className="text-2xl font-bold text-slate-900">{value ?? "—"}</div>
        <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</div>
      </div>
    </div>
  );
}

export default function OutreachPage() {
  const { data: stats, mutate: mutateStats } = useSWR("/api/outreach/stats", fetcher, { refreshInterval: 30000 });
  const { data: recent, mutate: mutateRecent } = useSWR("/api/outreach/recent?limit=50", fetcher, { refreshInterval: 30000 });
  const { data: templates } = useSWR("/api/outreach/templates", fetcher);
  const { data: pauseStatus } = useSWR("/api/outreach/pause?action=status", fetcher);

  const [runOutput, setRunOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => {
    setRefreshKey((k) => k + 1);
    mutateStats();
    mutateRecent();
  };

  const runOutreach = async () => {
    setIsRunning(true);
    setRunOutput(null);
    try {
      const res = await fetch("/api/outreach/run", { method: "POST" });
      const data = await res.json();
      setRunOutput(data.output || data.error || "Done.");
    } catch (e: any) {
      setRunOutput("Error: " + e.message);
    } finally {
      setIsRunning(false);
      setTimeout(() => { mutateStats(); mutateRecent(); }, 2000);
    }
  };

  const togglePause = async () => {
    const res = await fetch("/api/outreach/pause?action=toggle");
    const data = await res.json();
    // revalidate pause status
    mutateStats();
  };

  const isPaused = pauseStatus?.paused;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">📧 Outreach Command</h1>
          <p className="text-slate-500 mt-1 text-sm">Author email campaign dashboard</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={refresh}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            🔄 Refresh
          </button>
          {isPaused ? (
            <button
              onClick={togglePause}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              ▶️ Resume Today
            </button>
          ) : (
            <button
              onClick={togglePause}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              ⏸ Pause Today
            </button>
          )}
          <button
            onClick={runOutreach}
            disabled={isRunning || !!isPaused}
            className="flex items-center gap-2 px-5 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-300 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
          >
            {isRunning ? "⏳ Running…" : "▶️ Run Outreach Now"}
          </button>
        </div>
      </div>

      {isPaused && (
        <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm font-medium">
          ⏸ Outreach is paused — no emails will be sent until resumed.
        </div>
      )}

      {/* Run output */}
      {runOutput && (
        <div className="mb-6 bg-slate-900 text-green-400 px-4 py-3 rounded-lg text-xs font-mono overflow-x-auto">
          <pre className="whitespace-pre-wrap">{runOutput}</pre>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard icon="📤" label="Total Sent" value={stats?.totalSent ?? "—"} />
        <StatCard icon="❌" label="Bounced / Failed" value={stats?.bouncedFailed ?? "—"} />
        <StatCard icon="👥" label="Leads in DB" value={stats?.totalLeads ?? "—"} />
        <StatCard icon="✅" label="Available to Send" value={stats?.availableToSend ?? "—"} />
        <StatCard icon="📊" label="Open Rate" value="—" />
      </div>

      {/* Recent Sends Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-8">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">Recent Sends</h2>
          <span className="text-xs text-slate-400">Auto-refreshes every 30s</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase tracking-wide border-b border-slate-100">
                <th className="px-6 py-3">First Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Book Title</th>
                <th className="px-6 py-3">Template</th>
                <th className="px-6 py-3">Sent At</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!recent ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Loading…</td></tr>
              ) : recent.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">No sends yet.</td></tr>
              ) : (
                recent.map((entry: any) => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium text-slate-800">
                      {entry.author_leads?.first_name ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-slate-600 font-mono text-xs">{entry.email_sent_to}</td>
                    <td className="px-6 py-3 text-slate-600 text-xs max-w-[200px] truncate">
                      {entry.author_leads?.book_title ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-slate-500 text-xs font-mono">{entry.template_id}</td>
                    <td className="px-6 py-3 text-slate-500 text-xs">
                      {entry.sent_at ? new Date(entry.sent_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-6 py-3"><StatusBadge status={entry.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Templates */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-8">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-800">Email Templates</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {!templates ? (
            <div className="px-6 py-8 text-center text-slate-400">Loading…</div>
          ) : (
            templates.map((t: any) => (
              <div key={t.id} className="px-6 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{t.id}</span>
                  <span className="font-semibold text-slate-800">{t.subject}</span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{t.body}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Email Status Log (last 20) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-800">Email Status Log</h2>
        </div>
        <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
          {!recent ? (
            <div className="px-6 py-8 text-center text-slate-400">Loading…</div>
          ) : (
            (recent as any[]).slice(0, 20).map((entry: any) => (
              <div key={entry.id} className="px-6 py-3 flex items-center gap-4 text-sm">
                <StatusBadge status={entry.status} />
                <span className="font-mono text-xs text-slate-500">{entry.email_sent_to}</span>
                <span className="text-slate-400 text-xs">
                  {entry.sent_at ? new Date(entry.sent_at).toLocaleString() : "—"}
                </span>
                <span className="ml-auto text-xs text-slate-400">{entry.template_id}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
