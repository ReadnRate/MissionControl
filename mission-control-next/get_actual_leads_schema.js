const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://zexumnlvkrjryvzrlavp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM'
);
async function run() {
  const { data, error } = await supabase.from('leads').select('*').limit(1);
  if (error) {
    console.error("Error fetching leads:", error);
    return;
  }
  if (data.length > 0) {
    console.log(Object.keys(data[0]));
  } else {
    console.log("No rows found. Let's try to get column names from schema.");
  }
}
run();
