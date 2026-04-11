const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/data/.openclaw/workspace/mission-control-next/.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
async function test() {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql_string: 'ALTER TABLE intel ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'draft\';'
  });
  console.log(data, error);
}
test();
