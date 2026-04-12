const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient("https://zexumnlvkrjryvzrlavp.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM");

async function run() {
  const links = [
    "https://publisherrocket.com/?aff=39"
  ];
  
  const { data, error } = await supabase
    .from('intel')
    .update({ source: JSON.stringify(links) })
    .eq('id', '11943dc4-9d3b-4b24-8513-c568d6a99edc');
    
  if (error) console.error("Error:", error);
  else console.log("Success updated intel.");
}
run();
