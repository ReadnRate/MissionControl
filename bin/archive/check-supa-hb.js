const { createClient } = require('@supabase/supabase-js');
const supabase = createClient("https://zexumnlvkrjryvzrlavp.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM");

async function run() {
  const { data: comments, error: err1 } = await supabase.from('idea_comments').select('*').order('created_at', { ascending: false }).limit(10);
  if (err1) console.error("Err1:", err1); 
  
  const { data: events, error: err2 } = await supabase.from('orchestrator_events').select('*').eq('status', 'pending').eq('event_type', 'task_activation');
  if (err2) console.error("Err2:", err2);

  console.log(JSON.stringify({
    comments: comments || [],
    events: events || []
  }));
}
run();
