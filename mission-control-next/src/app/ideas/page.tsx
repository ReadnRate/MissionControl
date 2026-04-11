"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Lightbulb, Plus, Check, Zap, X, MessageSquare, Send } from 'lucide-react';

const AGENTS = [
  { id: 'joe', name: 'Joe', role: 'Orchestrator' },
  { id: 'forge', name: 'Forge', role: 'Developer' },
  { id: 'aura', name: 'Aura', role: 'Marketing' },
  { id: 'beacon', name: 'Beacon', role: 'Research' },
  { id: 'super-data', name: 'Super Data', role: 'Analyst' },
  { id: 'skill-hunter', name: 'Skill Hunter', role: 'Scout' },
];

export default function Ideas() {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [transforming, setTransforming] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newIdeaForm, setNewIdeaForm] = useState({ title: '', details: '', project: '' });

  const [activeIdea, setActiveIdea] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [selectedAgentForTask, setSelectedAgentForTask] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data } = await supabase.from('ideas').select('*').order('created_at', { ascending: false });
    if (data) setIdeas(data);
    setLoading(false);
  }

  async function openIdea(idea: any) {
    setActiveIdea(idea);
    const { data } = await supabase.from('idea_comments').select('*').eq('idea_id', idea.id).order('created_at', { ascending: true });
    setComments(data || []);
  }

  async function handleCreateIdea(e: React.FormEvent) {
    e.preventDefault();
    if (!newIdeaForm.title.trim()) return;
    await supabase.from('ideas').insert([{
      title: newIdeaForm.title,
      details: newIdeaForm.details,
      project: newIdeaForm.project || 'General',
      status: 'pending',
    }]);
    setNewIdeaForm({ title: '', details: '', project: '' });
    setShowCreateModal(false);
    fetchData();
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !activeIdea) return;
    const isCommand = newComment.includes('@');
    const { data } = await supabase.from('idea_comments').insert([{
      idea_id: activeIdea.id,
      content: newComment,
      author: 'Manuel'
    }]).select();
    if (data) {
      setComments([...comments, data[0]]);
      setNewComment("");
      if (isCommand) {
        const agentNameMatch = newComment.match(/@(\w+)/);
        const agentName = agentNameMatch ? agentNameMatch[1] : "Agent";
        const { data: sysData } = await supabase.from('idea_comments').insert([{
          idea_id: activeIdea.id,
          content: `[SYSTEM] ${agentName} has been pinged. Research/task execution initiated.`,
          author: 'Orchestrator'
        }]).select();
        if (sysData) setComments(prev => [...prev, sysData[0]]);
      }
    }
  }

  async function convertToTask() {
    if (!activeIdea || !selectedAgentForTask) {
      alert("Select an agent first.");
      return;
    }
    setTransforming(activeIdea.id);
    try {
      await supabase.from('tasks').insert([{
        title: activeIdea.title,
        description: activeIdea.details,
        project: activeIdea.project,
        priority: 'high',
        status: 'todo',
        assigned_to: selectedAgentForTask,
        source_idea_id: activeIdea.id
      }]);
      await supabase.from('ideas').update({ status: 'task' }).eq('id', activeIdea.id);
      setActiveIdea(null);
      fetchData();
    } catch (e: any) {
      console.error(e);
      alert("Error: " + e.message);
    } finally {
      setTransforming(null);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-700 font-mono">
      <header className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Lightbulb className="text-yellow-500" size={28} />
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Ideas Vault</h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">Concept Brainstorming & Action Center</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-4 rounded-lg transition-colors text-sm"
        >
          <Plus size={16} /> New Idea
        </button>
      </header>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">New Idea</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-slate-900"><X size={24}/></button>
            </div>
            <form onSubmit={handleCreateIdea} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Title</label>
                <input required type="text" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 outline-none focus:border-yellow-500" value={newIdeaForm.title} onChange={e => setNewIdeaForm({...newIdeaForm, title: e.target.value})} placeholder="What's the idea?" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Details</label>
                <textarea className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 outline-none focus:border-yellow-500 h-24" value={newIdeaForm.details} onChange={e => setNewIdeaForm({...newIdeaForm, details: e.target.value})} placeholder="Describe the idea..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Project</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 outline-none focus:border-yellow-500" value={newIdeaForm.project} onChange={e => setNewIdeaForm({...newIdeaForm, project: e.target.value})} placeholder="e.g. Read & Rate, Trym" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-lg text-slate-500 font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-bold">Create Idea</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {activeIdea && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-slate-900">{activeIdea.title}</h3>
                  <span className="text-xs font-bold px-2 py-1 bg-yellow-50 text-yellow-600 rounded border border-yellow-200">{activeIdea.project || 'General'}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded border ${activeIdea.status === 'task' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {activeIdea.status === 'task' ? '→ Turned into Task' : 'Idea'}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{activeIdea.details}</p>
              </div>
              <button onClick={() => setActiveIdea(null)} className="text-slate-500 hover:text-slate-900"><X size={24}/></button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Comments */}
              <div className="flex-1 flex flex-col border-r border-slate-200 bg-slate-50">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {comments.length === 0 ? (
                    <div className="text-center text-slate-500 text-sm mt-10">No comments yet. Mention @Beacon or @Forge to assign research.</div>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className={`p-4 rounded-xl ${c.author === 'Manuel' ? 'bg-white ml-8 border border-slate-200' : c.author === 'Orchestrator' ? 'bg-cyan-50 border border-cyan-200' : 'bg-white mr-8 border border-slate-200'}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-xs font-bold ${c.author === 'Manuel' ? 'text-slate-900' : c.author === 'Orchestrator' ? 'text-cyan-600' : 'text-yellow-600'}`}>{c.author}</span>
                          <span className="text-[10px] text-slate-500">{new Date(c.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-4 border-t border-slate-200 bg-white">
                  <form onSubmit={addComment} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Comment or ask @Beacon to research..."
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-900 outline-none focus:border-yellow-500"
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                    />
                    <button type="submit" className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-bold flex items-center justify-center transition-colors">
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              </div>

              {/* Actions Sidebar */}
              <div className="w-64 p-6 bg-white flex flex-col gap-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Status</h4>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {activeIdea.status === 'task' ? <><Check size={16} className="text-emerald-500"/> Promoted to Task</> : <><Lightbulb size={16} className="text-yellow-500"/> Conceptual</>}
                  </div>
                </div>

                {activeIdea.status !== 'task' && (
                  <div className="pt-6 border-t border-slate-200">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Convert to Task</h4>
                    <select
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2 mb-3 outline-none focus:border-yellow-500"
                        value={selectedAgentForTask}
                        onChange={e => setSelectedAgentForTask(e.target.value)}
                      >
                        <option value="">-- Select Assignee --</option>
                        {AGENTS.map(a => <option key={a.id} value={a.name}>{a.name} ({a.role})</option>)}
                    </select>
                    <button
                      onClick={convertToTask}
                      disabled={transforming === activeIdea.id}
                      className="w-full flex items-center justify-center gap-2 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-600 hover:text-black font-bold py-2 rounded-lg border border-yellow-300 transition-all disabled:opacity-50"
                    >
                      {transforming === activeIdea.id ? <span className="animate-spin">...</span> : <><Zap size={16} /> Make it a Task</>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ideas Grid */}
      {loading ? (
        <div className="text-center py-10"><span className="animate-pulse text-yellow-500">Decrypting Vault...</span></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ideas.length === 0 ? (
             <div className="col-span-2 text-slate-500 p-6 bg-white rounded-xl border border-slate-200 text-center">Vault is empty. Add your first idea above.</div>
          ) : (
            ideas.map((idea) => (
              <div
                key={idea.id}
                onClick={() => openIdea(idea)}
                className={`cursor-pointer bg-white border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all ${idea.status === 'task' ? 'border-emerald-300' : 'border-slate-200 hover:border-yellow-400'}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-slate-900 flex-1 pr-2">{idea.title}</h3>
                  <span className="text-xs font-bold px-2 py-1 bg-yellow-50 text-yellow-600 rounded-md border border-yellow-200 shrink-0">{idea.project || 'General'}</span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">{idea.details}</p>
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${idea.status === 'task' ? 'bg-emerald-100 text-emerald-700' : idea.status === 'done' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{idea.status}</span>
                  <span className="text-slate-400">{new Date(idea.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
