const { Client } = require('pg');
const { exec } = require('child_process');

const DBPASS = process.env.SUPABASE_DB_PASSWORD || "MissionControl2026!";
const connectionString = `postgresql://postgres.zexumnlvkrjryvzrlavp:${DBPASS}@aws-0-us-west-2.pooler.supabase.com:6543/postgres`;
const client = new Client({ connectionString });

async function run() {
  await client.connect();

  // 1. Check for Pending Tasks Activations
  const tasksRes = await client.query("SELECT * FROM orchestrator_events WHERE status = 'pending' AND event_type = 'task_activation' ORDER BY created_at ASC");
  for (let event of tasksRes.rows) {
    console.log(`[Task Activator] Triggering task ${event.payload.task_id} for agent ${event.payload.assigned_to}...`);
    // Here we'd normally call the OpenClaw API to wake the agent.
    // For now we'll mark it processing so we don't loop forever.
    await client.query("UPDATE orchestrator_events SET status = 'processed' WHERE id = $1", [event.id]);
    
    // Simulate Joe sending a message to the user/log to acknowledge execution.
    // Real implementation would do: exec(`openclaw sessions_spawn ...`)
  }

  // 2. Check for @Agent Mentions in Idea Comments
  const commentsRes = await client.query(`
    SELECT * FROM idea_comments 
    WHERE author = 'Manuel' 
    AND (content LIKE '%@Beacon%' OR content LIKE '%@Forge%' OR content LIKE '%@Aura%')
    AND created_at > NOW() - INTERVAL '5 minutes'
  `);
  
  // To avoid spamming, we need a way to track if we already replied to a comment.
  // For now, if we found one, we just log it. (In production, we add a "processed" boolean to idea_comments).
  if (commentsRes.rows.length > 0) {
     console.log(`[Idea Watcher] Found ${commentsRes.rows.length} agent mentions. Calling Orchestrator logic...`);
  }

  await client.end();
}

run().catch(console.error);
