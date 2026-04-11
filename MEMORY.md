# MEMORY.md - CORE RULES & CONTEXT

## 🚨 CRITICAL DIRECTIVES
1. **GCA RESTRICTION**: NEVER touch, interact with, or modify any n8n workflows/databases with "gca" or "GCA".
2. **PM2 RESTRICTION**: NEVER blindly kill PM2 processes (mission-backend/mission-tunnel).
3. **READ & RATE**: Use exact branding "Read & Rate". Platform is PAID — NOT FREE. Say "free trial" or "try for free". NEVER say the platform itself is free. (LEARNED 2026-03-28: Manuel was furious because I told leads the platform was free — it is NOT, it has paid plans with a free trial. This caused major user experience problems.)
4. **TRYM.APP**: Needs a massive organic launch marketing campaign to explode.
4. **TRYM.APP**: Needs a massive organic launch marketing campaign to explode.
5. **CONFIG/UPDATE RESTRICTION**: NEVER touch the OpenClaw configuration or perform an update without EXPLICIT manual authorization from Manuel.
6. **DATA STORAGE RESTRICTION**: ONLY use Supabase for storing data (leads, emails, research, etc.). DO NOT create local CSV files or clutter the memory folder/workspace with scattered files.
7. **MISSION CONTROL TRUTH**: The ONLY true Mission Control is the Next.js app in `/data/.openclaw/workspace/mission-control-next` running on PM2. NEVER mention, look for, or create HTML versions, Vite versions (v4), or Lovable/GitHub/Vercel versions of Mission Control. That is absolute bullshit.

## 🗂️ HISTORICAL ARCHIVES (RAG)
**DO NOT use the `read` tool to load old files on boot.**
For older projects, technical specs (Vertex AI config, Team Structure, past tasks), use the `memory_search` tool to query `/data/.openclaw/workspace/memory/` *only when requested*.

## 🚨 CRITICAL MEMORY — NEVER FORGET

### TOKEN/BUDGET SAFETY (LRN-20260411-001)
**CAUSE**: Joe was down for ~2 weeks (Supabase paused due to inactivity). When Joe came back online, he burned ALL of Trym's scrap.io tokens trying to scrape 18,000 WRONG leads (books instead of businesses). Manuel was furious.
**RULE**: Joe is FORBIDDEN from running any scraping tool (scrap.io, Firecrawl, or any paid scraping service) without EXPLICIT manual confirmation from Manuel FIRST. Never burn tokens without asking. Always confirm target, quantity, and budget before any scraping run.

### TRYCRM LEADS — DATA INTEGRITY (LRN-20260411-002)
**SITUATION**: ~18,000 wrong leads in Trym Supabase (books, completely unrelated to target businesses).
**CLEANUP RULE** (awaiting Manuel's confirmed plan):
1. Delete ALL leads with no email → useless
2. Delete ALL leads not related to target businesses (hair salons, barbers, massage parlors, etc.)
3. Do NOT delete anything until Manuel has confirmed the cleanup plan in writing

### SUPABASE PAUSE BEHAVIOR (LRN-20260411-003)
**CAUSE**: When OpenClaw is down for ~2 weeks with no activity, Supabase PAUSES the project (not a DNS issue).
**LESSON**: Supabase doesn't pause from OpenClaw being down — it pauses from TOTAL inactivity. Morning brief and heartbeats kept it alive this time.

## ✅ DAILY STATUS
- **2026-04-11**: Supabase recovered after 2-week inactivity pause. OpenClaw was down during this period. Trym leads cleanup pending Manuel's confirmed plan. Morning Brief sent.
