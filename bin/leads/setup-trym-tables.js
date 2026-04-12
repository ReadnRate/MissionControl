const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log("Creating trym_leads and scrapio_runs tables...");

  // Create trym_leads table
  const { error: error1 } = await supabase.rpc('exec_sql', {
    query: `
    CREATE TABLE IF NOT EXISTS public.trym_leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_name TEXT,
      address TEXT,
      phone TEXT,
      website TEXT,
      email TEXT,
      city TEXT,
      country TEXT,
      keyword TEXT,
      source TEXT DEFAULT 'scrapio',
      status TEXT DEFAULT 'new',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    `
  });
  console.log("trym_leads:", error1 || "OK");

  // Create scrapio_runs table
  const { error: error2 } = await supabase.rpc('exec_sql', {
    query: `
    CREATE TABLE IF NOT EXISTS public.scrapio_runs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      city TEXT,
      country TEXT,
      keyword TEXT,
      export_id TEXT,
      status TEXT DEFAULT 'pending',
      leads_found INT DEFAULT 0,
      leads_inserted INT DEFAULT 0,
      run_at TIMESTAMPTZ DEFAULT NOW()
    );
    `
  });
  console.log("scrapio_runs:", error2 || "OK");

  // Create indexes
  const { error: error3 } = await supabase.rpc('exec_sql', {
    query: `
    CREATE INDEX IF NOT EXISTS idx_trym_leads_email ON public.trym_leads(email);
    CREATE INDEX IF NOT EXISTS idx_trym_leads_status ON public.trym_leads(status);
    CREATE INDEX IF NOT EXISTS idx_trym_leads_city ON public.trym_leads(city);
    `
  });
  console.log("indexes:", error3 || "OK");

  console.log("Done!");
}
run();
