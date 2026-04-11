"use client";

import React, { useState, useEffect } from 'react';
import { Mail, Send, Activity, Users, Edit3, CheckCircle, XCircle, Save, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/lib/supabase';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [audienceSize, setAudienceSize] = useState<number>(0);

  // Edit Mode
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');

  // Reject Mode
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      const [{ data, error }, { count }] = await Promise.all([
        supabase
          .from('intel')
          .select('*')
          .eq('category', 'Marketing Campaign')
          .order('date', { ascending: false }),
        supabase
          .from('author_leads')
          .select('*', { count: 'exact', head: true })
      ]);
      
      if (data) setCampaigns(data);
      if (count !== null) setAudienceSize(count);
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    await supabase.from('intel').update({ importance: 'approved' }).eq('id', id);
    fetchCampaigns();
  }

  async function handleReject(id: string, campTitle: string) {
    if (!feedback.trim()) {
      alert("Please provide feedback for the agent.");
      return;
    }

    try {
      const { error: updateError } = await supabase.from('intel').update({ importance: 'rejected' }).eq('id', id);
      if (updateError) console.error("Update error:", updateError);
      
      const { error: insertError } = await supabase.from('tasks').insert([{
        title: `REWORK: ${campTitle}`,
        description: `The campaign was rejected by human review. Feedback to apply:\n\n${feedback}`,
        project: 'Marketing',
        assigned_to: 'Aura',
        status: 'todo'
      }]);
      
      if (insertError) {
        console.error("Insert error:", insertError);
        alert("Error creating task: " + insertError.message);
      } else {
        alert("Task successfully assigned back to Aura.");
      }
    } catch (e) {
      console.error("Error rejecting campaign:", e);
    }

    setRejectingId(null);
    setFeedback('');
    fetchCampaigns();
  }

  async function handleSaveEdit(id: string) {
    await supabase.from('intel').update({ 
      title: editTitle,
      summary: editContent 
    }).eq('id', id);
    setEditingId(null);
    fetchCampaigns();
  }

  function startEdit(camp: any) {
    setEditingId(camp.id);
    setEditTitle(camp.title);
    setEditContent(camp.summary);
  }

  function parseEmails(summary: string) {
    if (!summary) return [];
    
    // Attempt to split by common email headers like "# Email 1", "## Email 1", "Email 1:"
    // The regex looks for boundaries, keeps the delimiter attached to the segment
    const parts = summary.split(/(?=(?:#{1,3}\s*)?Email\s*#?\d+:?)/gi);
    
    // If it didn't split (e.g., only 1 part found), just return the original
    if (parts.length <= 1) return [summary];
    
    // Filter out empty parts
    return parts.filter(p => p.trim().length > 0);
  }

  function getStatusBadge(importance: string) {
    if (importance === 'approved') return <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded text-xs font-bold">Approved</span>;
    if (importance === 'rejected') return <span className="bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1 rounded text-xs font-bold">Rejected</span>;
    return <span className="bg-orange-100 text-orange-700 border border-orange-200 px-2 py-1 rounded text-xs font-bold">Pending Review</span>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Mail className="text-cyan-600" size={32} />
            Marketing Campaigns
          </h1>
          <p className="text-slate-500 mt-1">Manage email retargeting and marketing campaigns for Read & Rate.</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-cyan-600 hover:bg-cyan-500 text-slate-900 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors">
            <Send size={18} />
            New Campaign
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="bg-cyan-950/50 p-3 rounded-lg border border-cyan-900/50 text-cyan-600">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Active Campaigns</p>
            <p className="text-2xl font-bold text-slate-900">{campaigns.length}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-950/50 p-3 rounded-lg border border-emerald-900/50 text-emerald-600">
            <Send size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Emails Sent</p>
            <p className="text-2xl font-bold text-slate-900">0</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="bg-purple-950/50 p-3 rounded-lg border border-purple-900/50 text-purple-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Audience Size</p>
            <p className="text-2xl font-bold text-slate-900">{audienceSize.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white/50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white">
          <h2 className="text-lg font-bold text-slate-900">Campaign Library</h2>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center text-slate-500 italic">
            No campaigns found. Create your first email campaign to get started!
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {campaigns.map((camp) => (
              <div key={camp.id} className="p-6 hover:bg-slate-100/50 transition-colors relative">
                
                {/* View Mode */}
                {editingId !== camp.id && rejectingId !== camp.id && (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-cyan-600">{camp.title}</h3>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                          {getStatusBadge(camp.importance)}
                          <span>Source: {camp.source}</span>
                          <span>{new Date(camp.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {camp.importance !== 'approved' && (
                          <button onClick={() => handleApprove(camp.id)} className="bg-emerald-100 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 px-3 py-1.5 rounded flex items-center gap-1.5 text-sm font-bold transition-all">
                            <CheckCircle size={16} /> Approve
                          </button>
                        )}
                        <button onClick={() => setRejectingId(camp.id)} className="bg-rose-100 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 hover:border-rose-600 px-3 py-1.5 rounded flex items-center gap-1.5 text-sm font-bold transition-all">
                          <XCircle size={16} /> Reject
                        </button>
                        <button onClick={() => startEdit(camp)} className="bg-slate-100 hover:bg-slate-600 text-slate-700 hover:text-white border border-slate-200 hover:border-slate-600 px-3 py-1.5 rounded flex items-center gap-1.5 text-sm font-bold transition-all">
                          <Edit3 size={16} /> Edit
                        </button>
                      </div>
                    </div>
                    <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
                      {parseEmails(camp.summary).map((emailContent, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-xl mb-4 text-slate-600">
                          <ReactMarkdown
                            components={{
                              h1: ({node, ...props}) => <h1 className="text-2xl font-black text-cyan-600 mt-2 mb-4" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-xl font-bold text-cyan-600 mt-2 mb-3" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-lg font-bold text-cyan-600 mt-2 mb-2" {...props} />,
                              p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc list-outside mb-4 space-y-1 ml-6" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal list-outside mb-4 space-y-1 ml-6" {...props} />,
                              li: ({node, ...props}) => <li className="text-slate-600" {...props} />,
                              a: ({node, ...props}) => <a className="text-cyan-600 hover:text-cyan-300 underline underline-offset-2" {...props} />,
                              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-cyan-500/50 pl-4 italic text-slate-500 my-4 bg-slate-50 py-2 rounded-r-lg" {...props} />
                            }}
                          >
                            {emailContent}
                          </ReactMarkdown>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Edit Mode */}
                {editingId === camp.id && (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold text-slate-900">Edit Campaign</h3>
                      <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-slate-900">
                        <X size={20} />
                      </button>
                    </div>
                    <input 
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 font-bold outline-none focus:border-cyan-500" 
                    />
                    <textarea 
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-4 text-slate-600 font-mono text-sm h-[400px] outline-none focus:border-cyan-500"
                    />
                    <div className="flex justify-end gap-3">
                      <button onClick={() => setEditingId(null)} className="px-4 py-2 rounded text-slate-500 hover:text-slate-900 font-bold">Cancel</button>
                      <button onClick={() => handleSaveEdit(camp.id)} className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-900 font-bold flex items-center gap-2">
                        <Save size={16} /> Save Changes
                      </button>
                    </div>
                  </div>
                )}

                {/* Reject Mode */}
                {rejectingId === camp.id && (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold text-rose-600 flex items-center gap-2">
                        <XCircle size={20} /> Reject & Send Back to Agent
                      </h3>
                      <button onClick={() => setRejectingId(null)} className="text-slate-500 hover:text-slate-900">
                        <X size={20} />
                      </button>
                    </div>
                    <p className="text-sm text-slate-500">Provide feedback so the agent knows what to fix. A new task will be automatically created.</p>
                    <textarea 
                      placeholder="e.g., The tone is too informal, and we don't have a video demo. Rewrite it."
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-4 text-slate-900 text-sm h-32 outline-none focus:border-rose-500"
                    />
                    <div className="flex justify-end gap-3">
                      <button onClick={() => setRejectingId(null)} className="px-4 py-2 rounded text-slate-500 hover:text-slate-900 font-bold">Cancel</button>
                      <button onClick={() => handleReject(camp.id, camp.title)} className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 text-slate-900 font-bold flex items-center gap-2">
                        <Send size={16} /> Send to Agent
                      </button>
                    </div>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
