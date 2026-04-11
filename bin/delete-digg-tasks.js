const { Client } = require('pg');
const DBPASS = "MissionControl2026!";
const connectionString = `postgresql://postgres.zexumnlvkrjryvzrlavp:${DBPASS}@aws-0-us-west-2.pooler.supabase.com:6543/postgres`;
const client = new Client({ connectionString });

async function run() {
  await client.connect();
  await client.query("DELETE FROM ideas WHERE title LIKE '%Digg%';");
  console.log("Deleted Digg tasks/ideas.");
  await client.end();
}
run();
