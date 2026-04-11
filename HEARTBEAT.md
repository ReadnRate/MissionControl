---
summary: "Workspace template for HEARTBEAT.md"
read_when:
  - Bootstrapping a workspace manually
---

# HEARTBEAT.md

## Infrastructure Health

### 1. OpenClaw Lock Monitoring
- **Check**: Scan for stale session locks every heartbeat
- **Command**: `/data/.openclaw/workspace/bin/cleanup-stale-locks.sh`
- **Alert Threshold**: >0 locks found → investigate
- **Auto-Action**: Remove locks for dead PIDs (>1h old)

### 2. Morning Brief Email (9 AM EST Daily)
- **Check**: Send daily brief to Manuel at 9:00 AM EST
- **Recipient**: manu@readnrate.com
- **Script**: `/data/.openclaw/workspace/bin/send-morning-brief.sh`
- **Content**:
  - Amazon KDP news (search)
  - Read & Rate / Trym / GCA competitor updates (search)
  - Project status from TASKS.md
  - Calendar events for today (via GOG)
  - Critical tasks/blockers
- **Action**: Run only between 9:00-9:15 AM EST and not sent yet today

### 3. Email Inbox Monitoring → PM2 Watcher (email-watcher)
- **Process**: PM2 (`email-watcher.js`), polls AgentMail every 5 min
- **New emails**: Written to `inbox/emails.jsonl`, trigger flag set
- **Alert**: On next heartbeat, I process new emails and respond if needed
- **Cost**: $0 (plain HTTPS API call, no AI model)

### 4. Daily Drive Backup (Morning)
- **Check**: Backup workspace config files to Google Drive once per day
- **Schedule**: Morning (6-9 AM EST)
- **Command**: `/data/.openclaw/workspace/bin/backup-to-drive.sh`
- **Folder**: https://drive.google.com/drive/folders/1-9ir_IX1Jmb6JkqccyUCL8QG0_9WOOU6
- **Files**: MEMORY.md, SOUL.md, AGENTS.md, IDENTITY.md, USER.md, SECURITY.md, HEARTBEAT.md, TOOLS.md, TASKS.md, SKILLS_CHECKLIST.md, SKILL_PROCEDURES.md
- **Action**: Run script only if current time is 6-9 AM EST and backup not done today

### 5. Beacon Research Watcher (Agent Intercom)
- **Process**: PM2 (`beacon-watcher.js`) polling Supabase every 5 min
- **Trigger**: Writes to `inbox/beacon_trigger.json`
- **Action**: On next heartbeat, I spawn Beacon subagent if triggered

### 6. Orchestrator Event Watcher → PM2 Watcher (orchestrator-watcher)
- **Process**: PM2 (`orchestrator-watcher.js`), polls Supabase every 5 min
- **Pending events**: Written to `inbox/events.txt`, trigger flag set
- **Alert**: On next heartbeat, I process pending tasks via sessions_spawn
- **Cost**: $0 (plain Supabase query, no AI model)

### 7. Daily OpenClaw Update Check
- **Check**: Compare current OpenClaw version with npm latest.
- **Schedule**: Once a day.
- **Action**: Run `npm info openclaw version` and compare with `openclaw --version`. If an update is available, notify Manuel.

### 8. Mission Control Watchdog
- **Check**: Ensure PM2 is running mission-backend and mission-tunnel
- **Command**: `/data/.openclaw/workspace/bin/mission-control-watchdog.sh`
- **Action**: If missing, automatically runs `pm2 resurrect` to bring the UI back online.
-e 
### 9. Daily Author Lead Scraping (Super Data)
- **Check**: Fetch new author leads daily for Read & Rate.
- **Schedule**: Morning (8-9 AM EST).
- **Action**: Run only between 8:00-9:00 AM EST and not sent yet today. Spawn Super Data to scrape and insert new KDP/indie author leads into the database.
