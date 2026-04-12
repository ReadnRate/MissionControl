require('dotenv').config({ path: '/data/.openclaw/workspace/.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: d1, error: e1 } = await supabase.from('leads').select('*').limit(1);
  console.log("leads data:", d1, "error:", e1);
  const { data: d2, error: e2 } = await supabase.from('author_leads').select('*').limit(1);
  console.log("author_leads data:", d2, "error:", e2);
}
check();
