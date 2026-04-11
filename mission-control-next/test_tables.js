import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const [intel, tasks, ideas] = await Promise.all([
    supabase.from('intel').select('*').order('created_at', { ascending: false }).limit(2),
    supabase.from('tasks').select('*').order('created_at', { ascending: false }).limit(2),
    supabase.from('ideas').select('*').order('created_at', { ascending: false }).limit(2),
  ]);
  console.log("intel:", intel.data?.[0]);
  console.log("tasks:", tasks.data?.[0]);
  console.log("ideas:", ideas.data?.[0]);
}
check();
