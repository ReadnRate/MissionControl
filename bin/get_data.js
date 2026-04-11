const fs = require('fs');
const env = fs.readFileSync('/data/.openclaw/workspace/.env', 'utf8');
const url = env.match(/SUPABASE_URL="(.*?)"/)[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY="(.*?)"/)[1];

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
