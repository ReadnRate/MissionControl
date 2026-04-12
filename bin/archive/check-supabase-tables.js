const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/data/.openclaw/workspace/mission-control-next/.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    const { data, error } = await supabase.from('marketing_campaigns').select('*').limit(1);
    console.log("Error:", error?.message);
    console.log("Data:", data);
}
check();
