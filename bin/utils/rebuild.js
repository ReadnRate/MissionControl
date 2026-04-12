const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const sql = fs.readFileSync('/data/.openclaw/workspace/mission-control-v4/schema.sql', 'utf8');
  console.log("Attempting to run RPC exec_sql...");
  const { data, error } = await supabase.rpc('exec_sql', { query: sql });
  
  if (error) {
    console.error("RPC exec_sql failed (likely not installed). We need direct Postgres access.");
    console.error(error);
  } else {
    console.log("Success via RPC.");
  }
}
run();
