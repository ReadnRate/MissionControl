const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/data/.openclaw/workspace/mission-control-next/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status: 'in_progress' })
    .eq('title', 'Read & Rate - Re-engagement Email Sequence');

  if (error) {
    console.error("Error reverting task:", error);
  } else {
    console.log("Task reverted to in_progress!");
  }
}

run();
