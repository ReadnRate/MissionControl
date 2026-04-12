const fs = require('fs');

if (fs.existsSync('/data/.openclaw/workspace/inbox/emails.jsonl')) {
     const content = fs.readFileSync('/data/.openclaw/workspace/inbox/emails.jsonl', 'utf8');
     console.log("EMAILS:", content ? content : "None (empty file)");
} else {
     console.log("EMAILS: None (no file)");
}
