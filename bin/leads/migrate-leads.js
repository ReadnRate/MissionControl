import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://zexumnlvkrjryvzrlavp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const csv = fs.readFileSync('/data/.openclaw/workspace/research/cold_email_author_list_batch1.csv', 'utf8');
const lines = csv.trim().split('\n').slice(1);

async function migrate() {
  let count = 0;
  for (const line of lines) {
    if (!line) continue;
    // Format: Name,Email,Source
    // Handling possible commas in the name or source? The data we checked didn't have inner commas inside quotes except maybe Source.
    const firstComma = line.indexOf(',');
    const secondComma = line.indexOf(',', firstComma + 1);
    const name = line.substring(0, firstComma).replace(/"/g, '').trim();
    const email = line.substring(firstComma + 1, secondComma).replace(/"/g, '').trim();
    
    // Simple split name
    const parts = name.split(' ');
    const first_name = parts[0];
    const last_name = parts.slice(1).join(' ');

    const { error } = await supabase
      .from('author_leads')
      .insert({
        first_name,
        last_name,
        email,
        status: 'new'
      });
      
    if (error) {
      console.error('Error inserting', email, error);
    } else {
      count++;
    }
  }
  console.log(`Migrated ${count} leads to Supabase.`);
}

migrate();
