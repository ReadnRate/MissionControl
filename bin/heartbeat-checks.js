const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient("https://zexumnlvkrjryvzrlavp.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM");

async function run() {
  let actions = [];

  // Check orchestrator_events
  const { data: events, error: err1 } = await supabase.from('orchestrator_events').select('*').eq('status', 'pending').eq('event_type', 'task_activation');
  if (events && events.length > 0) actions.push({ type: 'events', data: events });

  // Check idea_comments
  const { data: comments, error: err2 } = await supabase.from('idea_comments').select('*').order('created_at', { ascending: false }).limit(5);
  if (comments && comments.length > 0) {
     const mentions = comments.filter(c => c.content && (c.content.includes('@Beacon') || c.content.includes('@Forge')) && !c.content.includes('Joe/Beacon'));
     if (mentions.length > 0) actions.push({ type: 'comments', data: mentions });
  }

  // Check emails
  const emailFile = '/data/.openclaw/workspace/inbox/emails.jsonl';
  if (fs.existsSync(emailFile)) {
     const stat = fs.statSync(emailFile);
     if (stat.size > 0) actions.push({ type: 'emails', path: emailFile });
  }

  console.log(JSON.stringify(actions, null, 2));
}
run();
