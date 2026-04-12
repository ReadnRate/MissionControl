const { createClient } = require('@supabase/supabase-js');
const supabase = createClient("https://zexumnlvkrjryvzrlavp.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM");

async function run() {
  const { data: events, error: err1 } = await supabase.from('orchestrator_events').select('*').eq('status', 'pending').eq('event_type', 'task_activation');
  if (err1) console.error("Err events:", err1);
  
  const { data: comments, error: err2 } = await supabase.from('idea_comments').select('*').order('created_at', { ascending: false }).limit(5);
  if (err2) console.error("Err comments:", err2);

  console.log(JSON.stringify({ events, comments }));
}
run();
