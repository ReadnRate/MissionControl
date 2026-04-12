const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient("https://zexumnlvkrjryvzrlavp.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM");

async function run() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: comments, error } = await supabase
    .from('idea_comments')
    .select('*')
    .gte('created_at', yesterday)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }
  
  const mentions = comments.filter(c => c.content.includes('@Beacon') || c.content.includes('@Forge'));
  console.log(JSON.stringify(mentions));
}
run();
