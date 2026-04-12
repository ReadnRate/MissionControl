const { createClient } = require('@supabase/supabase-js');
const supabase = createClient("https://zexumnlvkrjryvzrlavp.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM");
async function run() {
  let { data, error } = await supabase.from('task_comments').select('*').limit(1);
  console.log("task_comments:", error ? error.message : "Exists");
  
  ({ data, error } = await supabase.from('idea_comments').select('*').limit(1));
  console.log("idea_comments:", error ? error.message : "Exists");

  ({ data, error } = await supabase.from('intel').select('*').limit(1));
  console.log("intel:", error ? error.message : "Exists");
  
  ({ data, error } = await supabase.from('leads').select('*').limit(1));
  console.log("leads:", error ? error.message : "Exists");
  
  ({ data, error } = await supabase.from('authors').select('*').limit(1));
  console.log("authors:", error ? error.message : "Exists");
}
run();
