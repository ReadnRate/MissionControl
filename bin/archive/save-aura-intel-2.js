const { createClient } = require('@supabase/supabase-js');
const supabase = createClient("https://zexumnlvkrjryvzrlavp.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM");

async function run() {
  await supabase.from('intel').insert([{
    title: 'Aura Action Plan: Viral 500 Subs (Organic SPEED)', 
    category: 'marketing-strategy', 
    summary: 'Aura finalized the 3-step action plan for Read & Rate. Step 1: Reddit Anti-Promotion (ask for roasts to bypass bans). Step 2: BookTok "Judge a Book" viral challenge. Step 3: n8n Content Factory (auto-generate posts and push via LATER API 3x/day). Zero guarantees, zero freebies, zero Digg.', 
    importance: 'hot', 
    source: 'Aura/Subagent'
  }]);
  
  await supabase.from('tasks').update({ status: 'done' }).eq('id', '7deab214-3988-4a8b-9bbf-1d03bc01158c');
  
  console.log("Updated via API.");
}
run();
