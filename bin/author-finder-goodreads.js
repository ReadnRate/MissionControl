const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/data/.openclaw/workspace/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

// List of 5 indie romance/fantasy authors found via Goodreads lists
const targetAuthors = [
    { name: "A.C. Arthur", genre: "Romance" },
    { name: "J.D. Evans", genre: "Fantasy Romance" },
    { name: "Lisa Cassidy", genre: "Epic Fantasy" },
    { name: "Nicola Tyche", genre: "Romantasy" },
    { name: "Azalea Dabill", genre: "Fantasy" }
];

async function findAuthorEmail(authorName) {
    try {
        const response = await axios.post('https://api.tavily.com/search', {
            api_key: TAVILY_API_KEY,
            query: `"${authorName}" author official website contact email`,
            search_depth: "basic",
            include_raw_content: true,
            max_results: 3
        });

        const results = response.data.results;
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;

        for (const result of results) {
            const content = result.raw_content || result.content || "";
            const emails = content.match(emailRegex);
            
            if (emails && emails.length > 0) {
                // Filter out common false positives
                const validEmails = emails.filter(e => 
                    !e.endsWith('.png') && 
                    !e.endsWith('.jpg') && 
                    !e.includes('example') && 
                    !e.includes('wixpress') &&
                    !e.includes('sentry')
                );
                
                if (validEmails.length > 0) {
                    return { email: validEmails[0].toLowerCase(), url: result.url };
                }
            }
        }
        return null;
    } catch (error) {
        console.error(`Error searching for ${authorName}:`, error.message);
        return null;
    }
}

async function run() {
    console.log(`Starting lead generation for ${targetAuthors.length} authors...`);
    
    for (const author of targetAuthors) {
        console.log(`\nSearching for ${author.name}...`);
        const contactInfo = await findAuthorEmail(author.name);
        
        if (contactInfo) {
            console.log(`✅ REAL LEAD: ${author.name} | ${contactInfo.email} | ${contactInfo.url}`);
            
            // Split name
            const parts = author.name.split(' ');
            const firstName = parts[0];
            const lastName = parts.slice(1).join(' ');

            const { data, error } = await supabase
                .from('author_leads')
                .insert([{
                    first_name: firstName,
                    last_name: lastName,
                    email: contactInfo.email,
                    book_title: null,
                    genre: author.genre,
                    website_url: contactInfo.url,
                    status: 'new',
                    personalization_text: `Found your impressive work as an indie author and visited your site at ${new URL(contactInfo.url).hostname}.`
                }]);

            if (error) {
                console.error(`❌ Failed to insert ${author.name}:`, error.message);
            } else {
                console.log(`✔️ Successfully inserted ${author.name} to Supabase.`);
            }
        } else {
            console.log(`❌ No valid email found for ${author.name}`);
        }
        
        // slight delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log("\nDone processing batch.");
}

run();
