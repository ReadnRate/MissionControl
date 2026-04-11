#!/bin/bash
# Check for new emails and report them

INBOX_FILE="/data/.openclaw/workspace/inbox/emails.jsonl"
PROCESSED_FILE="/data/.openclaw/workspace/inbox/.processed_ids"

# Create processed file if doesn't exist
touch "$PROCESSED_FILE"

# Check if inbox file exists and has content
if [ ! -f "$INBOX_FILE" ] || [ ! -s "$INBOX_FILE" ]; then
    exit 0  # No emails, silent exit
fi

# Read processed IDs
PROCESSED_IDS=$(cat "$PROCESSED_FILE")

# Check for new emails
NEW_EMAILS=0

while IFS= read -r line; do
    MESSAGE_ID=$(echo "$line" | jq -r '.message_id // empty')
    
    if [ -n "$MESSAGE_ID" ] && ! echo "$PROCESSED_IDS" | grep -q "$MESSAGE_ID"; then
        NEW_EMAILS=$((NEW_EMAILS + 1))
        
        # Extract email details
        FROM=$(echo "$line" | jq -r '.from_ // "unknown"')
        SUBJECT=$(echo "$line" | jq -r '.subject // "No subject"')
        PREVIEW=$(echo "$line" | jq -r '.preview // ""' | head -c 200)
        
        echo "📧 New email received:"
        echo "   From: $FROM"
        echo "   Subject: $SUBJECT"
        echo "   Preview: $PREVIEW"
        echo ""
        
        # Mark as processed
        echo "$MESSAGE_ID" >> "$PROCESSED_FILE"
    fi
done < "$INBOX_FILE"

if [ $NEW_EMAILS -gt 0 ]; then
    echo "Total new emails: $NEW_EMAILS"
    echo "Run: /data/.openclaw/workspace/bin/agentmail-helper.py check"
fi
