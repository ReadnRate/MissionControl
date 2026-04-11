const { Client } = require('pg');
const fs = require('fs');

const DBPASS = "MissionControl2026!";
const connectionString = `postgresql://postgres.zexumnlvkrjryvzrlavp:${DBPASS}@aws-0-us-west-2.pooler.supabase.com:6543/postgres`;

const client = new Client({ connectionString });

async function run() {
  try {
    await client.connect();
    console.log("Connected directly to Postgres!");
    
    const sql = fs.readFileSync('/data/.openclaw/workspace/mission-control-v4/schema.sql', 'utf8');
    
    console.log("Executing schema recreation...");
    await client.query(sql);
    console.log("SUCCESS! Tables recreated and seeded.");
    
    await client.end();
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}
run();
