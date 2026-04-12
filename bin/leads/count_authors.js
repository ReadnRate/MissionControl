require('dotenv').config({ path: '/data/.openclaw/workspace/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // Try to find the table that might hold author data.
  // Common names: 'authors', 'leads', 'intel', 'contacts'
  const tablesToCheck = ['authors', 'leads', 'intel', 'contacts', 'author_leads'];
  
  for (const table of tablesToCheck) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
      
    if (!error) {
      console.log(`Table '${table}' exists and has ${count} records.`);
    } else {
      // console.log(`Table '${table}' error or doesn't exist: ${error.message}`);
    }
  }
}

main();
