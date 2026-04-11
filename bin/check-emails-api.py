#!/usr/bin/env python3
import os
import sys
from agentmail import AgentMail
import json

INBOX = "joebot@agentmail.to"
STATE_FILE = "/data/.openclaw/workspace/inbox/.last_email_id"

def get_last_processed():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, 'r') as f:
            return f.read().strip()
    return None

def set_last_processed(msg_id):
    with open(STATE_FILE, 'w') as f:
        f.write(msg_id)

def main():
    client = AgentMail(api_key=os.getenv("AGENTMAIL_API_KEY"))
    messages = client.inboxes.messages.list(inbox_id=INBOX, limit=10)
    
    last_id = get_last_processed()
    new_messages = []
    
    for msg in messages.messages:
        # The attribute in AgentMail is typically message_id
        if msg.message_id == last_id:
            break 
        
        try:
            full_msg = client.inboxes.messages.get(inbox_id=INBOX, message_id=msg.message_id)
            new_messages.append({
                "id": full_msg.message_id,
                "from": full_msg.from_,
                "subject": full_msg.subject,
                "body": full_msg.text if hasattr(full_msg, 'text') and full_msg.text else full_msg.html if hasattr(full_msg, 'html') and full_msg.html else full_msg.preview
            })
        except Exception as e:
            # Fallback
            new_messages.append({
                "id": msg.message_id,
                "from": msg.from_,
                "subject": msg.subject,
                "body": msg.preview
            })
            
    if new_messages:
        # We process from oldest to newest of the new batch
        new_messages.reverse()
        for m in new_messages:
            print(json.dumps(m))
        
        # Save the newest id as last processed
        set_last_processed(new_messages[-1]['id'])
    else:
        print("NO_NEW_EMAILS")

if __name__ == "__main__":
    main()
