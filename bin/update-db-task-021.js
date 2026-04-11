const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/data/.openclaw/workspace/mission-control-next/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('tasks')
    .insert([{
      title: "Read & Rate - Re-engagement Email Sequence",
      description: "Draft a consecutive email sequence aimed at current customers to bring them back to the platform.",
      project: "Read & Rate",
      priority: "high",
      status: "done",
      assigned_to: "AURA"
    }]);

  if (error) {
    console.error("Error inserting task:", error);
  } else {
    console.log("Task 'Read & Rate - Re-engagement Email Sequence' inserted as done!");
  }
}

run();
