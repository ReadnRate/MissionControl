const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('ideas').select('*').limit(1);
  console.log("Ideas:", data ? 'Exists' : error);
  
  const { data: d2, error: e2 } = await supabase.from('tasks').select('*').limit(1);
  console.log("Tasks:", d2 ? 'Exists' : e2);
  
  // Is there any schema query?
  const { data: tbls, error: e3 } = await supabase.rpc('get_tables');
  console.log("get_tables:", tbls ? tbls : e3);
}
test();
