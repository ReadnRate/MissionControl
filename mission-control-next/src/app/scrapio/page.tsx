"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Plus, Play, Trash2, Globe, Zap, CheckCircle2, Clock, XCircle, Users, TrendingUp, Loader2, X, ChevronDown } from 'lucide-react';

const WEBHOOK_URL = 'https://n8n.readnrate.com/webhook/trym-scrapio';

const KEYWORDS = [
  { value: 'hair salon', label: 'Hair Salon' },
  { value: 'hairdresser', label: 'Hairdresser' },
  { value: 'barber shop', label: 'Barber Shop' },
  { value: 'spa salon', label: 'Spa Salon' },
];

const COUNTRIES = [
  { value: 'USA', label: '🇺🇸 USA' },
  { value: 'Canada', label: '🇨🇦 Canada' },
  { value: 'Mexico', label: '🇲🇽 Mexico' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending:    { label: 'Pending',    color: 'text-slate-500',  bg: 'bg-slate-100',    icon: Clock },
  running:    { label: 'Running',    color: 'text-amber-500',  bg: 'bg-amber-100',    icon: Loader2 },
  completed:  { label: 'Completed',  color: 'text-emerald-600', bg: 'bg-emerald-100', icon: CheckCircle2 },
  failed:     { label: 'Failed',     color: 'text-rose-500',  bg: 'bg-rose-100',     icon: XCircle },
};

interface Toast { id: string; message: string; type: 'success' | 'error' | 'info' }

export default function ScrapioPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalRuns: 0, totalLeads: 0, byStatus: {} as Record<string, number> });
  const [leadsPreview, setLeadsPreview] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Form state
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [country, setCountry] = useState('USA');
  const [keyword, setKeyword] = useState('hair salon');
  const [submitting, setSubmitting] = useState(false);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => {
    fetchRuns();
  }, []);

  useEffect(() => {
    if (selectedCity) {
      fetchLeadsPreview(selectedCity);
    } else {
      setLeadsPreview([]);
    }
  }, [selectedCity]);

  async function fetchRuns() {
    setLoadingRuns(true);

    const [runsResult, leadsCountResult] = await Promise.all([
      supabase.from('scrapio_runs').select('*').order('run_at', { ascending: false }),
      supabase.from('trym_leads').select('id', { count: 'exact', head: true }),
    ]);

    const data = runsResult.data || [];
    if (!runsResult.error && data) {
      setRuns(data);
      const byStatus: Record<string, number> = {};
      data.forEach((r: any) => {
        byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      });
      const totalLeads = leadsCountResult.count ?? 0;
      setStats({ totalRuns: data.length, totalLeads, byStatus });
    }
    setLoadingRuns(false);
  }

  async function fetchLeadsPreview(cityFilter: string) {
    const { data } = await supabase
      .from('trym_leads')
      .select('business_name, address, phone, email, city, country, keyword, status, created_at, instagram, is_claimed, reviews_count, reviews_rating, website')
      .ilike('city', cityFilter)
      .order('created_at', { ascending: false })
      .limit(10);
    setLeadsPreview(data || []);
  }

  async function handleAddToQueue(e: React.FormEvent) {
    e.preventDefault();
    if (!city.trim() || !stateVal.trim()) {
      addToast('Please fill in city and state.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('scrapio_runs').insert([{
        city: city.trim(),
        state: stateVal.trim(),
        country,
        keyword,
        status: 'pending',
        leads_found: 0,
        leads_inserted: 0,
        run_at: new Date().toISOString(),
      }]);
      if (error) throw error;
      addToast(`${city.trim()}, ${stateVal.trim()} added to queue!`, 'success');
      setCity('');
      setStateVal('');
      fetchRuns();
    } catch (err: any) {
      addToast(`Error: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRunNow(run: any) {
    setRunningIds(prev => new Set([...prev, run.id]));
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: run.city,
          state: run.state,
          country: run.country,
          keyword: run.keyword,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await supabase.from('scrapio_runs').update({ status: 'running' }).eq('id', run.id);
      addToast(`Trigger sent for ${run.city}, ${run.state}!`, 'success');
      fetchRuns();
    } catch (err: any) {
      addToast(`Failed to trigger: ${err.message}`, 'error');
    } finally {
      setRunningIds(prev => {
        const next = new Set(prev);
        next.delete(run.id);
        return next;
      });
    }
  }

  async function handleDelete(runId: string) {
    if (!confirm('Delete this run record?')) return;
    await supabase.from('scrapio_runs').delete().eq('id', runId);
    addToast('Run deleted.', 'info');
    fetchRuns();
  }

  const citiesInRuns = Array.from(new Set(runs.map((r: any) => r.city).filter(Boolean)));

  return (
    <div className="p-8 max-w-[95%] mx-auto space-y-6">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-bold pointer-events-auto border ${
              toast.type === 'success' ? 'bg-emerald-900/90 border-emerald-600 text-emerald-100' :
              toast.type === 'error'   ? 'bg-rose-900/90 border-rose-600 text-rose-100' :
              'bg-slate-900/90 border-slate-600 text-slate-100'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-400" /> :
             toast.type === 'error'   ? <XCircle size={16} className="text-rose-400" /> :
             <Clock size={16} className="text-slate-400" />}
            {toast.message}
            <button onClick={() => removeToast(toast.id)} className="ml-2 opacity-70 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Search className="text-cyan-600" size={32} />
            Scrap.io
          </h1>
          <p className="text-slate-500 mt-1">Lead scraping queue &amp; run management for Trym.</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={Zap} label="Total Runs" value={stats.totalRuns} color="text-cyan-600" bg="bg-cyan-50 border-cyan-200" />
        <StatCard icon={Users} label="Total Leads Found" value={stats.totalLeads.toLocaleString()} color="text-violet-600" bg="bg-violet-50 border-violet-200" />
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const count = stats.byStatus[key] || 0;
          return (
            <StatCard key={key} icon={cfg.icon} label={cfg.label} value={count} color={cfg.color} bg={cfg.bg} />
          );
        })}
      </div>

      {/* Add City + Keyword Form */}
      <div className="bg-white/50 border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Plus size={18} className="text-cyan-600" />
          Add City to Queue
        </h2>
        <form onSubmit={handleAddToQueue} className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">City</label>
            <input
              type="text"
              placeholder="e.g. New York"
              className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm outline-none focus:border-cyan-500 w-48"
              value={city}
              onChange={e => setCity(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">State / Province</label>
            <input
              type="text"
              placeholder="e.g. NY"
              className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm outline-none focus:border-cyan-500 w-32 uppercase"
              value={stateVal}
              onChange={e => setStateVal(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Country</label>
            <select
              className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm outline-none focus:border-cyan-500 w-40"
              value={country}
              onChange={e => setCountry(e.target.value)}
            >
              {COUNTRIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Keyword</label>
            <select
              className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm outline-none focus:border-cyan-500 w-44"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            >
              {KEYWORDS.map(k => (
                <option key={k.value} value={k.value}>{k.label}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-400 text-white font-bold px-5 py-2 rounded-lg transition-colors text-sm"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {submitting ? 'Adding...' : 'Add to Queue'}
          </button>
        </form>
      </div>

      {/* Runs Table + Leads Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Runs Table */}
        <div className="lg:col-span-2 bg-white/50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-cyan-600" />
              Scrapio Runs
            </h2>
            <button onClick={fetchRuns} className="text-xs text-slate-500 hover:text-cyan-600 font-bold flex items-center gap-1">
              <Loader2 size={12} className={loadingRuns ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {loadingRuns ? (
            <div className="p-12 text-center text-slate-500 text-sm">Loading runs...</div>
          ) : runs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 italic text-sm">No runs yet. Add a city above to get started.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50/50 whitespace-nowrap">
                    <th className="px-4 py-3 font-medium">City</th>
                    <th className="px-4 py-3 font-medium">State</th>
                    <th className="px-4 py-3 font-medium">Country</th>
                    <th className="px-4 py-3 font-medium">Keyword</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-center">Leads Found</th>
                    <th className="px-4 py-3 font-medium text-center">Inserted</th>
                    <th className="px-4 py-3 font-medium">Run At</th>
                    <th className="px-4 py-3 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run: any) => {
                    const cfg = STATUS_CONFIG[run.status] || STATUS_CONFIG.pending;
                    const StatusIcon = cfg.icon;
                    return (
                      <tr key={run.id} className="border-b border-slate-200/50 hover:bg-slate-100/30 transition-colors">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedCity(selectedCity === run.city ? '' : run.city)}
                            className={`font-bold text-slate-900 hover:text-cyan-600 transition-colors underline-offset-2 ${selectedCity === run.city ? 'text-cyan-600 underline' : ''}`}
                          >
                            {run.city}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">{run.state}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{run.country}</td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{run.keyword}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                            <StatusIcon size={12} className={run.status === 'running' ? 'animate-spin' : ''} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-slate-700">{run.leads_found ?? 0}</td>
                        <td className="px-4 py-3 text-center font-mono text-slate-700">{run.leads_inserted ?? 0}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                          {run.run_at ? new Date(run.run_at).toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleRunNow(run)}
                              disabled={runningIds.has(run.id)}
                              className="flex items-center gap-1 text-xs font-bold px-2 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:text-slate-500 text-white transition-colors"
                              title="Run Now"
                            >
                              {runningIds.has(run.id) ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} fill="currentColor" />}
                              {runningIds.has(run.id) ? 'Running' : 'Run Now'}
                            </button>
                            <button
                              onClick={() => handleDelete(run.id)}
                              className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded hover:bg-rose-50"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Leads Preview */}
        <div className="bg-white/50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users size={18} className="text-cyan-600" />
              Leads Preview
            </h2>
            {selectedCity && (
              <span className="text-xs font-bold text-cyan-600 bg-cyan-50 border border-cyan-200 px-2 py-1 rounded-full">
                {leadsPreview.length} in {selectedCity}
              </span>
            )}
          </div>

          {!selectedCity ? (
            <div className="p-8 text-center">
              <p className="text-slate-400 text-sm italic mb-3">Click a city name in the table to preview its leads.</p>
              {citiesInRuns.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {citiesInRuns.slice(0, 8).map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedCity(c)}
                      className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-cyan-100 hover:text-cyan-700 border border-slate-200 hover:border-cyan-300 transition-colors"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : leadsPreview.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm italic">No leads found for {selectedCity} yet.</div>
          ) : (
            <div className="divide-y divide-slate-200/50">
              {leadsPreview.slice(0, 3).map((lead: any) => (
                <div key={lead.id} className="p-4 hover:bg-slate-100/30 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-bold text-slate-900 text-sm">{lead.business_name || '—'}</span>
                    {lead.reviews_rating ? (
                      <span className="text-xs font-bold text-amber-500 shrink-0">★ {lead.reviews_rating}</span>
                    ) : null}
                  </div>
                  <div className="text-xs text-slate-500 mb-1">{lead.address || '—'}</div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {lead.phone && <span className="font-mono text-slate-600">{lead.phone}</span>}
                    {lead.email && <span className="text-cyan-600">{lead.email}</span>}
                    {lead.instagram && <span className="text-pink-500">@{lead.instagram}</span>}
                    {lead.website && (
                      <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">🌐</a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {lead.is_claimed !== null && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${lead.is_claimed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {lead.is_claimed ? 'Claimed' : 'Unclaimed'}
                      </span>
                    )}
                    {lead.reviews_count !== null && (
                      <span className="text-[10px] text-slate-400">{lead.reviews_count} reviews</span>
                    )}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-auto ${
                      lead.status === 'new' ? 'bg-cyan-100 text-cyan-700' :
                      lead.status === 'contacted' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {lead.status || 'unknown'}
                    </span>
                  </div>
                </div>
              ))}
              {leadsPreview.length > 3 && (
                <div className="p-3 text-center text-xs text-slate-400 italic">
                  +{leadsPreview.length - 3} more leads in {selectedCity} — view full list in Trym app
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }: {
  icon: any; label: string; value: string | number; color: string; bg: string;
}) {
  return (
    <div className={`border rounded-xl p-4 ${bg}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} className={color} />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
    </div>
  );
}
