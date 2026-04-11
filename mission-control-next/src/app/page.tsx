"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Terminal, Zap, CheckCircle2, Clock, Eye, Activity, Database } from 'lucide-react';

const AGENTS = [
  { id: 'joe', name: 'Joe', role: 'Orchestrator', emoji: '🦞' },
  { id: 'forge', name: 'Forge', role: 'Developer', emoji: '🔨' },
  { id: 'aura', name: 'Aura', role: 'Marketing', emoji: '✨' },
  { id: 'beacon', name: 'Beacon', role: 'Research', emoji: '🔥' },
];

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    tasksTotal: 0, tasksDone: 0, tasksInProgress: 0, tasksPending: 0,
    authorLeads: 0, trymLeads: 0,
    outreachSent: 0, outreachBounced: 0,
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

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
        supabase.from('trym_leads').select('id', { count: 'exact', head: true }),
        supabase.from('outreach_log').select('*'),
        supabase.from('ideas').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('intel').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      const tasks = allTasks || [];
      const outreachData = outreach || [];
      const ideasData = ideas || [];
      const intelData = intel || [];

      const tasksDone = tasks.filter((t: any) => t.status === 'done').length;
      const tasksInProgress = tasks.filter((t: any) => t.status === 'in_progress').length;
      const tasksPending = tasks.filter((t: any) => ['todo', 'backlog', 'pending_review'].includes(t.status)).length;
      const outreachSent = outreachData.filter((o: any) => o.status === 'sent').length;
      const outreachBounced = outreachData.filter((o: any) => ['bounced', 'failed'].includes(o.status)).length;

      setStats({
        tasksTotal: tasks.length,
        tasksDone,
        tasksInProgress,
        tasksPending,
        authorLeads: authorCount ?? 0,
        trymLeads: trymCount ?? 0,
        outreachSent,
        outreachBounced,
      });

      setRecentTasks(tasks.slice(0, 6));

      // Build activity feed from tasks + ideas + intel
      const rawActivities = [
        ...tasks.map((t: any) => ({ ...t, activityType: 'task', title: t.title, created_at: t.updated_at || t.created_at })),
        ...ideasData.map((i: any) => ({ ...i, activityType: 'idea', title: i.title })),
        ...intelData.map((i: any) => ({ ...i, activityType: 'intel', title: i.title || i.source_name || 'Intel Item' })),
      ].filter(a => a.created_at)
       .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
       .slice(0, 10);

      setActivities(rawActivities);
    } catch (e) {
      console.error("Data fetch error:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-slate-700 font-mono">
      <header className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Agent Command Center</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Live status board & direct communication interface</p>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-64">
           <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-cyan-600 uppercase tracking-widest animate-pulse">Syncing Core DB...</span>
           </div>
        </div>
      ) : (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Tasks" value={stats.tasksTotal} sub={`${stats.tasksDone} done · ${stats.tasksInProgress} active`} color="text-cyan-600" />
            <StatCard label="Author Leads" value={stats.authorLeads} sub="in database" color="text-emerald-600" />
            <StatCard label="Trym Leads" value={stats.trymLeads} sub="in database" color="text-violet-600" />
            <StatCard label="Emails Sent" value={stats.outreachSent} sub={`${stats.outreachBounced} bounced/failed`} color="text-amber-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Active Agents */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Terminal size={20} className="text-cyan-600" />
                  <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider">Active Agents</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {AGENTS.map((agent) => {
                    const agentTasks = recentTasks.filter((t: any) => t.assigned_to === agent.name);
                    return (
                      <div key={agent.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:border-cyan-300 transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-lg shadow-sm">
                              {agent.emoji}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900">{agent.name}</h3>
                              <p className="text-xs text-slate-500">{agent.role}</p>
                            </div>
                          </div>
                          <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        </div>
                        <div className="space-y-2 mt-4">
                          {agentTasks.slice(0, 2).map((task: any) => (
                            <div key={task.id} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                              {task.status === 'done' ? (
                                <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                              ) : task.status === 'in_progress' ? (
                                <Zap size={14} className="text-amber-500 mt-0.5 shrink-0 animate-pulse" />
                              ) : (
                                <Clock size={14} className="text-slate-400 mt-0.5 shrink-0" />
                              )}
                              <span className="text-xs text-slate-600 line-clamp-2">{task.title}</span>
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
              </div>

              {/* Recent Activity */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Activity size={18} className="text-blue-600" />
                  Global Activity Feed
                </h2>
                <div className="space-y-4">
                  {activities.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">No recent activity</p>
                  ) : (
                    activities.map((activity: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-4 p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                        <div className="mt-1">
                          {activity.activityType === 'task' && <Clock size={16} className="text-cyan-600" />}
                          {activity.activityType === 'idea' && <Zap size={16} className="text-yellow-500" />}
                          {activity.activityType === 'intel' && <Database size={16} className="text-purple-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                              {activity.activityType}
                            </span>
                            <span className="text-xs text-slate-400 whitespace-nowrap">
                              {new Date(activity.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-800 truncate font-medium">
                            {activity.title}
                          </p>
                          {activity.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                              {activity.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar - Chat placeholder */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Tasks Done</span>
                    <span className="text-sm font-bold text-emerald-600">{stats.tasksDone}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">In Progress</span>
                    <span className="text-sm font-bold text-amber-600">{stats.tasksInProgress}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Pending</span>
                    <span className="text-sm font-bold text-slate-600">{stats.tasksPending}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Outreach Sent</span>
                    <span className="text-sm font-bold text-cyan-600">{stats.outreachSent}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: number; sub?: string; color: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}
