const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.zexumnlvkrjryvzrlavp:openclaw-secure-39a7f69314ad8578ef6612dc05a29cc7@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  try {
    await client.connect();
    console.log("CONNECTED TO SUPABASE POSTGRES!");
    await client.end();
  } catch (err) {
    console.error("CONNECTION FAILED:", err.message);
  }
}
run();
