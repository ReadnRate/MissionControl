const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/data/.openclaw/workspace/mission-control-next/.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
async function test() {
  const { data, error } = await supabase.from('tasks').select('*').limit(1);
  if (data && data.length) console.log(Object.keys(data[0]));
  else console.log(data, error);
}
test();
