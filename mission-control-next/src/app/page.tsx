"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Terminal, Zap, CheckCircle2, Clock, Activity,
  Database, TrendingUp, Users, Mail, BarChart3,
} from 'lucide-react';

const AGENTS = [
  { id: 'joe',    name: 'Joe',    role: 'Orchestrator', color: 'cyan'   },
  { id: 'forge',  name: 'Forge',  role: 'Developer',    color: 'violet' },
  { id: 'aura',   name: 'Aura',   role: 'Marketing',    color: 'pink'   },
  { id: 'beacon', name: 'Beacon', role: 'Research',     color: 'amber'  },
];

const AGENT_COLORS: Record<string, string> = {
  cyan:   'bg-cyan-50   border-cyan-200',
  violet: 'bg-violet-50 border-violet-200',
  pink:   'bg-pink-50   border-pink-200',
  amber:  'bg-amber-50  border-amber-200',
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

      const tasks        = allTasks   ?? [];
      const outreachData = outreach   ?? [];

      const tasksDone       = tasks.filter((t: any) => t.status === 'done').length;
      const tasksInProgress = tasks.filter((t: any) => t.status === 'in_progress').length;
      const tasksPending    = tasks.filter((t: any) => ['todo', 'backlog', 'pending_review'].includes(t.status)).length;
      const outreachSent    = outreachData.filter((o: any) => o.status === 'sent').length;
      const outreachBounced = outreachData.filter((o: any) => ['bounced', 'failed'].includes(o.status)).length;

      setStats({
        tasksTotal: tasks.length, tasksDone, tasksInProgress, tasksPending,
        authorLeads: authorCount ?? 0, trymLeads: trymCount ?? 0,
        outreachSent, outreachBounced,
      });

      setRecentTasks(tasks.slice(0, 8));

      const rawActivities = [
        ...tasks.map((t: any) => ({ ...t, _type: 'task',  title: t.title,                                 ts: t.updated_at || t.created_at })),
        ...(ideas ?? []).map((i: any) => ({ ...i, _type: 'idea',  title: i.title,                         ts: i.created_at })),
        ...(intel ?? []).map((i: any) => ({ ...i, _type: 'intel', title: i.title || i.source_name || '—', ts: i.created_at })),
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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex items-start justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Agent Command Center</h1>
          <p className="text-sm text-slate-500 mt-1">{today}</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          System Online
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-8 h-8 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Syncing…</span>
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard icon={<BarChart3  size={18} />} label="Total Tasks"   value={stats.tasksTotal}   sub={`${stats.tasksDone} done · ${stats.tasksInProgress} active`} accent="cyan"    />
            <StatCard icon={<Users      size={18} />} label="Author Leads"  value={stats.authorLeads}  sub="in database"                                                  accent="violet"  />
            <StatCard icon={<TrendingUp size={18} />} label="Trym Leads"   value={stats.trymLeads}    sub="in database"                                                  accent="emerald" />
            <StatCard icon={<Mail       size={18} />} label="Emails Sent"  value={stats.outreachSent} sub={`${stats.outreachBounced} bounced`}                           accent="amber"   />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: agents + activity */}
            <div className="lg:col-span-2 space-y-8">
              {/* Active agents */}
              <section>
                <SectionHeader icon={<Terminal size={16} />} title="Active Agents" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {AGENTS.map(agent => {
                    const agentTasks = recentTasks.filter((t: any) => t.assigned_to === agent.name);
                    return (
                      <div key={agent.id} className={`border rounded-2xl p-5 ${AGENT_COLORS[agent.color]} hover:shadow-md transition-shadow`}>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-black text-slate-900 text-base">{agent.name}</p>
                            <p className="text-xs text-slate-500 font-medium">{agent.role}</p>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                        </div>
                        <div className="space-y-2">
                          {agentTasks.slice(0, 2).map((task: any) => (
                            <div key={task.id} className="flex items-start gap-2 p-2 rounded-lg bg-white/70 border border-white/80">
                              {task.status === 'done'
                                ? <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                                : task.status === 'in_progress'
                                  ? <Zap size={13} className="text-amber-500 mt-0.5 shrink-0 animate-pulse" />
                                  : <Clock size={13} className="text-slate-400 mt-0.5 shrink-0" />}
                              <span className="text-xs text-slate-700 line-clamp-2 leading-snug">{task.title}</span>
                            </div>
                          ))}
                          {agentTasks.length === 0 && (
                            <p className="text-xs text-slate-400 italic">No active tasks</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Activity feed */}
              <section>
                <SectionHeader icon={<Activity size={16} />} title="Global Activity Feed" />
                <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-sm">
                  {activities.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">No recent activity</p>
                  ) : (
                    activities.map((a, i) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                        <div className="mt-0.5 shrink-0">
                          {a._type === 'task'  && <Clock    size={14} className="text-cyan-500"   />}
                          {a._type === 'idea'  && <Zap      size={14} className="text-yellow-500" />}
                          {a._type === 'intel' && <Database size={14} className="text-purple-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{a._type}</span>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {new Date(a.ts).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-800 font-medium truncate mt-0.5">{a.title}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* Right: quick stats */}
            <aside className="space-y-6">
              <div>
                <SectionHeader icon={<BarChart3 size={16} />} title="Quick Stats" />
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
                  {([
                    { label: 'Tasks Done',    value: stats.tasksDone,       color: 'text-emerald-600' },
                    { label: 'In Progress',   value: stats.tasksInProgress, color: 'text-amber-600'   },
                    { label: 'Pending',       value: stats.tasksPending,    color: 'text-slate-500'   },
                    { label: 'Outreach Sent', value: stats.outreachSent,    color: 'text-cyan-600'    },
                    { label: 'Bounced',       value: stats.outreachBounced, color: 'text-rose-500'    },
                  ] as const).map(row => (
                    <div key={row.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <span className="text-sm text-slate-500">{row.label}</span>
                      <span className={`text-sm font-black ${row.color}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Lead Counts</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Author leads</span>
                      <span className="text-sm font-black text-violet-600">{stats.authorLeads.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Trym leads</span>
                      <span className="text-sm font-black text-emerald-600">{stats.trymLeads.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode; label: string; value: number; sub?: string; accent: string;
}) {
  const map: Record<string, string> = {
    cyan:    'text-cyan-700    bg-cyan-50    border-cyan-100',
    violet:  'text-violet-700  bg-violet-50  border-violet-100',
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    amber:   'text-amber-700   bg-amber-50   border-amber-100',
  };
  const cls = map[accent] ?? 'text-slate-600 bg-white border-slate-200';
  return (
    <div className={`border rounded-xl p-5 shadow-sm ${cls}`}>
      <div className="flex items-center gap-2 mb-3 opacity-60">{icon}
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-3xl font-black">{value.toLocaleString()}</div>
      {sub && <div className="text-xs mt-1 opacity-60">{sub}</div>}
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-slate-400">{icon}</span>
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">{title}</h2>
    </div>
  );
}
