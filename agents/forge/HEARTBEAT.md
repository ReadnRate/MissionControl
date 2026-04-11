# HEARTBEAT.md - Forge 🛠️

## Mission Control Health Check (Daily)
- **Check**: Is `mission.oliverowl.com` up (200 OK)?
- **Action**: If down, run diagnosis (1033 error fix).
- **Tool**: `web_fetch` or `exec` curl.

## Task Monitoring
- **Check**: Look for "Status: 🔴 BLOCKED" or "Owner: Forge" in `/data/.openclaw/workspace/TASKS.md`.
- **Action**: Prioritize blocked items first.

## Self-Check
- **Code Quality**: Use `code-review` skill on ALL PRs.
- **Backups**: Ensure code is pushed to GitHub daily.
- **No Flask**: Verify no local servers are running. Everything SSA.