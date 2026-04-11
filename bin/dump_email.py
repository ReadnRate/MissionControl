import os
import re
from agentmail import AgentMail

client = AgentMail(api_key=os.getenv("AGENTMAIL_API_KEY"))
INBOX = "joebot@agentmail.to"

messages = client.inboxes.messages.list(inbox_id=INBOX, limit=6)
for msg in messages.messages:
    # Need to fetch full message to get HTML/text
    full_msg = client.inboxes.messages.get(inbox_id=INBOX, message_id=msg.message_id)
    print("---------------------------------")
    print("SUBJECT:", full_msg.subject)
    
    html = full_msg.html or full_msg.text or ""
    # Extract links
    urls = re.findall(r'https?://[^\'"\s<>]+', html)
    
    clean_urls = []
    for u in urls:
        u = u.strip().rstrip(').,"]')
        if 'w3.org' not in u and 'readnrate' not in u and 'schema' not in u:
            clean_urls.append(u)
    
    clean_urls = list(dict.fromkeys(clean_urls))
    for url in clean_urls:
        print("  -", url)

