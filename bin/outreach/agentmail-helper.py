#!/usr/bin/env python3
"""
AgentMail Helper - Quick email operations for Joe
Usage:
  ./agentmail-helper.py list             # List inboxes
  ./agentmail-helper.py check            # Check inbox for new messages
  ./agentmail-helper.py send TO SUBJECT  # Send email (body from stdin)
"""

import os
import sys
from agentmail import AgentMail

INBOX = "joebot@agentmail.to"

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    client = AgentMail(api_key=os.getenv("AGENTMAIL_API_KEY"))
    action = sys.argv[1]
    
    if action == "list":
        inboxes = client.inboxes.list(limit=10)
        for inbox in inboxes.inboxes:
            print(f"{inbox.inbox_id} - {inbox.display_name or 'no name'}")
    
    elif action == "check":
        messages = client.inboxes.messages.list(inbox_id=INBOX, limit=10)
        print(f"Found {len(messages.messages)} message(s) in {INBOX}:")
        for msg in messages.messages:
            from_email = msg.from_ if msg.from_ else "unknown"
            print(f"  [{msg.created_at}] From: {from_email}")
            print(f"    Subject: {msg.subject}")
            print(f"    Preview: {msg.preview[:100]}..." if len(msg.preview) > 100 else f"    Preview: {msg.preview}")
    
    elif action == "send":
        if len(sys.argv) < 4:
            print("Usage: agentmail-helper.py send TO SUBJECT")
            sys.exit(1)
        
        to = sys.argv[2]
        subject = sys.argv[3]
        body = sys.stdin.read() if not sys.stdin.isatty() else ""
        
        if not body:
            print("Error: No body provided (pipe text via stdin)")
            sys.exit(1)
        
        result = client.inboxes.messages.send(
            inbox_id=INBOX,
            to=to,
            subject=subject,
            text=body
        )
        print(f"✅ Email sent! Message ID: {result.message_id}")
    
    else:
        print(f"Unknown action: {action}")
        print(__doc__)
        sys.exit(1)

if __name__ == "__main__":
    main()
