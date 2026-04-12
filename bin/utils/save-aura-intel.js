const { createClient } = require('@supabase/supabase-js');
const supabase = createClient("https://zexumnlvkrjryvzrlavp.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM");

async function run() {
  await supabase.from('intel').insert([{
    title: 'Trym White-label Strategic Audit', 
    category: 'marketing-strategy', 
    summary: 'Aura is currently auditing the trym.app pricing and business plans. The focus is specifically on optimizing the white-label offering for a low-budget, high-impact cold email campaign using our 5 warmed-up domains.', 
    importance: 'high', 
    source: 'https://trym.app/pricing'
  }]);
  
  await supabase.from('tasks').update({ status: 'done' }).eq('id', '7aa52f90-8405-42b8-8203-7befbb51462d');
  
  console.log("Updated via API.");
}
run();
