"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Settings, Database, Bot, Key, CheckCircle2, XCircle,
  RefreshCw, ChevronRight,
} from 'lucide-react';

const AGENTS = [
  { name: 'Joe',          role: 'Orchestrator', description: 'Main orchestrator — reads tasks, delegates to the team, updates statuses.' },
  { name: 'Forge',        role: 'Developer',    description: 'Builds and maintains the Next.js app and scripts. React / Supabase / TypeScript.' },
  { name: 'Aura',         role: 'Marketing',    description: 'Owns campaigns, copy, ideas vault, and growth tactics.' },
  { name: 'Beacon',       role: 'Research',     description: 'Market intel, competitor analysis, author research.' },
  { name: 'Super Data',   role: 'Analyst',      description: 'YouTube scraping, data analysis, reporting.' },
  { name: 'Skill Hunter', role: 'Scout',        description: 'Discovers new tools, APIs, and integrations to expand team capability.' },
];

const TABLES = ['tasks', 'author_leads', 'trym_leads', 'outreach_log', 'intel', 'ideas'];

export default function SettingsPage() {
  const [dbStatus, setDbStatus]   = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [tableCounts, setTableCounts] = useState<Record<string, number | null>>({});
  const [checking, setChecking]   = useState(false);

  async function checkDatabase() {
    setChecking(true);
    setDbStatus('checking');
    const counts: Record<string, number | null> = {};
    try {
      await Promise.all(
        TABLES.map(async table => {
          const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true });
          counts[table] = error ? null : (count ?? 0);
        })
      );
      setTableCounts(counts);
      setDbStatus('ok');
    } catch {
      setDbStatus('error');
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => { checkDatabase(); }, []);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '(not set)';
  const projectRef  = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? '—';

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-3xl">
      {/* Header */}
      <header className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <Settings className="text-slate-500" size={24} />
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
        </div>
        <p className="text-sm text-slate-500 ml-9">System configuration & status overview</p>
      </header>

      {/* Database */}
      <Section icon={<Database size={18} />} title="Database" subtitle="Supabase connection & table health">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-700">Connection status</p>
              <p className="text-xs text-slate-400 font-mono">Project: {projectRef}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={dbStatus} />
              <button
                onClick={checkDatabase}
                disabled={checking}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 transition-all disabled:opacity-50"
              >
                <RefreshCw size={12} className={checking ? 'animate-spin' : ''} /> Recheck
              </button>
            </div>
          </div>

          {Object.keys(tableCounts).length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">Table</th>
                    <th className="text-right px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">Rows</th>
                    <th className="text-right px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {TABLES.map(table => (
                    <tr key={table} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-sm text-slate-700">{table}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        {tableCounts[table] != null ? tableCounts[table]?.toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {tableCounts[table] != null
                          ? <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold"><CheckCircle2 size={12} /> OK</span>
                          : <span className="inline-flex items-center gap-1 text-xs text-rose-500 font-semibold"><XCircle size={12} /> Error</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Section>

      {/* Agent roster */}
      <Section icon={<Bot size={18} />} title="Agent Roster" subtitle="Registered agents and their responsibilities">
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {AGENTS.map(agent => (
            <div key={agent.name} className="flex items-start gap-4 px-4 py-4 hover:bg-slate-50 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-xs font-black text-cyan-700 shrink-0 mt-0.5">
                {agent.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{agent.name}</span>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wide">{agent.role}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{agent.description}</p>
              </div>
              <ChevronRight size={14} className="text-slate-300 mt-1 shrink-0" />
            </div>
          ))}
        </div>
      </Section>

      {/* Environment */}
      <Section icon={<Key size={18} />} title="Environment" subtitle="Runtime configuration (read-only)">
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          {[
            { key: 'NEXT_PUBLIC_SUPABASE_URL',  value: process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '(not set)' },
            { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '••••••••' : '(not set)' },
            { key: 'WORKSPACE_ROOT',            value: '(server-side only)' },
          ].map((row, i, arr) => (
            <div key={row.key} className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? 'border-b border-slate-100' : ''} hover:bg-slate-50 transition-colors`}>
              <span className="text-xs font-mono text-slate-500">{row.key}</span>
              <span className="text-xs font-mono text-slate-700 truncate max-w-[240px] text-right">{row.value}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-2">Set these in <code className="bg-slate-100 px-1 rounded">.env.local</code> and restart the server.</p>
      </Section>

      {/* Version */}
      <div className="text-xs text-slate-400 font-mono pt-4 border-t border-slate-200">
        Mission Control · V5.1 · Next.js {process.env.NEXT_PUBLIC_APP_VERSION ?? '—'}
      </div>
    </div>
  );
}

function Section({ icon, title, subtitle, children }: {
  icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="text-slate-400 mt-0.5">{icon}</span>
        <div>
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
      <div className="ml-7">{children}</div>
    </section>
  );
}

function StatusBadge({ status }: { status: 'idle' | 'checking' | 'ok' | 'error' }) {
  if (status === 'checking') return (
    <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
      <RefreshCw size={12} className="animate-spin" /> Checking…
    </span>
  );
  if (status === 'ok') return (
    <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
      <CheckCircle2 size={12} /> Connected
    </span>
  );
  if (status === 'error') return (
    <span className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
      <XCircle size={12} /> Error
    </span>
  );
  return null;
}
