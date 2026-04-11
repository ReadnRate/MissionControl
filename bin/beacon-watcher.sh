#!/bin/bash
cd /data/.openclaw/workspace/bin
node -e '
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const supabase = createClient("https://zexumnlvkrjryvzrlavp.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM");

async function run() {
  const { data: comments } = await supabase.from("idea_comments").select("id, idea_id, content, author, ideas(title, details)").like("content", "%@Beacon%");
  if (!comments || comments.length === 0) return;
  
  const { data: sysComments } = await supabase.from("idea_comments").select("idea_id").eq("author", "Beacon (Agent)");
  const handled = new Set((sysComments || []).map(c => c.idea_id));
  
  for (const c of comments) {
    if (handled.has(c.idea_id)) continue;
    
    // Send message to openclaw heartbeat session or spawn beacon
    // Since I am Joe in a heartbeat, I can directly read this trigger and spawn beacon.
    console.log(`BEACON_TRIGGER: ${c.idea_id} | ${c.content}`);
    fs.writeFileSync("/data/.openclaw/workspace/inbox/beacon_trigger.json", JSON.stringify({
       type: "beacon_research", ideaId: c.idea_id, ideaTitle: c.ideas.title, prompt: c.content
    }));
    break;
  }
}
run();
'
