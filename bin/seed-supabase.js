const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.rpc('exec_sql', { query: `
    CREATE TABLE IF NOT EXISTS public.tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT, status TEXT
    );
  `});
  console.log(error || data || "RPC Exec_sql might not exist");
}
run();
