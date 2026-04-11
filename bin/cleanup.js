import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.join(process.cwd(), '.env');
const envFile = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const envVars = Object.fromEntries(
  envFile.split('\n')
    .filter(line => line && !line.startsWith('#') && line.includes('='))
    .map(line => {
        let i = line.indexOf('=');
        let key = line.slice(0, i).trim();
        let val = line.slice(i+1).trim().replace(/^"(.*)"$/, '$1');
        return [key, val];
    })
);

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = envVars;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const REJECT_NAMES = ['indie', 'group', 'team', 'author', 'admin', 'contact', 'info', 'support', 'hello', 'newsletter', 'editor', 'publishing', 'service', 'blog', 'books', 'press', 'studios', 'media', 'designs', 'creative', 'literary', 'editing'];
const REJECT_EMAILS = ['editorial', 'editing', 'service', 'publisher', 'blog', 'group', 'team', 'noreply', 'example', 'test', 'press', 'studio', 'media', 'design', 'literary', 'agency'];

async function runCleanup() {
    console.log("Fetching all leads...");
    const { data: leads, error } = await supabase.from('author_leads').select('*');
    if (error) {
        console.error("Error fetching leads", error);
        return;
    }
    
    let toDelete = [];
    
    for (let lead of leads) {
        let shouldDelete = false;
        
        const fnLower = (lead.first_name || '').toLowerCase();
        const lnLower = (lead.last_name || '').toLowerCase();
        const emLower = (lead.email || '').toLowerCase();
        
        if (!lead.first_name || !lead.last_name || lead.last_name.trim() === '') {
            shouldDelete = true;
        } else if (REJECT_NAMES.some(r => fnLower.includes(r))) {
            shouldDelete = true;
        } else if (REJECT_NAMES.some(r => lnLower.includes(r))) {
            shouldDelete = true;
        } else if (REJECT_EMAILS.some(kw => emLower.includes(kw))) {
            shouldDelete = true;
        } else {
            const fullName = `${lead.first_name} ${lead.last_name}`;
            if (fullName === fullName.toUpperCase()) {
                shouldDelete = true;
            }
        }
        
        if (shouldDelete) {
            toDelete.push(lead.id);
        }
    }
    
    console.log(`Found ${toDelete.length} leads to delete.`);
    
    if (toDelete.length > 0) {
        for (let i = 0; i < toDelete.length; i += 100) {
            const batch = toDelete.slice(i, i + 100);
            const { error: delError } = await supabase.from('author_leads').delete().in('id', batch);
            if (delError) {
                console.error("Error deleting batch", delError);
            } else {
                console.log(`Deleted batch of ${batch.length}`);
            }
        }
    }
    console.log("Cleanup done.");
}

runCleanup().catch(console.error);