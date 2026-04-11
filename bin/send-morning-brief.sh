#!/bin/bash
# Morning Brief Email - Sends daily at 9 AM EST
# Updated 2026-03-11: Replaced static copy-paste with an OpenClaw Agent Trigger

WORKSPACE="/data/.openclaw/workspace"
BRIEF_FILE="$WORKSPACE/.last_brief_sent"
TODAY=$(date +%Y-%m-%d)
RECIPIENT="manu@readnrate.com"

# Check if already sent today
if [ -f "$BRIEF_FILE" ]; then
    LAST_SENT=$(cat "$BRIEF_FILE")
    if [ "$LAST_SENT" = "$TODAY" ]; then
        echo "✅ Morning brief already processed today."
        exit 0
    fi
fi

echo "Triggering Joe (Lead Orchestrator) to generate and send the Morning Brief..."

# Send a system prompt to the main agent (Joe) to do the real work
openclaw agent --agent main --message "🚨 [SYSTEM CROWN TRIGGER] It is 9:00 AM EST on $TODAY.
Please execute the Morning Brief Protocol exactly as defined in HEARTBEAT.md:
1. Search the web for the latest Amazon KDP news.
2. Search the web for Read & Rate, Trym, and GCA competitor updates.
3. Read TASKS.md for project status and blockers.
4. Synthesize a well-formatted, intelligent French/English brief.
5. Send it to $RECIPIENT using python3 $WORKSPACE/bin/agentmail-helper.py send \"$RECIPIENT\" \"Daily Brief - $TODAY\" <<EOF
... body ...
EOF
You are authorized to execute this now. No need to reply to this prompt, just send the email."

# Mark as sent so the cron doesn't loop
echo "$TODAY" > "$BRIEF_FILE"
echo "✅ Morning brief trigger sent to Agent Joe."
