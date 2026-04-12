const { Client } = require('pg');
const DBPASS = "MissionControl2026!";
const connectionString = `postgresql://postgres.zexumnlvkrjryvzrlavp:${DBPASS}@aws-0-us-west-2.pooler.supabase.com:6543/postgres`;
const client = new Client({ connectionString });

async function run() {
  await client.connect();
  
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.idea_comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      author TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER PUBLICATION supabase_realtime ADD TABLE public.idea_comments;
  `);
  
  console.log("Comments table created.");
  await client.end();
}
run();
