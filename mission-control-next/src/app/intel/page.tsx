"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Flame, AlertCircle, Info, Filter, ExternalLink, Trash2, Send, MessageSquare } from 'lucide-react';

export default function Intel() {
  const [intel, setIntel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    async function fetchIntel() {
      const { data } = await supabase
        .from('intel')
        .select('*')
        .neq('category', 'Marketing Campaign')
        .order('created_at', { ascending: false });
      if (data) setIntel(data);
      setLoading(false);
    }
    fetchIntel();
  }, []);

  const categories = Array.from(new Set(intel.map(item => item.category).filter(Boolean)));
  const filteredIntel = filterCategory === 'all' ? intel : intel.filter(item => item.category === filterCategory);

  const renderSources = (sourceStr: string) => {
    if (!sourceStr || sourceStr === '#') return null;
    
    // Try to parse as JSON array of links
    try {
      const parsed = JSON.parse(sourceStr);
      if (Array.isArray(parsed)) {
        return (
          <div className="flex flex-wrap gap-2 mt-3">
            {parsed.map((link: string, idx: number) => (
              <a key={idx} href={link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-cyan-600 bg-cyan-950/30 px-2 py-1 rounded hover:bg-cyan-900/50 transition-colors border border-cyan-900/50">
                <ExternalLink size={12} /> Source {idx + 1}
              </a>
            ))}
          </div>
        );
      }
    } catch (e) {
      // Not JSON
    }

    // Check if it's a comma separated list of URLs
    if (sourceStr.includes('http')) {
      const links = sourceStr.split(/[\s,]+/).filter(s => s.startsWith('http'));
      if (links.length > 0) {
        return (
          <div className="flex flex-wrap gap-2 mt-3">
            {links.map((link: string, idx: number) => (
              <a key={idx} href={link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-cyan-600 bg-cyan-950/30 px-2 py-1 rounded hover:bg-cyan-900/50 transition-colors border border-cyan-900/50">
                <ExternalLink size={12} /> Source {idx + 1}
              </a>
            ))}
          </div>
        );
      }
    }

    // Fallback: just display as text if it's not a URL, or as a single link
    if (sourceStr.startsWith('http')) {
      return (
        <a href={sourceStr} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-cyan-600 bg-cyan-950/30 px-2 py-1 rounded hover:bg-cyan-900/50 transition-colors border border-cyan-900/50 mt-3 inline-flex">
          <ExternalLink size={12} /> View Source
        </a>
      );
    }

    return (
      <div className="mt-3 text-xs text-slate-500 bg-slate-100/50 px-2 py-1 rounded inline-block">
        Source: {sourceStr}
      </div>
    );
  };

  const removeIntelFromState = (id: string) => {
    setIntel(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-600 font-mono">
      <header className="mb-8 border-b border-slate-200 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Search className="text-cyan-600" size={28} />
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Intel Feed</h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">Market Research & Competitor Analysis (Beacon)</p>
            </div>
          </div>
          
          {/* Filtering Controls */}
          {!loading && categories.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="text-slate-500" size={16} />
              <select 
                className="bg-white border border-slate-300 text-sm rounded-lg px-3 py-2 text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((cat: any) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </header>

      {loading ? (
        <div className="text-center py-10"><span className="animate-pulse text-cyan-500">Syncing Intel Core...</span></div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredIntel.length === 0 ? (
             <div className="text-slate-500 p-6 bg-white/50 rounded-xl border border-slate-200 text-center">No intel found.</div>
          ) : (
            filteredIntel.map((item) => (
              <IntelCard 
                key={item.id} 
                item={item} 
                renderSources={renderSources} 
                onDelete={removeIntelFromState} 
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function IntelCard({ item, renderSources, onDelete }: { item: any, renderSources: (s: string) => React.ReactNode, onDelete: (id: string) => void }) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState(false);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this intel?")) {
      const { error } = await supabase.from('intel').delete().eq('id', item.id);
      if (!error) {
        onDelete(item.id);
      } else {
        alert('Failed to delete intel.');
      }
    }
  };

  const handleSendTask = async () => {
    if (!comment.trim()) return;
    setIsSubmitting(true);
    try {
      // 1. Insert into Tasks
      await supabase.from('tasks').insert([{
        title: `Review Intel: ${item.title.substring(0, 50)}${item.title.length > 50 ? '...' : ''}`,
        description: `Comment from Manuel: ${comment}\n\nIntel Summary: ${item.summary}\n\nSources: ${item.source}`,
        project: item.category || 'Intel',
        assigned_to: 'Joe',
        status: 'todo'
      }]);

      // 2. Append to events.txt via API
      await fetch('/api/intel/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intelId: item.id, intelTitle: item.title, comment })
      });
      
      setComment('');
      setShowCommentBox(false);
    } catch (error) {
      console.error(error);
      alert('Failed to send task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/50 border border-slate-200 p-5 rounded-2xl shadow-xl flex gap-4 transition-all hover:border-slate-300 group relative">
      <div className="pt-1">
        {item.importance === 'hot' ? <Flame className="text-rose-500" size={24} /> : 
         item.importance === 'high' ? <AlertCircle className="text-orange-500" size={24} /> :
         <Info className="text-blue-600" size={24} />}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold text-slate-900 pr-16">{item.title}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded-md text-slate-500 uppercase">{item.category}</span>
            <button 
              onClick={handleDelete} 
              className="text-slate-500 hover:text-rose-500 transition-colors p-1.5 rounded-lg hover:bg-rose-500/10 opacity-0 group-hover:opacity-100" 
              title="Delete Intel"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <div className="text-sm text-slate-500 mt-2 leading-relaxed whitespace-pre-wrap">{item.summary}</div>
        {renderSources(item.source)}

        {/* Task Assignment Area */}
        <div className="mt-4 pt-4 border-t border-slate-200/50">
          {!showCommentBox ? (
            <button 
              onClick={() => setShowCommentBox(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-cyan-500 hover:text-cyan-600 transition-colors"
            >
              <MessageSquare size={14} /> Add Comment & Send to Joe
            </button>
          ) : (
            <div className="flex items-start gap-2 mt-2">
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="What should Joe do with this? (e.g., research more, draft a post...)"
                className="flex-1 bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 outline-none focus:border-cyan-500 min-h-[60px] resize-none"
              />
              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleSendTask}
                  disabled={isSubmitting || !comment.trim()}
                  className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 px-3 py-2 rounded-lg transition-colors flex items-center justify-center min-w-[80px]"
                  title="Send Task"
                >
                  {isSubmitting ? <span className="animate-pulse text-xs font-bold">...</span> : <span className="flex items-center gap-1.5 text-xs font-bold"><Send size={14} /> Send</span>}
                </button>
                <button
                  onClick={() => setShowCommentBox(false)}
                  className="text-xs text-slate-500 hover:text-slate-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}