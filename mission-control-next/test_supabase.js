const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "Exists" : "Missing");
console.log("KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Exists" : "Missing");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase.from('agents').select('*').limit(1);
  if (error) {
    console.error("ERROR:", error);
  } else {
    console.log("SUCCESS. Data:", data);
  }
}
test();
