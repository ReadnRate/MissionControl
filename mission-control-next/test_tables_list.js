import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '/data/.openclaw/workspace/mission-control-next/.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('email_campaigns').select('id', { count: 'exact' });
  console.log("email_campaigns:", error ? error.message : data.length);
  const { data: d2, error: e2 } = await supabase.from('contacts').select('id', { count: 'exact' });
  console.log("contacts:", e2 ? e2.message : d2.length);
  const { data: d3, error: e3 } = await supabase.from('users').select('id', { count: 'exact' });
  console.log("users:", e3 ? e3.message : d3.length);
  const { data: d4, error: e4 } = await supabase.from('leads').select('id', { count: 'exact' });
  console.log("leads:", e4 ? e4.message : d4.length);
}
check();
