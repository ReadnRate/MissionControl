const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log("Trying to invoke exec_sql function...");
  const sql = `
  CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, role TEXT NOT NULL, model TEXT, status TEXT DEFAULT 'offline', capabilities TEXT[] DEFAULT '{}', last_active TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, description TEXT, project TEXT, priority TEXT DEFAULT 'medium', status TEXT DEFAULT 'backlog', assigned_to TEXT, source_idea_id UUID, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS public.decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), question TEXT NOT NULL, summary TEXT, consulted_agents TEXT[] DEFAULT '{}', date TIMESTAMPTZ DEFAULT NOW(), created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS public.digg_posts (
    id SERIAL PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL, url TEXT, channel_id TEXT, post_date TIMESTAMPTZ, status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT NOW()
  );
  INSERT INTO public.agents (name, role, status) VALUES ('JOE', 'Orchestrator', 'online'), ('FORGE', 'Developer', 'idle') ON CONFLICT DO NOTHING;
  `;
  
  // Try via postgres API if exposed
  const { data, error } = await supabase.rpc('exec_sql', { query: sql });
  console.log("RPC result:", error || "Success");
}
run();
