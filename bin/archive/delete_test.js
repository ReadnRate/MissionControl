const { createClient } = require('/data/.openclaw/workspace/mission-control-next/node_modules/@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('/data/.openclaw/workspace/.env', 'utf8');
const url = env.match(/SUPABASE_URL="(.*?)"/)[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY="(.*?)"/)[1];
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from('author_leads').delete().eq('email', 'testauthor2@example.com');
  console.log('Deleted:', error || 'Success');
}
run();
