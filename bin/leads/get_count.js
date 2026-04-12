require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  // Check tables
  const openapi = await fetch(`${url}/rest/v1/?apikey=${key}`);
  const schema = await openapi.json();
  const tables = Object.keys(schema.paths).map(p => p.replace('/',''));
  
  console.log("Tables:", tables.filter(t => !t.includes('rpc')));
  
  for (const table of ['intel', 'authors', 'leads', 'author_leads', 'contacts']) {
    if (tables.includes(table)) {
      const res = await fetch(`${url}/rest/v1/${table}?select=*`, {
        method: 'HEAD',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Prefer': 'count=exact'
        }
      });
      console.log(`Table ${table} count:`, res.headers.get('content-range'));
    }
  }
}
run();
