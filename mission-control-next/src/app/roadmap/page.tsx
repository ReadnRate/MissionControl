"use client";
import React, { useState, useEffect } from 'react';
import { Map, Zap, CheckCircle2, Clock, Plus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const QUARTERS = [
  { id: 'done', label: 'Completed', color: 'emerald', icon: CheckCircle2 },
  { id: 'in_progress', label: 'In Progress', color: 'cyan', icon: Zap },
  { id: 'q2_2026', label: 'Q2 2026', color: 'violet', icon: Clock },
  { id: 'future', label: 'Future', color: 'slate', icon: Clock },
];

function inferQuarter(task: any): string {
  if (task.status === 'done') return 'done';
  if (task.status === 'in_progress') return 'in_progress';
  // Infer from project and priority
  if (task.project === 'Read & Rate' && task.priority === 'high') return 'q2_2026';
  if (task.project === 'Trym') return 'q2_2026';
  return 'future';
}

export default function Roadmap() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', project: '', priority: 'medium', quarter: 'q2_2026' });

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    setLoading(true);
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (data) setTasks(data);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    // Infer status from quarter
    const status = form.quarter === 'done' ? 'done' : form.quarter === 'in_progress' ? 'in_progress' : 'todo';
    await supabase.from('tasks').insert([{
      title: form.title,
      description: form.description,
      project: form.project || 'General',
      priority: form.priority,
      status,
    }]);
    setForm({ title: '', description: '', project: '', priority: 'medium', quarter: 'q2_2026' });
    setShowAddModal(false);
    fetchTasks();
  }

  const grouped: Record<string, any[]> = {
    done: [],
    in_progress: [],
    q2_2026: [],
    future: [],
  };
  tasks.forEach(t => {
    const q = inferQuarter(t);
    grouped[q].push(t);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-700 font-mono">
      <header className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Map className="text-violet-600" size={28} />
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Strategic Roadmap</h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">Mission tasks organized by milestone</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
        >
          <Plus size={16} /> Add Milestone
        </button>
      </header>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Add Roadmap Item</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-slate-900"><X size={24}/></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Title</label>
                <input required type="text" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 outline-none focus:border-violet-500" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Milestone title" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Description</label>
                <textarea className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 outline-none focus:border-violet-500 h-24" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="What needs to be done?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Project</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 outline-none focus:border-violet-500" value={form.project} onChange={e => setForm({...form, project: e.target.value})} placeholder="e.g. Read & Rate" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Priority</label>
                  <select className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 outline-none focus:border-violet-500" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Quarter</label>
                <select className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 outline-none focus:border-violet-500" value={form.quarter} onChange={e => setForm({...form, quarter: e.target.value})}>
                  <option value="in_progress">In Progress</option>
                  <option value="q2_2026">Q2 2026</option>
                  <option value="future">Future</option>
                  <option value="done">Completed</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg text-slate-500 font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold">Add Milestone</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10"><span className="animate-pulse text-violet-500">Loading roadmap...</span></div>
      ) : (
        <div className="relative border-l-2 border-slate-200 ml-4 space-y-10 pb-8">
          {QUARTERS.map((q) => {
            const items = grouped[q.id] || [];
            const colorMap: Record<string, string> = {
              emerald: 'border-emerald-500 text-emerald-600 bg-emerald-50',
              cyan: 'border-cyan-500 text-cyan-600 bg-cyan-50',
              violet: 'border-violet-500 text-violet-600 bg-violet-50',
              slate: 'border-slate-400 text-slate-500 bg-slate-100',
            };
            const dotColorMap: Record<string, string> = {
              emerald: 'bg-emerald-500',
              cyan: 'bg-cyan-500',
              violet: 'bg-violet-500',
              slate: 'bg-slate-400',
            };
            const Icon = q.icon;
            return (
              <div key={q.id} className="relative pl-8">
                <div className={`absolute -left-[11px] top-1 bg-white border-2 ${dotColorMap[q.color]} rounded-full w-5 h-5 flex items-center justify-center`}>
                  <Icon size={10} className={dotColorMap[q.color].replace('bg-', 'text-')} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{q.label}</h3>
                <p className="text-sm text-slate-500 mb-4">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
                <div className={`border ${colorMap[q.color].split(' ')[1]} p-4 rounded-xl bg-white shadow-sm`}>
                  {items.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">No items</p>
                  ) : (
                    <ul className="space-y-2 text-sm text-slate-700">
                      {items.map((task) => (
                        <li key={task.id} className="flex items-start gap-2">
                          {task.status === 'done' ? (
                            <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                          ) : task.status === 'in_progress' ? (
                            <Zap size={14} className="text-cyan-500 mt-0.5 shrink-0 animate-pulse" />
                          ) : (
                            <Clock size={14} className="text-slate-400 mt-0.5 shrink-0" />
                          )}
                          <span className={task.status === 'done' ? 'line-through text-slate-400' : ''}>{task.title}</span>
                          <span className="ml-auto text-xs text-slate-400 shrink-0">{task.project}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
