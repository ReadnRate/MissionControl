import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BRAVE_SEARCH_API_KEY, TAVILY_API_KEY } = process.env;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TARGET_LEADS = 50;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const INVALID_DOMAINS = ['sentry', 'wix', 'wordpress', 'example', 'domain', 'rocketreach', 'lusha', 'hunter', 'sift'];

const SOURCES = [
    // GOOD: Direct author about/contact pages (real author websites, not groups)
    { name: 'Author About Pages', query: `site:.com "about the author" OR "about me" "author" "contact" "@gmail.com" -forum -group -goodreads -directory` },
    // GOOD: Amazon Author Central individual pages
    { name: 'Amazon Authors', query: `site:amazon.com/author "self-published" OR "indie author" contact` },
    // GOOD: Substack author pages with bios
    { name: 'Substack Authors', query: `site:substack.com "I am a" OR "I write" author "contact" "@gmail.com" OR "@outlook.com"` },
    // GOOD: Personal author websites (Linktree pages are often author hubs)
    { name: 'Author Linktree', query: `site:linktr.ee "author" "contact" OR "email" -review -service -editing` },
    // GOOD: BookBub author profiles (individual, not groups)
    { name: 'BookBub Profiles', query: `site:bookbub.com/profile "author" "website" OR "blog" OR "contact"` }
];

const sourceIndex = new Date().getDay() % 5;
const currentSource = SOURCES[sourceIndex];

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function checkEmailExists(email) {
    const { count, error } = await supabase
        .from('author_leads')
        .select('*', { count: 'exact', head: true })
        .eq('email', email.toLowerCase());
    if (error) { console.error("Supabase Error:", error); return true; }
    return count > 0;
}

async function validateUrl(url) {
    if (!url) return null;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(url, { method: 'HEAD', signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
        clearTimeout(timeoutId);
        return res.ok ? url : null;
    } catch (e) {
        return null;
    }
}

async function fetchPageHtml(url) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
            const text = await res.text();
            return text;
        }
    } catch(e) {}
    return "";
}

function extractEmails(text) {
    if (!text) return [];
    const matches = text.match(EMAIL_REGEX) || [];
    return [...new Set(matches.filter(e => {
        let le = e.toLowerCase();
        if (INVALID_DOMAINS.some(d => le.includes(d))) return false;
        if (le.endsWith('.png') || le.endsWith('.jpg') || le.endsWith('.gif')) return false;
        if (['admin','support','info','contact','hello'].some(p => le.startsWith(p))) return false;
        return true;
    }))];
}

function guessName(title, email) {
    let namePart = title.split(/[|\-]/)[0].trim();
    if (namePart.includes(':') && (namePart.toLowerCase().includes('amazon') || namePart.toLowerCase().includes('goodreads'))) {
        namePart = title.split(':')[1].trim(); // take what's after Amazon.com:
    }
    
    // Strip prefixes/suffixes
    namePart = namePart.replace(/^(Author|Indie Author|Writer|The Author)\b/i, '').trim();
    namePart = namePart.replace(/\b(Author|Writer|Books|Novels)$/i, '').trim();

    if (!namePart || namePart.toLowerCase() === 'contact' || namePart.toLowerCase() === 'about' || namePart.toLowerCase() === 'home' || namePart.includes('.com')) {
        namePart = email.split('@')[0].replace(/[._0-9]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
    }
    const parts = namePart.split(' ').filter(p => p.trim() !== '');
    return { first_name: parts[0] || null, last_name: parts.slice(1).join(' ') || null };
}

const REJECT_NAMES = ['indie', 'group', 'team', 'author', 'admin', 'contact', 'info', 'support', 'hello', 'newsletter', 'editor', 'publishing', 'service', 'blog', 'books', 'press', 'studios', 'media', 'designs', 'creative', 'literary', 'editing'];
const REJECT_EMAILS = ['editorial', 'editing', 'service', 'publisher', 'blog', 'group', 'team', 'noreply', 'example', 'test', 'press', 'studio', 'media', 'design', 'literary', 'agency'];

function isValidAuthor(firstName, lastName, email, title) {
    if (!firstName) return { valid: false, reason: "First name is blank" };
    
    const fnLower = firstName.toLowerCase();
    if (REJECT_NAMES.some(r => fnLower.includes(r))) {
        return { valid: false, reason: `Generic first name: ${firstName}` };
    }
    
    const lnLower = (lastName || '').toLowerCase();
    if (REJECT_NAMES.some(r => lnLower.includes(r))) {
         return { valid: false, reason: `Generic last name: ${lastName}` };
    }
    
    const emailLower = email.toLowerCase();
    if (REJECT_EMAILS.some(kw => emailLower.includes(kw))) {
        return { valid: false, reason: "Service/Group email detected" };
    }
    
    const titleLower = (title || '').toLowerCase();
    if (titleLower.includes('editing service') || titleLower.includes('editorial') || titleLower.includes('publisher') || titleLower.includes('directory') || titleLower.includes('services') || titleLower.includes('formatting')) {
        return { valid: false, reason: "Page title indicates service/directory" };
    }

    if (!lastName || lastName.trim() === '') {
        return { valid: false, reason: "Name does not have at least 2 words" };
    }
    
    const fullName = `${firstName} ${lastName}`;
    if (fullName === fullName.toUpperCase()) {
        return { valid: false, reason: "Name is all caps" };
    }
    
    return { valid: true };
}

async function searchBrave(q, offset) {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=20&offset=${offset}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json', 'X-Subscription-Token': BRAVE_SEARCH_API_KEY } });
    if (!res.ok) throw new Error(`Brave Error ${res.status}: ${res.statusText}`);
    const data = await res.json();
    return data.web?.results || [];
}

async function searchTavily(q) {
    const url = `https://api.tavily.com/search`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: TAVILY_API_KEY, query: q, include_raw_content: true, search_depth: "advanced" })
    });
    if (!res.ok) throw new Error(`Tavily Error ${res.status}: ${res.statusText}`);
    const data = await res.json();
    return data.results || [];
}

async function run() {
    console.log(`Starting Daily Lead Gen. Using source: ${currentSource.name}`);
    let leadsAdded = 0;
    
    const queries = [
        currentSource.query,
        currentSource.query.replace('"@gmail.com"', '"@yahoo.com"'),
        currentSource.query.replace('contact', 'email'),
        `"author" "email" "@gmail.com" site:linktr.ee`,
        `"my books" "author" "@gmail.com" site:goodreads.com`,
        `"indie author" "website" "@gmail.com"`,
        `"book release" "author" "@gmail.com"`,
        `"indie author" "buy my book" "@gmail.com"`,
        `"fiction author" "contact" "@gmail.com"`,
        `"romance author" "contact" "@gmail.com"`,
        `"thriller author" "contact" "@gmail.com"`,
        `"fantasy author" "contact" "@gmail.com"`,
        `"sci-fi author" "contact" "@gmail.com"`,
        `"self-published author" "contact" "@gmail.com"`
    ];

    for (let q of queries) {
        if (leadsAdded >= TARGET_LEADS) break;
        
        for (let page = 0; page < 9; page++) { // Brave max offset is 9
            if (leadsAdded >= TARGET_LEADS) break;
            
            console.log(`Searching: ${q} (Page ${page+1})`);
            let results = [];
            
            try {
                results = await searchBrave(q, page);
                await delay(1500); // Prevent 429
            } catch(e) {
                console.error("Brave search failed, attempting Tavily fallback...", e.message);
                try {
                    const tav = await searchTavily(q);
                    results = tav.map(t => ({ url: t.url, title: t.title, description: t.content || t.snippet }));
                    await delay(1000);
                } catch(err) {
                    console.error("Tavily search failed too.", err.message);
                    break;
                }
                break; // Tavily doesn't support offset easily, move to next query
            }
            
            if (results.length === 0) break;

            for (let r of results) {
                if (leadsAdded >= TARGET_LEADS) break;

                let emails = extractEmails(r.description);
                if (emails.length === 0) {
                    // Try web_fetch (native fetch)
                    const html = await fetchPageHtml(r.url);
                    emails = extractEmails(html);
                }
                
                for (let email of emails) {
                    if (leadsAdded >= TARGET_LEADS) break;
                    
                    email = email.toLowerCase();
                    const exists = await checkEmailExists(email);
                    if (!exists) {
                        const { first_name, last_name } = guessName(r.title, email);
                        
                        const validity = isValidAuthor(first_name, last_name, email, r.title);
                        if (!validity.valid) {
                            console.log(`SKIP (not author): ${validity.reason} - ${r.title} | ${email}`);
                            continue;
                        }
                        
                        const validUrl = await validateUrl(r.url);
                        
                        const lead = {
                            first_name, last_name, email, book_title: null, genre: null,
                            website_url: validUrl || null, status: 'new',
                            created_at: new Date().toISOString(), updated_at: new Date().toISOString()
                        };
                        
                        const { error } = await supabase.from('author_leads').insert([lead]);
                        if (!error) {
                            leadsAdded++;
                            console.log(`✅ Verified: ${first_name} ${last_name} | ${email} | ${validUrl || 'null'}`);
                        }
                    }
                }
            }
        }
    }
    console.log(`Added ${leadsAdded} real leads to Supabase`);
}

run().catch(console.error);
