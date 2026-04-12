const { Client } = require('pg');
const DBPASS = "MissionControl2026!";
const connectionString = `postgresql://postgres.zexumnlvkrjryvzrlavp:${DBPASS}@aws-0-us-west-2.pooler.supabase.com:6543/postgres`;
const client = new Client({ connectionString });

async function run() {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.orchestrator_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type TEXT NOT NULL,
      payload JSONB NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orchestrator_events;
  `);
  console.log("Table created.");
  await client.end();
}
run();
