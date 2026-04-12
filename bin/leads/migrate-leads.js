import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const DRY_RUN = process.argv.includes('--dry-run');
if (DRY_RUN) console.log('[DRY RUN] No writes will be made to Supabase.\n');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CSV_PATH = process.env.LEADS_CSV_PATH
  ?? path.join(__dirname, '../../research/cold_email_author_list_batch1.csv');

const csv   = fs.readFileSync(CSV_PATH, 'utf8');
const lines = csv.trim().split('\n').slice(1);

async function migrate() {
  let count = 0;
  for (const line of lines) {
    if (!line) continue;
    // Format: Name,Email,Source
    const firstComma  = line.indexOf(',');
    const secondComma = line.indexOf(',', firstComma + 1);
    const name  = line.substring(0, firstComma).replace(/"/g, '').trim();
    const email = line.substring(firstComma + 1, secondComma).replace(/"/g, '').trim();

    const parts      = name.split(' ');
    const first_name = parts[0];
    const last_name  = parts.slice(1).join(' ');

    if (DRY_RUN) {
      console.log(`[DRY RUN] Would insert: ${first_name} ${last_name} <${email}>`);
      count++;
      continue;
    }

    const { error } = await supabase
      .from('author_leads')
      .insert({ first_name, last_name, email, status: 'new' });

    if (error) {
      console.error('Error inserting', email, error);
    } else {
      count++;
    }
  }
  console.log(`Migrated ${count} leads to Supabase.`);
}

migrate();
