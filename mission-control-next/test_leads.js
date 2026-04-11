const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkLeads() {
  const { data, error } = await supabase
    .from('author_leads')
    .select('*')
    .limit(10);
  if (error) {
    console.log("Error querying author_leads:", error.message);
  } else {
    console.log("author_leads:", data.length, "rows");
    console.log(data);
  }
}
checkLeads();
