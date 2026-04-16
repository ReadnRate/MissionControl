"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Mail, RefreshCw, CheckCircle2, Search, X, ExternalLink, Trash2, Lightbulb, ListTodo } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────
type Classification = 'readnrate' | 'trym' | 'both' | 'ignore';
type EmailStatus = 'pending' | 'task_created' | 'intel_created' | 'deleted';
type Filter = 'all' | 'pending' | 'task_created' | 'intel_created' | 'deleted';

interface Email {
  gmail_id: string;
  thread_id: string;
  subject: string;
  from_email: string;
  body_preview: string;
  body_full?: string;
  urls?: { url: string; title?: string | null; description?: string | null }[];
  classification: Classification;
  status: EmailStatus;
  created_at: string;
}

interface TaskModal {
  email: Email;
}
interface IntelModal {
  email: Email;
}
interface DeleteConfirm {
  emailId: string;
}

// ── Badge Config ────────────────────────────────────────────────────
const BADGE: Record<Classification, { label: string; color: string; bg: string }> = {
  readnrate: { label: '📚 Read & Rate', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  trym:       { label: '🔍 Trym',       color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/30' },
  both:       { label: '🌐 Both',       color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  ignore:     { label: '🗑️ Ignoré',    color: 'text-slate-500', bg: 'bg-slate-500/10 border-slate-500/30' },
};

const FILTER_TABS: { key: Filter; label: string }[] = [
  { key: 'all',         label: 'Tous' },
  { key: 'pending',     label: 'Non traités' },
  { key: 'task_created',label: 'Tasks créées' },
  { key: 'intel_created',label: 'Intels créés' },
  { key: 'deleted',     label: 'Supprimés' },
];

const PROJECT_OPTIONS = ['Read & Rate', 'Trym', 'Both'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];
const TAG_OPTIONS = [
  'Tool', 'Competitor', 'Blog', 'Regulation', 'Sales-technique',
  'Marketing', 'AI', 'Productivity', 'Author', 'KDP', 'Local-Business', 'Enrichment'
];

// ── Helpers ────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch { return dateStr; }
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 text-sm font-medium z-50 animate-pulse">
      <CheckCircle2 size={16} /> {message}
    </div>
  );
}

// ── Task Modal ──────────────────────────────────────────────────────
function TaskModal({ email, onClose, onConfirm }: {
  email: Email; onClose: () => void;
  onConfirm: (data: { title: string; description: string; project: string; priority: string }) => void;
}) {
  const urlsText = (email.urls || [])
    .map((u, i) => `${i + 1}. ${u.title || u.url}${u.description ? `\n   ${u.description}` : ''}`)
    .join('\n');

  const [title, setTitle] = useState(email.subject.substring(0, 120));
  const [description, setDescription] = useState(
    `${email.body_preview}\n\n${email.urls && email.urls.length > 0 ? `**Liens:**\n${urlsText}` : ''}`
  );
  const [project, setProject] = useState(email.classification === 'readnrate' ? 'Read & Rate' : email.classification === 'trym' ? 'Trym' : 'Both');
  const [priority, setPriority] = useState('Medium');
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, project, priority, source_email_id: email.gmail_id, source_url: email.urls?.[0]?.url }),
      });
      if (res.ok) {
        onConfirm({ title, description, project, priority });
      } else {
        alert('Erreur lors de la création de la task');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="text-white font-bold text-base">📋 Créer une Task</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Titre</label>
            <input value={title} onChange={e => setTitle(e.target.value.substring(0, 120))}
              className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500" />
            <p className="text-xs text-slate-600 mt-1">{title.length}/120</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={7}
              className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500 resize-none font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Projet</label>
              <select value={project} onChange={e => setProject(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500">
                {PROJECT_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Priorité</label>
              <select value={priority} onChange={e => setPriority(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500">
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={handleConfirm} disabled={submitting}
            className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white font-bold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
            {submitting ? <span className="animate-pulse">Création...</span> : <><CheckCircle2 size={15} /> CONFIRMER LA TASK</>}
          </button>
          <button onClick={onClose}
            className="px-5 py-2.5 text-slate-400 hover:text-white font-medium text-sm transition-colors">
            ANNULER
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Intel Modal ─────────────────────────────────────────────────────
function IntelModal({ email, onClose, onConfirm }: {
  email: Email; onClose: () => void;
  onConfirm: (data: { title: string; summary: string; project: string; tags: string[] }) => void;
}) {
  const urlsAnalysis = (email.urls || [])
    .map((u, i) => `- [${u.title || u.url}](${u.url})${u.description ? `\n  ${u.description}` : ''}`)
    .join('\n');

  const [title, setTitle] = useState(email.subject.substring(0, 120));
  const [summary, setSummary] = useState(
    `${email.body_preview}\n\n${urlsAnalysis ? `**Analyse des liens:**\n${urlsAnalysis}` : ''}`
  );
  const [project, setProject] = useState(email.classification === 'readnrate' ? 'Read & Rate' : email.classification === 'trym' ? 'Trym' : 'Both');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Email']);
  const [submitting, setSubmitting] = useState(false);

  function toggleTag(tag: string) {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/intels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, summary, project, tags: selectedTags, source_email_id: email.gmail_id, source_url: email.urls?.[0]?.url }),
      });
      if (res.ok) {
        onConfirm({ title, summary, project, tags: selectedTags });
      } else {
        alert('Erreur lors de la création de l\'intel');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 sticky top-0 bg-slate-800">
          <h2 className="text-white font-bold text-base">🔍 Créer un Intel</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Titre</label>
            <input value={title} onChange={e => setTitle(e.target.value.substring(0, 120))}
              className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Résumé + Analyse</label>
            <textarea value={summary} onChange={e => setSummary(e.target.value)}
              rows={8}
              className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500 resize-none font-mono" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Projet</label>
            <select value={project} onChange={e => setProject(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500">
              {PROJECT_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Tags</label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors font-medium ${
                    selectedTags.includes(tag)
                      ? 'bg-cyan-600/20 border-cyan-500/60 text-cyan-400'
                      : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500'
                  }`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={handleConfirm} disabled={submitting}
            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
            {submitting ? <span className="animate-pulse">Création...</span> : <><CheckCircle2 size={15} /> CONFIRMER L'INTEL</>}
          </button>
          <button onClick={onClose}
            className="px-5 py-2.5 text-slate-400 hover:text-white font-medium text-sm transition-colors">
            ANNULER
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Email Card ───────────────────────────────────────────────────────
function EmailCard({ email, onTask, onIntel, onDelete }: {
  email: Email;
  onTask: (e: Email) => void;
  onIntel: (e: Email) => void;
  onDelete: (e: Email) => void;
}) {
  const badge = BADGE[email.classification] || BADGE.ignore;
  const isDeleted = email.status === 'deleted';
  const isTaskCreated = email.status === 'task_created';
  const isIntelCreated = email.status === 'intel_created';

  const borderColor = isTaskCreated ? 'border-l-4 border-l-emerald-500' : isIntelCreated ? 'border-l-4 border-l-blue-500' : '';

  const statusBadge = isTaskCreated
    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-2 py-0.5 rounded-full'
    : isIntelCreated
    ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs px-2 py-0.5 rounded-full'
    : null;

  return (
    <div className={`bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 transition-all ${borderColor} ${isDeleted ? 'opacity-50' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badge.color} ${badge.bg}`}>
              {badge.label}
            </span>
            {statusBadge && <span className={statusBadge}>{statusBadge}</span>}
            {isTaskCreated && <span className="text-emerald-400 text-xs font-bold">📋 Task créée</span>}
            {isIntelCreated && <span className="text-blue-400 text-xs font-bold">🔍 Intel créé</span>}
          </div>
          <p className={`text-sm font-bold text-slate-100 leading-snug ${isDeleted ? 'line-through text-slate-500' : ''}`}>
            {email.subject}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{email.from_email} · {formatDate(email.created_at)}</p>
        </div>
      </div>

      {/* Body Preview */}
      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3 font-mono">
        {email.body_preview}
      </p>

      {/* URLs */}
      {email.urls && email.urls.length > 0 && (
        <div className="mb-3 space-y-1">
          {email.urls.slice(0, 3).map((u, i) => (
            <a key={i} href={u.url} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-cyan-500 hover:text-cyan-400 transition-colors truncate">
              <ExternalLink size={11} /> {u.title || u.url}
            </a>
          ))}
          {email.urls.length > 3 && (
            <p className="text-xs text-slate-600">+{email.urls.length - 3} autres liens</p>
          )}
        </div>
      )}

      {/* Actions */}
      {!isDeleted && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700/60">
          <button onClick={() => onTask(email)}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-lg transition-colors">
            <ListTodo size={13} /> TASK
          </button>
          <button onClick={() => onIntel(email)}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 px-3 py-1.5 rounded-lg transition-colors">
            <Lightbulb size={13} /> INTEL
          </button>
          <button onClick={() => onDelete(email)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-rose-400 bg-slate-700/50 hover:bg-rose-500/10 border border-slate-600 hover:border-rose-500/30 px-3 py-1.5 rounded-lg transition-colors ml-auto">
            <Trash2 size={13} /> SUPPRIMER
          </button>
        </div>
      )}
    </div>
  );
}

// ── Delete Confirm ───────────────────────────────────────────────────
function DeleteConfirm({ emailId, onConfirm, onCancel }: { emailId: string; onConfirm: (id: string) => void; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-700/60">
      <span className="text-xs text-slate-400">Supprimer cet email de Gmail?</span>
      <button onClick={() => onConfirm(emailId)}
        className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 px-3 py-1.5 rounded-lg transition-colors">
        OUI
      </button>
      <button onClick={onCancel}
        className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 transition-colors">
        ANNULER
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function EmailsPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [taskModal, setTaskModal] = useState<TaskModal | null>(null);
  const [intelModal, setIntelModal] = useState<IntelModal | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchEmails = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch('/api/emails');
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails || []);
      }
    } catch (e) {
      console.error('Failed to fetch emails:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchEmails(); }, [fetchEmails]);

  function showToast(msg: string) { setToast(msg); }

  async function handleDeleteConfirm(email: Email) {
    setDeleteConfirm(null);
    try {
      const res = await fetch(`/api/emails/${email.gmail_id}`, { method: 'DELETE' });
      if (res.ok) {
        setEmails(prev => prev.map(e => e.gmail_id === email.gmail_id ? { ...e, status: 'deleted' } : e));
        showToast('Email supprimé de Gmail');
      }
    } catch { alert('Erreur lors de la suppression'); }
  }

  function handleTaskConfirm(email: Email, _data: any) {
    setTaskModal(null);
    setEmails(prev => prev.map(e => e.gmail_id === email.gmail_id ? { ...e, status: 'task_created' } : e));
    showToast('📋 Task créée avec succès');
  }

  function handleIntelConfirm(email: Email, _data: any) {
    setIntelModal(null);
    setEmails(prev => prev.map(e => e.gmail_id === email.gmail_id ? { ...e, status: 'intel_created' } : e));
    showToast('🔍 Intel créé avec succès');
  }

  const filteredEmails = emails.filter(e => {
    if (filter === 'all') return e.status !== 'deleted';
    return e.status === filter;
  });

  const pendingCount = emails.filter(e => e.status === 'pending').length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Mail size={20} className="text-cyan-400" /> Boîte de Réception
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {pendingCount > 0 ? `${pendingCount} email(s) en attente d'action` : 'Tous les emails ont été traités'}
          </p>
        </div>
        <button onClick={() => fetchEmails()}
          disabled={refreshing}
          className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg transition-colors">
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Chargement...' : '🔄 Actualiser'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTER_TABS.map(tab => {
          const count = tab.key === 'all'
            ? emails.filter(e => e.status !== 'deleted').length
            : emails.filter(e => e.status === tab.key).length;
          return (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className={`text-xs font-bold px-4 py-2 rounded-lg border transition-all ${
                filter === tab.key
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
                  : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600'
              }`}>
              {tab.label} {count > 0 && <span className="ml-1 opacity-60">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="animate-pulse text-slate-500 flex items-center gap-2">
            <RefreshCw size={16} className="animate-spin" /> Chargement des emails...
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredEmails.length === 0 && (
        <div className="text-center py-20">
          <p className="text-emerald-400 text-lg font-bold mb-2">✅ Tous les emails ont été traités</p>
          <p className="text-slate-500 text-sm mb-6">Reviens demain ou clique sur Analyser.</p>
          <button onClick={() => fetchEmails()}
            className="text-sm font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-6 py-2.5 rounded-lg transition-colors">
            🔄 ANALYSER MAINTENANT
          </button>
        </div>
      )}

      {/* Email List */}
      {!loading && filteredEmails.length > 0 && (
        <div className="space-y-3">
          {filteredEmails.map(email => (
            <div key={email.gmail_id}>
              <EmailCard
                email={email}
                onTask={e => setTaskModal({ email: e })}
                onIntel={e => setIntelModal({ email: e })}
                onDelete={e => setDeleteConfirm({ emailId: e.gmail_id, emails, onConfirm: handleDeleteConfirm, onCancel: () => setDeleteConfirm(null) } as any)}
              />
              {/* Inline delete confirm */}
              {deleteConfirm && deleteConfirm.emailId === email.gmail_id && (
                <div className="mt-2 bg-slate-800 border border-rose-500/30 rounded-lg p-3 flex items-center gap-3">
                  <span className="text-xs text-slate-300">Supprimer cet email de Gmail?</span>
                  <button onClick={() => handleDeleteConfirm(email)}
                    className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 px-3 py-1.5 rounded-lg transition-colors">
                    OUI
                  </button>
                  <button onClick={() => setDeleteConfirm(null)}
                    className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 transition-colors">
                    ANNULER
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {taskModal && (
        <TaskModal
          email={taskModal.email}
          onClose={() => setTaskModal(null)}
          onConfirm={data => handleTaskConfirm(taskModal.email, data)}
        />
      )}
      {intelModal && (
        <IntelModal
          email={intelModal.email}
          onClose={() => setIntelModal(null)}
          onConfirm={data => handleIntelConfirm(intelModal.email, data)}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
