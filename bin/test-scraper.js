import fs from 'fs';
import path from 'path';

const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
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

const { BRAVE_SEARCH_API_KEY } = envVars;

async function test() {
    let q = encodeURIComponent('"indie author" "contact me" "@gmail.com" site:substack.com OR site:goodreads.com');
    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${q}&count=5`, {
      headers: { 'Accept': 'application/json', 'X-Subscription-Token': BRAVE_SEARCH_API_KEY }
    });
    const data = await res.json();
    console.log("Results:");
    if(data.web?.results) {
        data.web.results.forEach(r => console.log(`- ${r.title} | ${r.url} | ${r.description}`));
    }
}
test().catch(console.error);
