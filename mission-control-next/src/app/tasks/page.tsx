"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ListTodo, CheckCircle2, Zap, Clock, Plus, X, Play, Edit3, Trash2, Eye } from 'lucide-react';

const AGENTS = [
  { id: 'joe', name: 'Joe', role: 'Orchestrator' },
  { id: 'forge', name: 'Forge', role: 'Developer' },
  { id: 'aura', name: 'Aura', role: 'Marketing' },
  { id: 'beacon', name: 'Beacon', role: 'Research' },
  { id: 'super-data', name: 'Super Data', role: 'Analyst' },
  { id: 'skill-hunter', name: 'Skill Hunter', role: 'Scout' },
];

export default function Tasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', project: '', assigned_to: '', status: 'todo' });
  const [triggering, setTriggering] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: tasksData } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (tasksData) setTasks(tasksData);
    setLoading(false);
  }

  async function updateStatus(id: string, newStatus: string) {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
    fetchData();
  }

  function openCreateModal() {
    setEditingTask(null);
    setTaskForm({ title: '', description: '', project: '', assigned_to: '', status: 'todo' });
    setShowModal(true);
  }

  function openEditModal(task: any) {
    setEditingTask(task.id);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      project: task.project || '',
      assigned_to: task.assigned_to || '',
      status: task.status
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
    if (confirm("Are you sure you want to delete this task?")) {
      await supabase.from('tasks').delete().eq('id', editingTask);
      setShowModal(false);
      fetchData();
    }
  }

  async function activateTask(task: any) {
    if (!task.assigned_to) {
      alert("Please assign an agent first.");
      return;
    }
    setTriggering(task.id);
    try {
      await supabase.from('tasks').update({ status: 'in_progress' }).eq('id', task.id);
      await fetchData();
    } catch (e: any) {
      console.error(e);
      alert("Failed to update task status.");
    } finally {
      setTriggering(null);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-600 font-mono relative">
      <header className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <ListTodo className="text-cyan-600" size={28} />
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Active Tasks</h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">Task Management & Agent Assignment</p>
          </div>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-slate-900 font-bold py-2 px-4 rounded-lg transition-colors"
        >
          <Plus size={18} /> New Task
        </button>
      </header>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 p-6 rounded-2xl shadow-2xl w-full max-w-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">{editingTask ? 'Edit Task' : 'Create New Task'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-900"><X size={24}/></button>
            </div>
            <form onSubmit={handleSaveTask} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Title</label>
                <input required type="text" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 outline-none focus:border-cyan-500" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Description (Instructions for Agent)</label>
                <textarea className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 outline-none focus:border-cyan-500 h-32" value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Project Tag</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 outline-none focus:border-cyan-500" value={taskForm.project} onChange={e => setTaskForm({...taskForm, project: e.target.value})} placeholder="e.g. Read & Rate" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Assign Agent</label>
                  <select className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 outline-none focus:border-cyan-500" value={taskForm.assigned_to} onChange={e => setTaskForm({...taskForm, assigned_to: e.target.value})}>
                    <option value="">-- Unassigned --</option>
                    {AGENTS.map(a => <option key={a.id} value={a.name}>{a.name} ({a.role})</option>)}
                  </select>
                </div>
              </div>
              <div className="pt-6 flex justify-between items-center border-t border-slate-200">
                {editingTask ? (
                   <button type="button" onClick={deleteTask} className="flex items-center gap-1 text-rose-500 hover:text-rose-600 text-sm font-bold"><Trash2 size={16}/> Delete</button>
                ) : <div></div>}
                
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-lg text-slate-500 hover:text-slate-900 font-bold transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-900 font-bold transition-colors">{editingTask ? 'Save Changes' : 'Create Task'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10"><span className="animate-pulse text-cyan-500">Syncing Tasks...</span></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {/* Backlog / Todo */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-500 uppercase tracking-widest text-xs flex items-center gap-2"><Clock size={14} /> To Do</h3>
            {tasks.filter(t => ['todo', 'backlog'].includes(t.status)).map(task => (
              <TaskCard key={task.id} task={task} onStatusChange={(s) => updateStatus(task.id, s)} onActivate={() => activateTask(task)} onEdit={() => openEditModal(task)} triggering={triggering === task.id} />
            ))}
          </div>
          {/* In Progress */}
          <div className="space-y-4">
            <h3 className="font-bold text-yellow-500 uppercase tracking-widest text-xs flex items-center gap-2"><Zap size={14} /> In Progress</h3>
            {tasks.filter(t => t.status === 'in_progress').map(task => (
              <TaskCard key={task.id} task={task} onStatusChange={(s) => updateStatus(task.id, s)} onEdit={() => openEditModal(task)} />
            ))}
          </div>
          {/* Pending Review */}
          <div className="space-y-4">
            <h3 className="font-bold text-orange-600 uppercase tracking-widest text-xs flex items-center gap-2"><Eye size={14} /> Pending Review</h3>
            {tasks.filter(t => t.status === 'pending_review').map(task => (
              <TaskCard key={task.id} task={task} onStatusChange={(s) => updateStatus(task.id, s)} onEdit={() => openEditModal(task)} />
            ))}
          </div>
          {/* Done */}
          <div className="space-y-4">
            <h3 className="font-bold text-emerald-500 uppercase tracking-widest text-xs flex items-center gap-2"><CheckCircle2 size={14} /> Done</h3>
            {tasks.filter(t => t.status === 'done').map(task => (
              <TaskCard key={task.id} task={task} onStatusChange={(s) => updateStatus(task.id, s)} onEdit={() => openEditModal(task)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onStatusChange, onActivate, onEdit, triggering }: { task: any, onStatusChange: (status: string) => void, onActivate?: () => void, onEdit: () => void, triggering?: boolean }) {
  return (
    <div className="bg-white/50 border border-slate-200 rounded-xl shadow-xl hover:border-cyan-500/30 transition-all flex flex-col group">
      
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h4 className="font-bold text-slate-900 text-sm leading-snug">{task.title}</h4>
          <button onClick={onEdit} className="text-slate-600 hover:text-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity">
            <Edit3 size={16} />
          </button>
        </div>
        
        {task.project && <span className="inline-block self-start text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-500 mb-3">{task.project}</span>}
        
        <p className="text-xs text-slate-500 mb-4 line-clamp-4">{task.description}</p>
        
        {/* Spacer to push footer down but keep cards compact if content is small */}
        <div className="mt-auto"></div>
      </div>

      <div className="p-4 pt-0">
        {onActivate && task.assigned_to && (
          <button 
            onClick={onActivate}
            disabled={triggering}
            className="w-full flex items-center justify-center gap-2 bg-cyan-900/40 hover:bg-cyan-600 text-cyan-600 hover:text-slate-900 border border-cyan-900/50 hover:border-cyan-500 rounded py-2 mb-4 text-xs font-bold transition-all"
          >
            {triggering ? <span className="animate-pulse">Activating...</span> : <><Play size={12} fill="currentColor" /> ACTIVATE AGENT</>}
          </button>
        )}

        <div className="flex items-center justify-between border-t border-slate-200/50 pt-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-cyan-950/50 border border-cyan-900 flex items-center justify-center text-[10px] font-bold text-cyan-600">
              {task.assigned_to?.substring(0, 2).toUpperCase() || '??'}
            </div>
            <span className="text-xs text-slate-500">{task.assigned_to || 'Unassigned'}</span>
          </div>
          
          <select 
            className="bg-black/50 border border-slate-300 text-[10px] font-bold text-slate-600 rounded p-1 outline-none hover:border-cyan-500 transition-colors uppercase"
            value={task.status}
            onChange={(e) => onStatusChange(e.target.value)}
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
