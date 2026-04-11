const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.zexumnlvkrjryvzrlavp:MissionControl2026!@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  try {
    await client.connect();
    console.log("✅ Connected to Supabase Postgres");

    // Create trym_leads table
    const t1 = await client.query(`
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
    `);
    console.log("✅ trym_leads table created:", t1.command);

    // Create scrapio_runs table
    const t2 = await client.query(`
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
    `);
    console.log("✅ scrapio_runs table created:", t2.command);

    // Create indexes
    const idx1 = await client.query(`CREATE INDEX IF NOT EXISTS idx_trym_leads_email ON public.trym_leads(email);`);
    console.log("✅ Index idx_trym_leads_email:", idx1.command);

    const idx2 = await client.query(`CREATE INDEX IF NOT EXISTS idx_trym_leads_status ON public.trym_leads(status);`);
    console.log("✅ Index idx_trym_leads_status:", idx2.command);

    const idx3 = await client.query(`CREATE INDEX IF NOT EXISTS idx_scrapio_runs_status ON public.scrapio_runs(status);`);
    console.log("✅ Index idx_scrapio_runs_status:", idx3.command);

    // Verify
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('trym_leads', 'scrapio_runs');
    `);
    console.log("✅ Verified tables:", tables.rows.map(r => r.table_name).join(', '));

    await client.end();
    console.log("🎉 Done!");
  } catch (err) {
    console.error("❌ Error:", err.message);
    await client.end();
    process.exit(1);
  }
}

run();
