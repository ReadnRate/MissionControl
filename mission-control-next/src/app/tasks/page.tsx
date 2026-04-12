"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ListTodo, CheckCircle2, Zap, Clock, Plus, X, Play, Edit3, Trash2, Eye } from 'lucide-react';

const AGENTS = [
  { id: 'joe',          name: 'Joe',         role: 'Orchestrator' },
  { id: 'forge',        name: 'Forge',       role: 'Developer'    },
  { id: 'aura',         name: 'Aura',        role: 'Marketing'    },
  { id: 'beacon',       name: 'Beacon',      role: 'Research'     },
  { id: 'super-data',   name: 'Super Data',  role: 'Analyst'      },
  { id: 'skill-hunter', name: 'Skill Hunter',role: 'Scout'        },
];

const COLUMNS = [
  { key: 'todo',           label: 'To Do',          icon: <Clock size={13} />,        color: 'text-slate-500'   },
  { key: 'in_progress',    label: 'In Progress',     icon: <Zap size={13} />,          color: 'text-amber-500'   },
  { key: 'pending_review', label: 'Pending Review',  icon: <Eye size={13} />,          color: 'text-orange-500'  },
  { key: 'done',           label: 'Done',            icon: <CheckCircle2 size={13} />, color: 'text-emerald-500' },
] as const;

type Column = typeof COLUMNS[number]['key'];

const EMPTY_FORM = { title: '', description: '', project: '', assigned_to: '', status: 'todo' as string };

export default function Tasks() {
  const [tasks,       setTasks]       = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [taskForm,    setTaskForm]    = useState(EMPTY_FORM);
  const [triggering,  setTriggering]  = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (data) setTasks(data);
    setLoading(false);
  }

  async function updateStatus(id: string, newStatus: string) {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
    fetchData();
  }

  function openCreateModal() {
    setEditingTask(null);
    setTaskForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEditModal(task: any) {
    setEditingTask(task.id);
    setTaskForm({
      title: task.title, description: task.description ?? '',
      project: task.project ?? '', assigned_to: task.assigned_to ?? '', status: task.status,
    });
    setShowModal(true);
  }

  async function handleSaveTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskForm.title) return;
    if (editingTask) {
      await supabase.from('tasks').update(taskForm).eq('id', editingTask);
    } else {
      await supabase.from('tasks').insert([taskForm]);
    }
    setShowModal(false);
    fetchData();
  }

  async function deleteTask() {
    if (!editingTask) return;
    if (!confirm('Delete this task?')) return;
    await supabase.from('tasks').delete().eq('id', editingTask);
    setShowModal(false);
    fetchData();
  }

  async function activateTask(task: any) {
    if (!task.assigned_to) { alert('Please assign an agent first.'); return; }
    setTriggering(task.id);
    try {
      await supabase.from('tasks').update({ status: 'in_progress' }).eq('id', task.id);
      await fetchData();
    } catch (e: any) {
      alert('Failed to update task.');
    } finally {
      setTriggering(null);
    }
  }

  const byStatus = (key: Column) =>
    tasks.filter(t => key === 'todo' ? ['todo', 'backlog'].includes(t.status) : t.status === key);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <ListTodo className="text-cyan-600" size={24} />
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Active Tasks</h1>
            <p className="text-sm text-slate-500 mt-0.5">Task management & agent assignment</p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm"
        >
          <Plus size={16} /> New Task
        </button>
      </header>

      {/* Create / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-2xl w-full max-w-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">{editingTask ? 'Edit Task' : 'New Task'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Title</label>
                <input
                  required type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition"
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Instructions for Agent</label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition h-28 resize-none"
                  value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Project</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition"
                    value={taskForm.project}
                    placeholder="e.g. Read & Rate"
                    onChange={e => setTaskForm({ ...taskForm, project: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Assign Agent</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 outline-none focus:border-cyan-400 transition"
                    value={taskForm.assigned_to}
                    onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                  >
                    <option value="">— Unassigned —</option>
                    {AGENTS.map(a => <option key={a.id} value={a.name}>{a.name} ({a.role})</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                {editingTask
                  ? <button type="button" onClick={deleteTask} className="flex items-center gap-1.5 text-rose-500 hover:text-rose-600 text-sm font-semibold transition-colors">
                      <Trash2 size={15} /> Delete
                    </button>
                  : <span />}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-slate-500 hover:text-slate-700 font-semibold transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors shadow-sm">
                    {editingTask ? 'Save' : 'Create'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-7 h-7 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading tasks…</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-start">
          {COLUMNS.map(col => {
            const colTasks = byStatus(col.key);
            return (
              <div key={col.key} className="space-y-3">
                <div className={`flex items-center gap-1.5 font-bold text-xs uppercase tracking-widest ${col.color}`}>
                  {col.icon} {col.label}
                  <span className="ml-auto font-mono bg-slate-100 text-slate-500 rounded-full px-1.5 py-0.5 text-[10px]">
                    {colTasks.length}
                  </span>
                </div>
                {colTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={s => updateStatus(task.id, s)}
                    onActivate={col.key === 'todo' ? () => activateTask(task) : undefined}
                    onEdit={() => openEditModal(task)}
                    triggering={triggering === task.id}
                  />
                ))}
                {colTasks.length === 0 && (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-300">
                    Empty
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TaskCard({
  task, onStatusChange, onActivate, onEdit, triggering,
}: {
  task: any;
  onStatusChange: (status: string) => void;
  onActivate?: () => void;
  onEdit: () => void;
  triggering?: boolean;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 hover:shadow-md transition-all flex flex-col group">
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h4 className="font-bold text-slate-900 text-sm leading-snug">{task.title}</h4>
          <button
            onClick={onEdit}
            className="text-slate-300 hover:text-cyan-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
          >
            <Edit3 size={14} />
          </button>
        </div>
        {task.project && (
          <span className="self-start text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-500 mb-2">
            {task.project}
          </span>
        )}
        {task.description && (
          <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{task.description}</p>
        )}
        <div className="mt-auto pt-3" />
      </div>

      <div className="px-4 pb-4">
        {onActivate && task.assigned_to && (
          <button
            onClick={onActivate}
            disabled={triggering}
            className="w-full flex items-center justify-center gap-1.5 border border-cyan-200 bg-cyan-50 hover:bg-cyan-600 text-cyan-700 hover:text-white rounded-lg py-1.5 mb-3 text-xs font-bold transition-all disabled:opacity-50"
          >
            {triggering
              ? <span className="animate-pulse">Activating…</span>
              : <><Play size={11} fill="currentColor" /> Activate</>}
          </button>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded bg-cyan-100 border border-cyan-200 flex items-center justify-center text-[9px] font-black text-cyan-700">
              {task.assigned_to?.substring(0, 2).toUpperCase() ?? '?'}
            </div>
            <span className="text-xs text-slate-400">{task.assigned_to ?? 'Unassigned'}</span>
          </div>
          <select
            className="bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-500 rounded-lg px-2 py-1 outline-none hover:border-cyan-300 transition-colors uppercase"
            value={task.status}
            onChange={e => onStatusChange(e.target.value)}
          >
            <option value="backlog">Backlog</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="pending_review">Pending Review</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>
    </div>
  );
}
