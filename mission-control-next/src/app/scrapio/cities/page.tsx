"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Play, Globe, Clock, CheckCircle2, Loader2, XCircle, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

const WEBHOOK_URL = 'https://n8n.readnrate.com/webhook/trym-scrapio';

const KEYWORDS = ["Hair Salon", "Hairdresser", "Barber shop"];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  pending: { label: 'Pending', color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200', icon: Clock },
  running: { label: 'Running', color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200', icon: Loader2 },
  done:    { label: 'Done',    color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200', icon: CheckCircle2 },
  failed:  { label: 'Failed',  color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200', icon: XCircle },
};

export default function CitiesPage() {
  const [cities, setCities] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set());

  const limit = 20;

  const fetchCities = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('scrapio_cities').select('*', { count: 'exact' });

    if (search) query = query.ilike('city', `%${search}%`);
    if (countryFilter !== 'ALL') query = query.eq('country', countryFilter);
    if (statusFilter !== 'ALL') query = query.eq('status', statusFilter);

    const from = (page - 1) * limit;
    query = query.order('population', { ascending: false, nullsFirst: false }).range(from, from + limit - 1);

    const { data, count, error } = await query;
    if (!error && data) {
      setCities(data);
      if (count !== null) setTotalCount(count);
    }

    const { data: allData } = await supabase.from('scrapio_cities').select('status');
    if (allData) {
      const counts: Record<string, number> = { pending: 0, running: 0, done: 0, failed: 0 };
      allData.forEach((row: any) => { counts[row.status] = (counts[row.status] || 0) + 1; });
      setStatusCounts(counts);
    }

    setLoading(false);
  }, [page, search, countryFilter, statusFilter]);

  // Poll DB every 15 seconds for real-time status updates
  useEffect(() => {
    const interval = setInterval(fetchCities, 15000);
    return () => clearInterval(interval);
  }, [fetchCities]);

  useEffect(() => { fetchCities(); }, [fetchCities]);
  useEffect(() => { setPage(1); }, [search, countryFilter, statusFilter]);

  async function handleRun(city: any) {
    const missing = KEYWORDS.filter(k => !(city.keywords_completed || []).includes(k));
    const keywordToRun = missing[0] || KEYWORDS[0];
    setRunningIds(prev => new Set([...prev, city.id]));
    try {
      await supabase.from('scrapio_cities').update({ status: 'running' }).eq('id', city.id);
      setCities(prev => prev.map(c => c.id === city.id ? { ...c, status: 'running' } : c));
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: city.city, state: city.state || '', country: city.country, keyword: keywordToRun }),
      });
      if (!res.ok) throw new Error('Webhook failed');
    } catch {
      await supabase.from('scrapio_cities').update({ status: 'failed' }).eq('id', city.id);
      setCities(prev => prev.map(c => c.id === city.id ? { ...c, status: 'failed' } : c));
    } finally {
      setRunningIds(prev => { const next = new Set(prev); next.delete(city.id); return next; });
    }
  }

  async function handleRunAllPending() {
    if (!confirm('Run all pending cities on current filter?')) return;
    let query = supabase.from('scrapio_cities').select('*').eq('status', 'pending');
    if (countryFilter !== 'ALL') query = query.eq('country', countryFilter);
    query = query.limit(50);
    const { data: pendingCities } = await query;
    if (!pendingCities || pendingCities.length === 0) return alert('No pending cities found.');
    alert(`Triggering ${pendingCities.length} cities...`);
    for (const city of pendingCities) { handleRun(city); await new Promise(r => setTimeout(r, 500)); }
  }

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="p-8 max-w-[95%] mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Globe className="text-cyan-600" size={32} />
            City Management
          </h1>
          <p className="text-slate-500 mt-1">Top 100 cities per country — Hair Salon, Hairdresser, Barber shop.</p>
        </div>
        <button
          onClick={handleRunAllPending}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2 rounded-lg transition-colors shadow-sm text-sm"
        >
          <Zap size={16} />
          Run All Pending (Max 50)
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total</div>
          <div className="text-2xl font-black text-slate-900">{totalCount}</div>
        </div>
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
          const count = statusCounts[status] || 0;
          const Icon = cfg.icon;
          return (
            <div key={status} className={`bg-white ${cfg.border} border rounded-xl p-4 shadow-sm`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={14} className={cfg.color} />
                <span className={`text-xs font-semibold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
              </div>
              <div className={`text-2xl font-black ${cfg.color}`}>{count}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-cyan-500"
          />
        </div>
        <select
          value={countryFilter}
          onChange={e => setCountryFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-500"
        >
          <option value="ALL">All Countries</option>
          <option value="US">🇺🇸 USA</option>
          <option value="CA">🇨🇦 Canada</option>
          <option value="MX">🇲🇽 Mexico</option>
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="running">Running</option>
          <option value="done">Done</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-xs text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 font-semibold">City</th>
                <th className="px-4 py-3 font-semibold">State</th>
                <th className="px-4 py-3 font-semibold">Country</th>
                <th className="px-4 py-3 font-semibold text-right">Population</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Keywords</th>
                <th className="px-4 py-3 font-semibold">Run At</th>
                <th className="px-4 py-3 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && cities.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400"><Loader2 className="animate-spin mx-auto" size={24} /></td></tr>
              ) : cities.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400">No cities found.</td></tr>
              ) : cities.map(city => {
                const cfg = STATUS_CONFIG[city.status] || STATUS_CONFIG.pending;
                const StatusIcon = cfg.icon;
                const keywords = city.keywords_completed || [];
                const missing = KEYWORDS.filter(k => !keywords.includes(k));

                return (
                  <tr key={city.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">{city.city}</td>
                    <td className="px-4 py-3 text-slate-500">{city.state || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{city.country}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-500 text-xs">
                      {city.population ? city.population.toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                        <StatusIcon size={11} className={city.status === 'running' ? 'animate-spin' : ''} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {KEYWORDS.map(k => (
                          <span key={k} className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${
                            keywords.includes(k)
                              ? 'bg-cyan-100 text-cyan-700 border-cyan-200'
                              : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}>
                            {k}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {city.run_at ? new Date(city.run_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleRun(city)}
                        disabled={runningIds.has(city.id) || missing.length === 0}
                        className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded transition-colors ${
                          missing.length === 0
                            ? 'bg-slate-100 text-slate-400 cursor-default'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        }`}
                      >
                        {runningIds.has(city.id)
                          ? <Loader2 size={11} className="animate-spin" />
                          : missing.length === 0 ? <CheckCircle2 size={11} /> : <Play size={11} fill="currentColor" />
                        }
                        {missing.length === 0 ? 'All Done' : 'Run Next'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="text-xs text-slate-500">
            {(page - 1) * limit + 1}–{Math.min(page * limit, totalCount)} of {totalCount} cities
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-semibold text-slate-700">Page {page} of {totalPages || 1}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
