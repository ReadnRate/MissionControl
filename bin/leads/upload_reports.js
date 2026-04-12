const { createClient } = require('@supabase/supabase-js');
const supabase = createClient("https://zexumnlvkrjryvzrlavp.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM");

async function run() {
  // 1. Insert Emails to Intel
  const { data: i1, error: e1 } = await supabase.from('intel').insert([{
    title: "Cold Email List - Authors Batch 1",
    category: "Leads",
    summary: "Extraction réussie d'auteurs indépendants pour la campagne Read & Rate.\n\nContacts vérifiés:\n- Indie Author Consulting: IndieAuthorConsulting@peoplepc.com\n- Anne Janzer: anne@annejanzer.com\n- Sam (The Empowered Author): sam@theempoweredauthor.com\n\nPrêts pour l'intégration dans l'outil d'outreach.",
    importance: "high",
    source: "Super Data Scraper",
    date: new Date().toISOString().split('T')[0]
  }]);
  if(e1) console.error("Error inserting intel 1:", e1);

  // 2. Insert Viral Campaign Report to Intel
  const { data: i2, error: e2 } = await supabase.from('intel').insert([{
    title: "Rapport: Viral Campaign Setup (N8N)",
    category: "Strategy",
    summary: "Audit des workflows N8N complété par Aura.\n\nSur 61 workflows, 7 sont clés et actifs pour la campagne virale:\n- Blog Writer Agent\n- Blog Data Collector\n- Read & Rate - Auto Blog Generator\n- Create Blog Post - ReadNRate\n- RNR_UGC_VIDEOS & RNR_UGC_VIDEOS_QUEUE\n- Add Author Lead to Supabase\n- Tool - Firecrawl\n\nProchaine étape: Connexion avec LATE API pour automatiser BookTok et les garanties 'No Reviews'.",
    importance: "high",
    source: "Aura N8N Audit",
    date: new Date().toISOString().split('T')[0]
  }]);
  if(e2) console.error("Error inserting intel 2:", e2);

  // 3. Mark events as completed
  const { error: e3 } = await supabase.from('orchestrator_events')
    .update({ status: 'completed' })
    .in('id', [
      '0064c170-a484-4302-b765-beb62dee9bdc', 
      '99846384-42cd-4e81-a937-ce271252071f'
    ]);
  if(e3) console.error("Error updating events:", e3);

  // 4. Update task description
  const { error: e4 } = await supabase.from('tasks')
    .update({ status: 'in_progress' })
    .in('id', [
      '7deab214-3988-4a8b-9bbf-1d03bc01158c',
      'de53c841-6aad-48cb-8187-8ef5e8c52aea'
    ]);

  console.log("Done uploading reports to Supabase Mission Control.");
}
run();
