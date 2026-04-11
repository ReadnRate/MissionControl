const { Client } = require('pg');
const DBPASS = "MissionControl2026!";
const connectionString = `postgresql://postgres.zexumnlvkrjryvzrlavp:${DBPASS}@aws-0-us-west-2.pooler.supabase.com:6543/postgres`;
const client = new Client({ connectionString });

async function run() {
  await client.connect();
  
  // Clean old garbage intel
  await client.query("DELETE FROM intel;");
  
  // Insert REAL intel
  await client.query(`
    INSERT INTO intel (title, category, summary, importance, source) VALUES
    ('CRITICAL: Digg Beta Shuts Down', 'platform-death', 'Digg has officially suspended its open beta today (March 14, 2026) due to an unprecedented bot problem. CEO Justin Mezzell called for a "hard reset" and Kevin Rose is taking over in April. All marketing strategies relying on Digg are dead.', 'hot', 'https://en.wikipedia.org/wiki/Digg'),
    ('Reddit /r/KDP Vulnerability', 'opportunity', 'With Digg closed, the focus must shift entirely to Reddit and BookTok. /r/KDP authors are actively complaining about fake reviews. Read & Rate can position itself as the verified savior.', 'high', 'https://reddit.com/r/KDP')
  `);
  
  console.log("Updated real intel.");
  await client.end();
}
run();
