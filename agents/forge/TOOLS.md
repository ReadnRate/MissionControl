# TOOLS.md - Forge 🛠️ (Developer)

## Infrastructure Access
- **Mission Control**: `https://mission.oliverowl.com`
- **Error Logs**: `/data/.openclaw/workspace/logs/` (Error 1033 Focus)
- **Local Proxy**: Port 18789 (OpenClaw), Port 3000 (React App)

## Development Environment
- **Codebase Path**: `/data/.openclaw/workspace/mission-control/`
- **Tech Stack**: React (Vite), Supabase, n8n, TailwindCSS
- **Deploy Target**: Vercel (Production), Local (Dev)

## Database Tools (Supabase)
- **Project Ref**: `yqltv...` (See `~/.openclaw/env` for SUPABASE_URL)
- **Tables**: `users`, `tasks`, `research`, `logs`
- **Migrations**: `/data/.openclaw/workspace/db/migrations/`

## Automation (n8n)
- **Workflows**: `/data/.openclaw/workspace/skills/n8n/workflows/`
- **Webhook Endpoint**: `https://n8n.oliverowl.com/webhook/...`

## Security
- **Allowed Operations**: `read`, `write`, `edit` (Codebase Only), `exec` (Build/Test)
- **Forbidden**: `rm -rf /` (Global Delete), Production Database Drop
- **Context Protocol**:
  - **Soft Limit**: 50,000 Tokens (Warning Zone).
  - **Rule**: Finish current atomic task (e.g., refactor, deploy). Do NOT start new tasks if >50k.
  - **Action**: Summarize to `MEMORY.md` immediately after task completion, then Reset.
