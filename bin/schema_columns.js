const fs = require('fs');
const env = fs.readFileSync('/data/.openclaw/workspace/.env', 'utf8');
const url = env.match(/SUPABASE_URL="(.*?)"/)[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY="(.*?)"/)[1];

async function run() {
  const res = await fetch(`${url}/rest/v1/?apikey=${key}`);
  const text = await res.json();
  console.log(text.definitions.author_leads.required);
}
run();
