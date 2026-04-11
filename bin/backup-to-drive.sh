#!/bin/bash
# Daily morning backup to Google Drive
# Folder: https://drive.google.com/drive/folders/1-9ir_IX1Jmb6JkqccyUCL8QG0_9WOOU6

FOLDER_ID="1-9ir_IX1Jmb6JkqccyUCL8QG0_9WOOU6"
WORKSPACE="/data/.openclaw/workspace"
LAST_BACKUP_FILE="$WORKSPACE/.last_drive_backup"

# Set env vars for GOG
export GOG_KEYRING_PASSWORD=$(cat $WORKSPACE/credentials/.gog_keyring_password)
export GOG_ACCOUNT=manu.denault@gmail.com

# Check if already backed up today
TODAY=$(date +%Y-%m-%d)
if [ -f "$LAST_BACKUP_FILE" ]; then
    LAST_BACKUP=$(cat "$LAST_BACKUP_FILE")
    if [ "$LAST_BACKUP" = "$TODAY" ]; then
        exit 0  # Already backed up today, silent exit
    fi
fi

# Files to backup
FILES=(
    "MEMORY.md"
    "SOUL.md"
    "AGENTS.md"
    "IDENTITY.md"
    "USER.md"
    "SECURITY.md"
    "HEARTBEAT.md"
    "TOOLS.md"
    "TASKS.md"
    "SKILLS_CHECKLIST.md"
    "SKILL_PROCEDURES.md"
    "team/JOE.md"
    "team/FORGE.md"
    "team/AURA.md"
    "team/BEACON.md"
)

echo "📦 Starting daily Drive backup..."

for file in "${FILES[@]}"; do
    if [ -f "$WORKSPACE/$file" ]; then
        # Upload/update file in Drive folder
        gog drive upload "$WORKSPACE/$file" --parent "$FOLDER_ID" --name "$file" 2>&1 | grep -q "uploaded\|updated" && \
            echo "  ✅ $file" || echo "  ⚠️ $file (may already exist)"
    fi
done

# Mark backup as done
echo "$TODAY" > "$LAST_BACKUP_FILE"
echo "✅ Drive backup completed for $TODAY"
