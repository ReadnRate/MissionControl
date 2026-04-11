"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Lightbulb, ThumbsUp, ThumbsDown, CheckCircle2, X } from 'lucide-react';

export default function IdeasVote() {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [votes, setVotes] = useState<Record<string, 'for' | 'against'>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIdeas();
    // Load votes from localStorage
    try {
      const stored = localStorage.getItem('idea_votes_v2');
      if (stored) setVotes(JSON.parse(stored));
    } catch {}
  }, []);

  async function fetchIdeas() {
    setLoading(true);
    const { data } = await supabase.from('ideas').select('*').order('created_at', { ascending: false });
    if (data) setIdeas(data);
    setLoading(false);
  }

  function getVoteCounts(ideaId: string): { for: number; against: number } {
    try {
      const stored = localStorage.getItem('idea_votes_v2');
      const allVotes: Record<string, Record<string, 'for' | 'against'>> = stored ? JSON.parse(stored) : {};
      const ideaVotes = Object.values(allVotes[ideaId] || {}).filter(Boolean);
      return {
        for: ideaVotes.filter((v: any) => v === 'for').length,
        against: ideaVotes.filter((v: any) => v === 'against').length,
      };
    } catch {
      return { for: 0, against: 0 };
    }
  }

  function recordVote(ideaId: string, voteType: 'for' | 'against') {
    const key = 'idea_votes_v2';
    let allVotes: Record<string, Record<string, 'for' | 'against'>> = {};
    try {
      const stored = localStorage.getItem(key);
      if (stored) allVotes = JSON.parse(stored);
    } catch {}

    if (!allVotes[ideaId]) allVotes[ideaId] = {};
    allVotes[ideaId]['user'] = voteType;
    localStorage.setItem(key, JSON.stringify(allVotes));
    setVotes(allVotes[ideaId] || {});
    // Force re-render
    setIdeas(prev => [...prev]);
  }

  const sortedIdeas = [...ideas].sort((a, b) => {
    const aScore = getVoteCounts(a.id).for - getVoteCounts(a.id).against;
    const bScore = getVoteCounts(b.id).for - getVoteCounts(b.id).against;
    return bScore - aScore;
  });

  return (
    <div className="min-h-full bg-white text-slate-900">
      {/* Header */}
      <div className="bg-slate-950 text-white px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Lightbulb className="text-yellow-400" size={28} />
            <h1 className="text-3xl font-black tracking-tight">Ideas Vote</h1>
          </div>
          <p className="text-slate-400 font-medium">Upvote ideas you want to prioritize. Sorted by community score.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 font-medium">Loading ideas...</p>
          </div>
        ) : sortedIdeas.length === 0 ? (
          <div className="text-center py-16 text-slate-400">No ideas yet. Add ideas in the Ideas Vault page.</div>
        ) : (
          <div className="space-y-4">
            {sortedIdeas.map((idea) => {
              const counts = getVoteCounts(idea.id);
              const myVote = votes[idea.id];
              return (
                <div key={idea.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    {/* Vote column */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <button
                        onClick={() => recordVote(idea.id, 'for')}
                        className={`p-2 rounded-lg transition-colors ${myVote === 'for' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-300 hover:text-emerald-500 hover:bg-emerald-50'}`}
                      >
                        <ThumbsUp size={20} fill={myVote === 'for' ? 'currentColor' : 'none'} />
                      </button>
                      <span className={`text-lg font-black ${counts.for - counts.against >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {counts.for - counts.against}
                      </span>
                      <button
                        onClick={() => recordVote(idea.id, 'against')}
                        className={`p-2 rounded-lg transition-colors ${myVote === 'against' ? 'bg-rose-100 text-rose-600' : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'}`}
                      >
                        <ThumbsDown size={20} fill={myVote === 'against' ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-bold text-slate-900">{idea.title}</h3>
                        <span className="text-xs font-bold px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded border border-yellow-200">{idea.project || 'General'}</span>
                        {idea.status === 'task' && (
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle2 size={12} /> Turned into Task</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed mb-3">{idea.details}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>{counts.for} 👍 {counts.against} 👎</span>
                        <span>·</span>
                        <span>{new Date(idea.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
