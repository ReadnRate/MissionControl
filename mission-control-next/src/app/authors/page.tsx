"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AuthorsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 50;

  useEffect(() => {
    async function fetchLeads() {
      try {
        setLoading(true);
        
        // Get total count
        const { count, error: countError } = await supabase
          .from('author_leads')
          .select('*', { count: 'exact', head: true });
          
        if (countError) throw countError;
        setTotalCount(count || 0);

        // Fetch paginated data
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        
        const { data, error } = await supabase
          .from('author_leads')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;
        setLeads(data || []);
      } catch (err: any) {
        console.error("Error fetching leads:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchLeads();
  }, [page]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-8 max-w-[95%] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Users className="text-cyan-600" size={32} />
            Author Leads
          </h1>
          <p className="text-slate-500 mt-1">Monitor newly acquired indie authors directly from the database.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 flex items-center gap-3">
          <span className="text-sm text-slate-500">Total Leads</span>
          <span className="text-xl font-bold text-cyan-600">{totalCount}</span>
        </div>
      </div>

      <div className="bg-white/50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading author leads...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-400">Error loading leads: {error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-white border-b border-slate-200 whitespace-nowrap">
                <tr>
                  <th className="px-4 py-3 font-medium">First Name</th>
                  <th className="px-4 py-3 font-medium">Last Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Book Title</th>
                  <th className="px-4 py-3 font-medium">Genre</th>
                  <th className="px-4 py-3 font-medium">Website URL</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Personalization Text</th>
                  <th className="px-4 py-3 font-medium">Created At</th>
                  <th className="px-4 py-3 font-medium">Updated At</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-slate-500 italic">
                      No authors found in the database yet. Run the lead generator!
                    </td>
                  </tr>
                ) : (
                  leads.map((lead: any) => (
                    <tr key={lead.id} className="border-b border-slate-200/50 hover:bg-slate-100/20 transition-colors whitespace-nowrap">
                      <td className="px-4 py-3 font-medium text-slate-900">{lead.first_name}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{lead.last_name}</td>
                      <td className="px-4 py-3 text-cyan-600 font-mono text-xs">{lead.email}</td>
                      <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate" title={lead.book_title}>{lead.book_title}</td>
                      <td className="px-4 py-3">{lead.genre}</td>
                      <td className="px-4 py-3">
                        {lead.website_url ? (
                          <a 
                            href={lead.website_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline max-w-[150px] truncate"
                            title={lead.website_url}
                          >
                            <ExternalLink size={12} className="shrink-0" />
                            {lead.website_url}
                          </a>
                        ) : (
                          <span className="text-slate-400 italic text-xs">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{lead.status}</td>
                      <td className="px-4 py-3">
                        {lead.personalization_text ? (
                          <div className="max-w-[200px] text-xs text-slate-500 truncate" title={lead.personalization_text}>
                            {lead.personalization_text}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        {lead.created_at ? new Date(lead.created_at).toLocaleString() : ''}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        {lead.updated_at ? new Date(lead.updated_at).toLocaleString() : ''}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination Controls */}
        {!loading && totalCount > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-white">
            <span className="text-sm text-slate-500">
              Showing <span className="font-medium text-slate-900">{((page - 1) * pageSize) + 1}</span> to <span className="font-medium text-slate-900">{Math.min(page * pageSize, totalCount)}</span> of <span className="font-medium text-slate-900">{totalCount}</span> entries
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-medium text-slate-700 px-2">
                Page {page} of {totalPages || 1}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
