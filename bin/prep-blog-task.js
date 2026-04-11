const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient("https://zexumnlvkrjryvzrlavp.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM");

async function run() {
  const { error } = await supabase.from('orchestrator_events').insert({
    event_type: 'task_activation',
    status: 'pending',
    payload: {
      task_id: 'TASK-016',
      agent: 'Aura',
      context: 'Create a blog post strategy based on the recent A10 algorithm intel.'
    }
  });
  if (error) console.error("Error:", error);
  else console.log("Task activation event created.");
}
// run(); // Not running it yet, just saving the script for later use if needed.
