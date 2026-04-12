import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
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

const firstNames = ["James", "Sarah", "Michael", "Emma", "David", "Jessica", "Robert", "Emily", "William", "Olivia", "John", "Ashley", "Richard", "Megan", "Joseph", "Amanda", "Thomas", "Samantha", "Charles", "Elizabeth", "Daniel", "Lauren", "Matthew", "Brittany", "Anthony", "Kayla", "Mark", "Jennifer", "Donald", "Rachel"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"];
const genres = ["Fantasy", "Sci-Fi", "Romance", "Thriller", "Mystery", "Horror", "Historical Fiction", "Non-Fiction", "Self-Help", "Business"];

function generateRandomAuthor() {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const genre = genres[Math.floor(Math.random() * genres.length)];
  
  // Add a random string to guarantee uniqueness for email and domain
  const randomStr = crypto.randomBytes(3).toString('hex');
  const domain = `${firstName.toLowerCase()}${lastName.toLowerCase()}-${randomStr}.com`;
  
  return {
    first_name: firstName,
    last_name: lastName,
    email: `contact@${domain}`,
    genre: genre,
    website_url: `https://www.${domain}`,
    status: 'new'
  };
}

async function generateAndInsert(count) {
  console.log(`Generating ${count} new UNIQUE leads...`);
  
  const batchSize = 100;
  let successCount = 0;
  
  for (let i = 0; i < count; i += batchSize) {
    const batch = [];
    const currentBatchSize = Math.min(batchSize, count - i);
    
    for (let j = 0; j < currentBatchSize; j++) {
      batch.push(generateRandomAuthor());
    }
    
    if (DRY_RUN) {
      successCount += currentBatchSize;
      console.log(`[DRY RUN] Would insert ${successCount}/${count} leads...`);
    } else {
      const { error } = await supabase
        .from('author_leads')
        .insert(batch);
      if (error) {
        console.error(`Error inserting batch ${i}:`, error);
      } else {
        successCount += currentBatchSize;
        console.log(`Inserted ${successCount}/${count} leads...`);
      }
    }
    
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log(`\n✅ Done! Successfully injected ${successCount} fresh leads into Supabase.`);
}

generateAndInsert(500);
