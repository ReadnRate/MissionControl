const { Client } = require('pg');
const fs = require('fs');
const DBPASS = "MissionControl2026!";
const connectionString = `postgresql://postgres.zexumnlvkrjryvzrlavp:${DBPASS}@aws-0-us-west-2.pooler.supabase.com:6543/postgres`;
const client = new Client({ connectionString });

async function run() {
  try {
    await client.connect();
    
    // Check if digg_posts table exists
    const res = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'digg_posts'
      );
    `);
    
    if (!res.rows[0].exists) {
      console.log("Creating digg_posts table...");
      const sql = fs.readFileSync('/data/.openclaw/workspace/mission-control-v4/digg_posts.sql', 'utf8');
      await client.query(sql);
      console.log("Created!");
    } else {
      console.log("Table digg_posts exists. Seeding data...");
    }

    // Seed digg data based on memory
    const seed = `
      INSERT INTO digg_posts (channel_id, post_date, title, content, status) VALUES
      (1, '2026-03-14', 'Why 90% of Self-Published Authors Fail Before 10 Reviews', 'A deep dive into the Amazon KDP algorithm and why early reviews are the only metric that matters...', 'pending'),
      (2, '2026-03-15', 'I Analyzed 500 Viral Books on BookTok - Here is the Formula', 'The surprising truth about what makes a book go viral isn''t the cover, it''s...', 'pending'),
      (1, '2026-03-16', 'Stop Paying for Kirkus Reviews: Do This Instead', 'A controversial take on the paid review industry and how guerrilla marketing is replacing it...', 'pending')
      ON CONFLICT DO NOTHING;
    `;
    await client.query(seed);
    console.log("Digg data seeded!");

    await client.end();
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}
run();
