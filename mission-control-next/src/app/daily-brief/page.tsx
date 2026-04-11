"use client";
import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Coffee, AlertTriangle, CheckCircle2, Zap, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function DailyBrief() {
  const [intel, setIntel] = useState<any[]>([]);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [inProgressTasks, setInProgressTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [{ data: intelData }, { data: tasksData }] = await Promise.all([
        supabase.from('intel').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('tasks').select('*').order('updated_at', { ascending: false }),
      ]);
      if (intelData) setIntel(intelData);
      if (tasksData) {
        setInProgressTasks(tasksData.filter((t: any) => t.status === 'in_progress'));
        setPendingTasks(tasksData.filter((t: any) => ['todo', 'backlog', 'pending_review'].includes(t.status)).slice(0, 5));
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-full bg-white text-slate-900 font-sans">
      {/* Full-width Header */}
      <div className="bg-slate-950 text-white px-8 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="text-pink-400" size={28} />
                <h1 className="text-4xl font-black tracking-tight">Daily Brief</h1>
              </div>
              <p className="text-slate-400 text-lg font-medium">{dateStr}</p>
            </div>
            <Coffee size={32} className="text-pink-400" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-10 space-y-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 font-medium">Loading intelligence...</p>
          </div>
        ) : (
          <>
            {/* In Progress Now */}
            {inProgressTasks.length > 0 && (
              <section>
                <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                  <Zap size={20} className="text-amber-500" /> In Progress Right Now
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inProgressTasks.map(task => (
                    <div key={task.id} className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-bold text-slate-900 text-base leading-snug">{task.title}</h3>
                        <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" /> Active
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{task.description}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono bg-slate-200 px-2 py-0.5 rounded">{task.project || 'General'}</span>
                        <span>·</span>
                        <span>{task.assigned_to || 'Unassigned'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Critical Intel */}
            <section>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-rose-500" /> Critical Intel
              </h2>
              {intel.length > 0 ? (
                <div className="space-y-4">
                  {intel.map(item => (
                    <div key={item.id} className="bg-slate-50 border border-slate-200 p-6 rounded-xl">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
                        <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded-full ${
                          item.importance === 'high' ? 'bg-rose-100 text-rose-700' :
                          item.importance === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>{item.importance || 'normal'}</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed mb-3">{item.summary}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        {item.source && <a href={item.source} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate max-w-[200px]">{item.source}</a>}
                        {item.date && <span>· {new Date(item.date).toLocaleDateString()}</span>}
                        {item.category && <span className="font-mono bg-slate-200 px-2 py-0.5 rounded">{item.category}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No critical intel at this time.</p>
              )}
            </section>

            {/* Action Required Today */}
            <section>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-600" /> Action Required Today
              </h2>
              {pendingTasks.length > 0 ? (
                <ul className="space-y-3">
                  {pendingTasks.map(task => (
                    <li key={task.id} className="flex items-start gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                      <div className="mt-0.5">
                        <Clock size={16} className="text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800 text-sm">{task.title}</div>
                        {task.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{task.description}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-slate-500">{task.assigned_to || 'Unassigned'}</div>
                        <div className="text-xs text-slate-400">{task.project || 'General'}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400 italic bg-slate-50 border border-slate-200 p-4 rounded-xl">No pending tasks. All clear!</p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
