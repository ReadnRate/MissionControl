const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
async function run() {
  const { data, error } = await supabase.from('leads').select().limit(1);
  console.log('leads:', error || data);
  const { data: d2, error: e2 } = await supabase.from('authors').select().limit(1);
  console.log('authors:', e2 || d2);
}
run();
