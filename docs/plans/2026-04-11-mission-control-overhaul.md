# Mission Control Overhaul — 2026-04-11

Complete overhaul of the Mission Control platform: branding, bin hygiene, UI redesign, and scripts cleanup.

---

## Plan A — Housekeeping

### A1 — Dependencies audit *(deferred)*
Review and update npm/pip dependencies across `bin/` and `mission-control-next/`.

### A2 — Branding: OpenClaw → ReadnRate

Replace stale "OpenClaw" brand references throughout the UI with "ReadnRate".

**Files to update:**
- `mission-control-next/src/app/layout.tsx` — page title tag
- `mission-control-next/src/components/Sidebar.tsx` — logo text, footer badge
- `mission-control-next/ecosystem.config.js` — app name (backend label)

**Changes:**
- Title: `"Mission Control | OpenClaw"` → `"Mission Control | ReadnRate"`
- Sidebar footer: `"V5.1 Core System"` → `"ReadnRate · Mission Control"`
- Sidebar logo label stays `"Mission Control"` (product name, not brand)

### A3 — Bin reorganization

The `bin/` root has grown to 168+ files with no structure. Reorganize into:

```
bin/
├── archive/          ← numbered/dated one-off debug variants
├── dev/              ← schema exploration, test scripts, seed scripts
├── n8n/              ← n8n workflow JSON exports
└── (root)            ← production scripts only
```

**Move to `bin/archive/`** — duplicate/numbered debug variants:
- `check-events-2.js`, `check-events-again.js`, `check-events-heartbeat.js`, `check-events-only.js`, `check-events-quick.js`
- `check-heartbeat-2.js`, `check-heartbeat-310.js`, `check-heartbeat-final.js`, `check-heartbeat-task.js`, `check-heartbeat2.js`, `check-heartbeats-0314.js`, `check-heartbeats-3.js`
- `check-orch.js`, `check-orch2.js`, `check-orchestrator-2.js`, `check-orchestrator-920.js`, `check-orchestrator-again.js`, `check-orchestrator-fast.js`, `check-orchestrator-hb.js`, `check-orchestrator-now.js`, `check-orchestrator-only.js`, `check-orchestrator-task.js`
- `check-all.js`, `check-all-heartbeats.js`, `check-all-supa.js`
- `check-idea-comments-hb.js`, `check-idea-comments-heartbeat.js`
- `check-supa-all.js`, `check-supa-comments.js`, `check-supa-hb.js`, `check-supa-heartbeat.js`, `check-supa-heartbeats.js`
- `check-ev.js`, `check-heartbeat-2.js`, `check-heartbeats.js`
- `check_comments.js`, `check_intel.js`, `check_orchestrator.js`, `check_tables.js`, `check_tasks.js`, `check_tasks_desc.js`
- `delete-bad-intel2.js`, `delete_test.js`
- `update-db-task-021.js`, `update-orchestrator-event.js`, `update-task-status-fixed.js`
- `save-aura-intel-2.js`, `save-email-verification-intel.js`
- `check-orchestrator-events.js` (superseded by check-orchestrator-events-rest.js)

**Move to `bin/dev/`** — dev/schema/test scripts:
- `schema_check.js`, `schema_columns.js`, `schema_full.js`, `schema_full.sql`
- `get_count.js`, `get_data.js`
- `test-agentmail.py`, `test-email.py`, `test-exec-sql.js`, `test-pg.js`, `test-scraper.js`, `test_insert.js`, `test_schema.js`
- `list-tables.js`, `list_tables.js`
- `count_authors.js`
- `brute-force-envs.py`

**Move to `bin/n8n/`** — n8n workflow exports:
- `n8n-author-leads-workflow-clean.json`, `n8n-author-leads-workflow.json`
- `n8n-simple-workflow-pt2.json`, `n8n-simple-workflow-v2.json`, `n8n-simple-workflow.json`
- `n8n_mock.json`

**Production scripts remain in `bin/` root** (never move):
- `enrich-trym-leads.js`, `orchestrator-cron.js`, `orchestrator-cron.sh`
- `super-lead-gen.py`, `lead-gen-cron.sh`
- `check-orchestrator-events-rest.js` ← referenced by cron
- `beacon-watcher.js`, `beacon-watcher.sh`, `beacon-execute.sh`
- `orchestrator-watcher.js`, `email-watcher.js`, `heartbeat-check.js`, `heartbeat-checks.js`
- `author-daily-gen.js`, `author-daily-scheduler.js`
- `massive-lead-gen.js`, `generate-email-copy.js`, `run-outreach.sh`
- `mission-control-watchdog.sh`, `cleanup-stale-locks.sh`
- `send-morning-brief.sh`

---

## Plan B — UI Refonte

Full visual redesign of the Next.js Mission Control dashboard.

**Goals:**
- Replace white-on-white main content area with a cohesive dark-slate theme
- Upgrade sidebar: cleaner logo block, ReadnRate wordmark, improved nav groups
- Dashboard: tighter stat cards, better activity feed, agent cards on dark bg
- Global: consistent color language (cyan accent, slate palette)

**Files:**
- `mission-control-next/src/app/layout.tsx` — body background to `bg-slate-900`
- `mission-control-next/src/components/Sidebar.tsx` — new logo, footer, active states
- `mission-control-next/src/app/page.tsx` — full redesign of dashboard

**Color palette:**
- Background: `slate-900` / `slate-950`
- Surface cards: `slate-800` / `slate-800/50`
- Accent: `cyan-400` / `cyan-500`
- Text primary: `white` / `slate-100`
- Text muted: `slate-400` / `slate-500`
- Borders: `slate-700` / `slate-800`

---

## Plan C — Scripts cleanup

Clean up `mission-control-next/scripts/` — contains only dev/diagnostic TypeScript files that were committed by accident.

**Action:** Move to `bin/dev/` and remove the `scripts/` directory.

**Files:**
- `mission-control-next/scripts/check_tables.ts`
- `mission-control-next/scripts/seed_digg_posts.ts`
- `mission-control-next/scripts/test_rpc.ts`

---

## Addendum — enrich-trym-leads.js `--loop` flag

Add `--loop` flag that keeps running batches until no un-enriched leads remain, pausing 5 seconds between rounds.

```
node bin/enrich-trym-leads.js --loop
node bin/enrich-trym-leads.js 100 --loop
```
