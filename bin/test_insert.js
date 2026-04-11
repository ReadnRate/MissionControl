const { createClient } = require('/data/.openclaw/workspace/mission-control-next/node_modules/@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('/data/.openclaw/workspace/.env', 'utf8');
const url = env.match(/SUPABASE_URL="(.*?)"/)[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY="(.*?)"/)[1];
const supabase = createClient(url, key);

async function run() {
  const dummyLead = {
    first_name: 'Test',
    last_name: 'Author',
    email: 'testauthor2@example.com',
    book_title: 'The Great Book',
    genre: 'Fiction',
    website_url: 'https://example.com/test',
    status: 'new'
  };
  
  const { data, error } = await supabase.from('author_leads').upsert(dummyLead, { onConflict: 'email' }).select();
  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log('Inserted successfully:', data);
  }
}
run();
