require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  const r1 = await fetch(`${url}/rest/v1/author_leads?select=*&limit=5`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  console.log("author_leads:", await r1.json());

  const r2 = await fetch(`${url}/rest/v1/intel?select=type,source,title&limit=15`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  console.log("intel:", await r2.json());
}
run();
