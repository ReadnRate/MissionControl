"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Globe,
  Users,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Filter,
  X,
  Trash2,
  CheckCircle,
} from "lucide-react";
import { deleteTrymLeads } from "./actions";

interface Lead {
  id: string;
  business_name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  services: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  status: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  new: number;
  contacted: number;
  invalid: number;
  byCity: [string, number][];
  byCountry: [string, number][];
}

interface TrymLeadsClientProps {
  initialLeads: Lead[];
  initialStats: Stats;
}

type SortKey = "business_name" | "email" | "phone" | "city" | "country" | "status" | "created_at";
type SortDir = "asc" | "desc";
type FilterStatus = "all" | "new" | "contacted" | "invalid";
type EnrichedFilter = "all" | "yes" | "no";

const PAGE_SIZE = 50;

export default function TrymLeadsClient({
  initialLeads: initialLeadsRaw,
  initialStats,
}: TrymLeadsClientProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [enrichedFilter, setEnrichedFilter] = useState<EnrichedFilter>("all");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [initialLeads, setInitialLeads] = useState(initialLeadsRaw);

  const stats = initialStats;

  // Show toast for 3 seconds
  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Build unique city list from data (preserve top cities from stats, fill from data)
  const cities = useMemo(() => {
    const seen = new Set<string>();
    initialLeads.forEach((l) => {
      if (l.city) seen.add(l.city);
    });
    return Array.from(seen).sort();
  }, [initialLeads]);

  // Core pipeline: filter → sort → paginate
  const { rows, totalPages, totalFiltered } = useMemo(() => {
    const q = search.trim().toLowerCase();

    let rows = initialLeads;

    if (q) {
      rows = rows.filter(
        (l) =>
          l.business_name.toLowerCase().includes(q) ||
          (l.email?.toLowerCase().includes(q) ?? false) ||
          (l.phone?.toLowerCase().includes(q) ?? false) ||
          (l.city?.toLowerCase().includes(q) ?? false) ||
          (l.country?.toLowerCase().includes(q) ?? false)
      );
    }

    if (cityFilter !== "all") {
      rows = rows.filter((l) => l.city === cityFilter);
    }

    if (statusFilter !== "all") {
      rows = rows.filter((l) => l.status === statusFilter);
    }

    if (enrichedFilter !== "all") {
      rows = rows.filter((l) => {
        const isEnriched = !!(l.logo_url || l.hero_image_url || l.services);
        return enrichedFilter === "yes" ? isEnriched : !isEnriched;
      });
    }

    // Sort
    rows = [...rows].sort((a, b) => {
      const av = (a[sortKey] ?? "") as string;
      const bv = (b[sortKey] ?? "") as string;
      return sortDir === "asc"
        ? av.localeCompare(bv)
        : bv.localeCompare(av);
    });

    const totalFiltered = rows.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));

    return { rows, totalPages, totalFiltered };
  }, [initialLeads, search, sortKey, sortDir, cityFilter, statusFilter, enrichedFilter]);

  // Reset to page 1 whenever filters/search change
  const currentPage = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, currentPage]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  // Multi-select handlers
  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === pageRows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pageRows.map((r) => r.id)));
    }
  }

  function selectAllOnPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      pageRows.forEach((r) => next.add(r.id));
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function handleDeleteSelected() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (
      !window.confirm(
        `Delete ${ids.length} row${ids.length > 1 ? "s" : ""}? This cannot be undone.`
      )
    )
      return;
    setDeleting(true);
    try {
      const res = await deleteTrymLeads(ids);
      if (res.success) {
        showToast(
          `${res.deleted} row${res.deleted > 1 ? "s" : ""} deleted`,
          true
        );
        clearSelection();
        setInitialLeads((prev) => prev.filter((l) => !ids.includes(l.id)));
      } else {
        showToast(`Delete failed: ${res.error}`, false);
      }
    } catch (e) {
      showToast(`Delete failed: ${e instanceof Error ? e.message : "Unknown error"}`, false);
    } finally {
      setDeleting(false);
    }
  }

  function statusColor(s: string | null) {
    switch ((s || "").toLowerCase()) {
      case "new":
        return "bg-blue-100 text-blue-700";
      case "contacted":
        return "bg-yellow-100 text-yellow-700";
      case "replied":
        return "bg-purple-100 text-purple-700";
      case "converted":
        return "bg-green-100 text-green-700";
      case "invalid":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  }

  function clearFilters() {
    setSearch("");
    setCityFilter("all");
    setStatusFilter("all");
    setEnrichedFilter("all");
    setPage(1);
  }

  const hasActiveFilters =
    search.trim() !== "" || cityFilter !== "all" || statusFilter !== "all" || enrichedFilter !== "all";

  const allPageSelected =
    pageRows.length > 0 && pageRows.every((r) => selectedIds.has(r.id));

  // Build visible page numbers (show up to 7 pages)
  function pageNumbers() {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col)
      return <ChevronUp size={12} className="opacity-30" />;
    return sortDir === "asc" ? (
      <ChevronUp size={12} className="text-cyan-500" />
    ) : (
      <ChevronDown size={12} className="text-cyan-500" />
    );
  }

  return (
    <div className="p-8 mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Users className="text-cyan-600" size={32} />
            Trym Leads
          </h1>
          <p className="text-slate-500 mt-1">
            Business leads from the Trym pipeline.
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 flex items-center gap-3 shadow-sm">
          <span className="text-sm text-slate-500">Total</span>
          <span className="text-xl font-bold text-cyan-600">
            {(stats?.total ?? 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Total Leads
          </div>
          <div className="text-3xl font-black text-slate-900">
            {(stats?.total ?? 0).toLocaleString()}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            By City
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {!stats?.byCity || stats.byCity.length === 0 ? (
              <div className="text-sm text-slate-400">No data</div>
            ) : (
              stats.byCity.slice(0, 6).map(([city, count]) => (
                <div
                  key={city}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-slate-600 truncate flex items-center gap-1">
                    <MapPin size={10} />
                    {city}
                  </span>
                  <span className="font-semibold text-slate-800 ml-2 shrink-0">
                    {count}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            By Status
          </div>
          <div className="space-y-1">
            {(
              [
                ["new", stats?.new ?? 0],
                ["contacted", stats?.contacted ?? 0],
                ["invalid", stats?.invalid ?? 0],
              ] as [string, number][]
            ).map(([status, count]) => (
              <div
                key={status}
                className="flex justify-between items-center text-sm"
              >
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(
                    status
                  )}`}
                >
                  {status}
                </span>
                <span className="font-semibold text-slate-800 ml-2 shrink-0">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toolbar: Search + Filters + Clear + Delete Selected */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search name, email, city, country..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
              clearSelection();
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent shadow-sm"
          />
        </div>

        {/* City Filter */}
        <div className="relative">
          <MapPin
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <select
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setPage(1);
              clearSelection();
            }}
            className="pl-8 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-sm cursor-pointer appearance-none"
          >
            <option value="all">All Cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Filter
            size={12}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as FilterStatus);
              setPage(1);
              clearSelection();
            }}
            className="pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-sm cursor-pointer appearance-none"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="invalid">Invalid</option>
          </select>
          <Filter
            size={12}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>

        {/* Enriched Filter */}
        <div className="relative">
          <select
            value={enrichedFilter}
            onChange={(e) => {
              setEnrichedFilter(e.target.value as EnrichedFilter);
              setPage(1);
              clearSelection();
            }}
            className="pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-sm cursor-pointer appearance-none"
          >
            <option value="all">All Enriched</option>
            <option value="yes">Yes (enriched)</option>
            <option value="no">No (not enriched)</option>
          </select>
          <Filter
            size={12}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={() => {
              clearFilters();
              clearSelection();
            }}
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            <X size={13} />
            Clear
          </button>
        )}

        {/* Selected count + Delete button */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm font-semibold text-slate-700">
              {selectedIds.size} selected
            </span>
            <button
              onClick={clearSelection}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X size={13} />
              Clear
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Trash2 size={13} />
              {deleting ? "Deleting..." : `Delete ${selectedIds.size}`}
            </button>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-slate-500">
        Showing{" "}
        <span className="font-semibold text-slate-700">
          {totalFiltered === 0
            ? 0
            : (currentPage - 1) * PAGE_SIZE + 1}
          {totalFiltered > 0 &&
            `–${Math.min(currentPage * PAGE_SIZE, totalFiltered)}`}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-slate-700">
          {totalFiltered.toLocaleString()}
        </span>{" "}
        {totalFiltered !== stats?.total && (
          <span className="text-slate-400">
            (filtered from {stats?.total?.toLocaleString()} total)
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {totalFiltered === 0 ? (
          <div className="p-16 text-center">
            <div className="text-slate-300 mb-2">
              <Search size={32} className="mx-auto" />
            </div>
            <p className="text-slate-500 font-medium">
              {hasActiveFilters
                ? "No leads match your filters."
                : "No leads found in the database."}
            </p>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  clearFilters();
                  clearSelection();
                }}
                className="mt-3 text-sm text-cyan-600 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 whitespace-nowrap">
                  <tr>
                    {/* Select-all checkbox + select-all button */}
                    <th className="px-3 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        ref={(el) => {
                          if (el)
                            (el as HTMLInputElement).indeterminate =
                              !allPageSelected && selectedIds.size > 0;
                        }}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                      />
                    </th>
                    {(
                      [
                        ["business_name", "Business Name", "w-[200px]"],
                        ["email", "Email", "w-[230px]"],
                        ["website", "Website", "w-[130px] max-w-[130px]"],
                        ["city", "City", "w-[130px]"],
                        ["city", "City", "w-[130px]"],
                        ["enriched", "Enriched", "w-[90px]"],
                        ["status", "Status", "w-[100px]"],
                        ["created_at", "Created", "w-[110px]"],
                      ] as [SortKey, string, string][]
                    ).map(([key, label, width]) => (
                      <th
                        key={key}
                        className={`px-3 py-3 font-medium cursor-pointer hover:text-slate-800 select-none ${width}`}
                        onClick={() => toggleSort(key)}
                      >
                        <span className="flex items-center gap-1">
                          {label}
                          <SortIcon col={key} />
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((lead) => {
                    const checked = selectedIds.has(lead.id);
                    return (
                      <tr
                        key={lead.id}
                        className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                          checked ? "bg-cyan-50" : ""
                        }`}
                      >
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleOne(lead.id)}
                            className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-3 font-medium text-slate-900 truncate">
                          {lead.business_name}
                        </td>
                        <td className="px-3 py-3">
                          {lead.email ? (
                            <a
                              href={`mailto:${lead.email}`}
                              className="text-cyan-600 hover:underline font-mono text-xs flex items-center gap-1 truncate"
                            >
                              <Mail size={11} />
                              {lead.email}
                            </a>
                          ) : (
                            <span className="text-slate-300 italic text-xs">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 w-[130px] max-w-[130px] overflow-hidden">
                          {lead.website ? (
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-600 hover:underline text-xs flex items-center gap-1 truncate"
                            >
                              <Globe size={11} className="shrink-0" />
                              <span className="truncate">{lead.website.replace(/^https?:\/\//, "")}</span>
                            </a>
                          ) : (
                            <span className="text-slate-300 italic text-xs">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <span className="flex items-center gap-1 text-xs">
                            <MapPin
                              size={11}
                              className="text-slate-400 shrink-0"
                            />
                            <span className="truncate">{lead.city || "—"}</span>
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {lead.logo_url || lead.hero_image_url || lead.services ? (
                            <span className="text-green-600 text-lg" title="Enriched via WebFetch">✓</span>
                          ) : (
                            <span className="text-slate-300 text-lg" title="Not yet enriched">✗</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(
                              lead.status
                            )}`}
                          >
                            {lead.status || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-400 text-xs whitespace-nowrap">
                          {lead.created_at
                            ? new Date(lead.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
                {/* Prev */}
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                >
                  <ChevronLeft size={14} />
                  Prev
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {pageNumbers().map((p, i) =>
                    p === "..." ? (
                      <span
                        key={`ellipsis-${i}`}
                        className="px-2 py-1.5 text-sm text-slate-400"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`min-w-[34px] h-8 text-sm rounded-lg transition-colors ${
                          currentPage === p
                            ? "bg-cyan-600 text-white font-semibold"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>

                {/* Next */}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium shadow-lg z-50 ${
            toast.ok
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {toast.ok ? (
            <CheckCircle size={15} className="text-green-500 shrink-0" />
          ) : (
            <X size={15} className="text-red-500 shrink-0" />
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
