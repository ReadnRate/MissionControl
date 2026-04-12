const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  "https://zexumnlvkrjryvzrlavp.supabase.co", 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM"
);

async function run() {
  const { data: events, error: errEvents } = await supabase
    .from('orchestrator_events')
    .select('*')
    .eq('status', 'pending')
    .eq('event_type', 'task_activation');
  
  const { data: comments, error: errComments } = await supabase
    .from('idea_comments')
    .select('*')
    .or('content.ilike.%@Beacon%,content.ilike.%@Forge%')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log(JSON.stringify({
    events: events || [],
    comments: comments || [],
    errors: { events: errEvents, comments: errComments }
  }, null, 2));
}
run();
