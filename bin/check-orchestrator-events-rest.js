const { createClient } = require('@supabase/supabase-js');
const supabase = createClient("https://zexumnlvkrjryvzrlavp.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM");

async function run() {
  const { data, error } = await supabase.from('orchestrator_events').select('*').eq('status', 'pending');
  if (data && data.length > 0) {
    console.log("EVENTS FOUND:");
    console.log(JSON.stringify(data, null, 2));
    
    // Mark as processing
    for (const row of data) {
      await supabase.from('orchestrator_events').update({ status: 'processing' }).eq('id', row.id);
    }
  } else {
    console.log("NO_EVENTS");
  }
}
run();
