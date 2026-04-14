"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Terminal, Zap, CheckCircle2, Clock, Activity, Database, TrendingUp, Users } from 'lucide-react';

const AGENTS = [
  { id: 'joe',         name: 'Joe',        role: 'Orchestrator', color: 'bg-violet-500' },
  { id: 'forge',       name: 'Forge',      role: 'Developer',    color: 'bg-cyan-500'   },
  { id: 'aura',        name: 'Aura',       role: 'Marketing',    color: 'bg-pink-500'   },
  { id: 'beacon',      name: 'Beacon',     role: 'Research',     color: 'bg-amber-500'  },
];

const STATUS_COLOR: Record<string, string> = {
  done:           'text-emerald-400',
  in_progress:    'text-amber-400',
  todo:           'text-slate-400',
  backlog:        'text-slate-500',
  pending_review: 'text-violet-400',
};

const STATUS_DOT: Record<string, string> = {
  done:           'bg-emerald-500',
  in_progress:    'bg-amber-400 animate-pulse',
  todo:           'bg-slate-600',
  backlog:        'bg-slate-700',
  pending_review: 'bg-violet-500',
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    tasksTotal: 0, tasksDone: 0, tasksInProgress: 0, tasksPending: 0,
    authorLeads: 0, trymLeads: 0, outreachSent: 0, outreachBounced: 0,
  });
  const [activities, setActivities]   = useState<any[]>([]);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [
        { data: allTasks },
        { count: authorCount },
        { count: trymCount },
        { data: outreach },
        { data: ideas },
        { data: intel },
      ] = await Promise.all([
        supabase.from('tasks').select('*'),
        supabase.from('author_leads').select('id', { count: 'exact', head: true }),
        supabase.from('trym_leads').select('id',   { count: 'exact', head: true }),
        supabase.from('outreach_log').select('*'),
        supabase.from('ideas').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('intel').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      const tasks        = allTasks || [];
      const outreachData = outreach  || [];
      const ideasData    = ideas     || [];
      const intelData    = intel     || [];

      setStats({
        tasksTotal:      tasks.length,
        tasksDone:       tasks.filter((t: any) => t.status === 'done').length,
        tasksInProgress: tasks.filter((t: any) => t.status === 'in_progress').length,
        tasksPending:    tasks.filter((t: any) => ['todo', 'backlog', 'pending_review'].includes(t.status)).length,
        authorLeads:     authorCount ?? 0,
        trymLeads:       trymCount   ?? 0,
        outreachSent:    outreachData.filter((o: any) => o.status === 'sent').length,
        outreachBounced: outreachData.filter((o: any) => ['bounced', 'failed'].includes(o.status)).length,
      });

      setRecentTasks(tasks.slice(0, 8));

      const rawActivities = [
        ...tasks.map((t: any)    => ({ ...t, activityType: 'task',  title: t.title,                              ts: t.updated_at || t.created_at })),
        ...ideasData.map((i: any) => ({ ...i, activityType: 'idea',  title: i.title,                              ts: i.created_at })),
        ...intelData.map((i: any) => ({ ...i, activityType: 'intel', title: i.title || i.source_name || 'Intel', ts: i.created_at })),
      ]
        .filter(a => a.ts)
        .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
        .slice(0, 12);

      setActivities(rawActivities);
    } catch (e) {
      console.error('fetchData error:', e);
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="p-6 space-y-6 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Command Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">Live status — agents, tasks, leads</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          System online
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-7 h-7 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-mono tracking-widest">SYNCING…</span>
          </div>
        </div>
      ) : (
        <>
          {/* Stat strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={<Terminal size={14} />}    label="Tasks"        value={stats.tasksTotal}   sub={`${stats.tasksDone} done · ${stats.tasksInProgress} active`} accent="cyan"    />
            <StatCard icon={<Users size={14} />}       label="Author Leads" value={stats.authorLeads}  sub="in database"                                                  accent="violet"  />
            <StatCard icon={<TrendingUp size={14} />}  label="Trym Leads"   value={stats.trymLeads}    sub="in database"                                                  accent="emerald" />
            <StatCard icon={<Activity size={14} />}    label="Emails Sent"  value={stats.outreachSent} sub={`${stats.outreachBounced} bounced / failed`}                 accent="amber"   />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left col */}
            <div className="lg:col-span-2 space-y-5">
              {/* Agents */}
              <Section icon={<Terminal size={14} className="text-cyan-400" />} title="Active Agents">
                <div className="grid grid-cols-2 gap-3">
                  {AGENTS.map(agent => {
                    const agentTasks = recentTasks.filter((t: any) => t.assigned_to === agent.name);
                    return (
                      <div key={agent.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg ${agent.color} flex items-center justify-center`}>
                              <span className="text-white font-bold text-xs">{agent.name[0]}</span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white leading-tight">{agent.name}</p>
                              <p className="text-[10px] text-slate-500">{agent.role}</p>
                            </div>
                          </div>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                        </div>
                        <div className="space-y-1.5">
                          {agentTasks.slice(0, 2).map((task: any) => (
                            <div key={task.id} className="flex items-start gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                              <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[task.status] ?? 'bg-slate-600'}`} />
                              <span className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{task.title}</span>
                            </div>
                          ))}
                          {agentTasks.length === 0 && (
                            <p className="text-xs text-slate-600 italic">No active tasks</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>

              {/* Activity feed */}
              <Section icon={<Activity size={14} className="text-blue-400" />} title="Activity Feed">
                <div className="space-y-2">
                  {activities.length === 0 ? (
                    <p className="text-sm text-slate-600 text-center py-6">No recent activity</p>
                  ) : (
                    activities.map((a: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/40 hover:border-slate-600/60 transition-colors">
                        <div className="mt-0.5 shrink-0">
                          {a.activityType === 'task'  && <Clock    size={13} className="text-cyan-500"   />}
                          {a.activityType === 'idea'  && <Zap      size={13} className="text-yellow-400" />}
                          {a.activityType === 'intel' && <Database size={13} className="text-violet-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{a.activityType}</span>
                            <span className="text-[10px] text-slate-600 whitespace-nowrap shrink-0">
                              {new Date(a.ts).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-200 truncate font-medium">{a.title}</p>
                          {a.description && (
                            <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{a.description}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Section>
            </div>

            {/* Right col */}
            <div className="space-y-5">
              {/* Task breakdown */}
              <Section icon={<CheckCircle2 size={14} className="text-emerald-400" />} title="Task Breakdown">
                <div className="space-y-3">
                  {[
                    { label: 'Done',        value: stats.tasksDone,       color: 'bg-emerald-500' },
                    { label: 'In Progress', value: stats.tasksInProgress, color: 'bg-amber-400'   },
                    { label: 'Pending',     value: stats.tasksPending,    color: 'bg-slate-600'   },
                  ].map(row => (
                    <div key={row.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">{row.label}</span>
                        <span className="text-white font-semibold">{row.value}</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${row.color} rounded-full transition-all`}
                          style={{ width: stats.tasksTotal > 0 ? `${(row.value / stats.tasksTotal) * 100}%` : '0%' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Outreach */}
              <Section icon={<Activity size={14} className="text-pink-400" />} title="Outreach">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Sent</span>
                    <span className="text-sm font-bold text-white">{stats.outreachSent}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Bounced / Failed</span>
                    <span className="text-sm font-bold text-red-400">{stats.outreachBounced}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Delivery rate</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {stats.outreachSent > 0
                        ? `${Math.round(((stats.outreachSent - stats.outreachBounced) / stats.outreachSent) * 100)}%`
                        : '—'}
                    </span>
                  </div>
                </div>
              </Section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

const ACCENT_MAP: Record<string, string> = {
  cyan:    'text-cyan-400',
  violet:  'text-violet-400',
  emerald: 'text-emerald-400',
  amber:   'text-amber-400',
};

function StatCard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode; label: string; value: number; sub?: string; accent: string;
}) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
      <div className={`flex items-center gap-1.5 text-xs font-medium mb-2 ${ACCENT_MAP[accent] ?? 'text-slate-400'}`}>
        {icon}
        <span className="uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-black text-white leading-none mb-1">{value.toLocaleString()}</div>
      {sub && <div className="text-[10px] text-slate-500">{sub}</div>}
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-widest">{title}</h2>
      </div>
      {children}
    </div>
  );
}
