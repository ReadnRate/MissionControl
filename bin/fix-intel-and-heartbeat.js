const { createClient } = require('@supabase/supabase-js');
const supabase = createClient("https://zexumnlvkrjryvzrlavp.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM");

async function run() {
  // Delete the useless Trym card
  await supabase.from('intel').delete().eq('id', 'b8732db5-914a-425c-9c0f-d7f98c86f607');
  console.log("Deleted Trym WIP intel card.");

  // Delete any other cards that might just be WIP fluff if they exist
  const { data: allIntel } = await supabase.from('intel').select('*');
  if (allIntel) {
      for (const item of allIntel) {
          if (item.summary.includes("is currently") || item.summary.includes("working on")) {
             await supabase.from('intel').delete().eq('id', item.id);
             console.log("Deleted extra WIP fluff:", item.title);
          }
      }
  }

  // Heartbeat check
  console.log("--- idea_comments ---");
  const { data: comments, error: err1 } = await supabase.from('idea_comments').select('*').order('created_at', { ascending: false }).limit(5);
  if (err1) console.error(err1); else console.log(comments);
}
run();
