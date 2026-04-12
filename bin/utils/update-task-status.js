const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: '/data/.openclaw/workspace/mission-control-next/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status: 'done' })
    .eq('id', 'e7a97d96-2bae-4082-96a4-06870082ba99');

  if (error) {
    console.error("Error updating task:", error);
  } else {
    console.log("Task 'Agent Command Center' marked as done!");
  }
}

run();
