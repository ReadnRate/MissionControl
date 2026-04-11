#!/usr/bin/env node

const SUPABASE_URL = "https://zexumnlvkrjryvzrlavp.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM";
const SCRAPIO_API_KEY = "799|F0jMs1FrXoKXWgXx0qk0iqKSWhJPfndoMvtiEMfb99bc7c45";
const N8N_WEBHOOK_URL = "https://n8n.readnrate.com/webhook/trym-scrapio";

const CITIES_LIMIT = 3; 
const KEYWORDS = ["barber shop", "hairdresser", "hair salon"];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function requestSupabase(endpoint, method = "GET", body = null, headers = {}) {
  const options = {
    method,
    headers: {
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...headers
    }
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${SUPABASE_URL}${endpoint}`, options);
  if (!res.ok) {
    const err = await res.text();
    console.error(`Supabase Error ${res.status} on ${endpoint}: ${err}`);
    return null;
  }
  if (res.status === 204) return true;
  if (method === 'POST' && headers['Prefer'] === 'return=minimal') return true;
  try {
    return await res.json();
  } catch (e) {
    return true;
  }
}

async function requestScrapio(endpoint, method = "GET", body = null) {
  let retries = 2;
  while (retries >= 0) {
    try {
      const options = {
        method,
        headers: {
          "Authorization": `Bearer ${SCRAPIO_API_KEY}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      };
      if (body) options.body = JSON.stringify(body);
      const res = await fetch(`https://scrap.io/api/v1${endpoint}`, options);
      if (!res.ok) {
        throw new Error(`Scrap.io Error ${res.status}: ${await res.text()}`);
      }
      return await res.json();
    } catch (e) {
      if (retries === 0) {
        console.error(e.message);
        return null;
      }
      retries--;
      await sleep(2000);
    }
  }
}

async function downloadScrapio(id) {
  let retries = 2;
  while (retries >= 0) {
    try {
      const res = await fetch(`https://scrap.io/api/v1/exports/${id}/download?type=csv`, {
        headers: {
          "Authorization": `Bearer ${SCRAPIO_API_KEY}`,
          "Accept": "application/json"
        }
      });
      if (!res.ok) throw new Error(`Download Error ${res.status}: ${await res.text()}`);
      const dlData = await res.json();
      const csvRes = await fetch(dlData.download_url);
      if (!csvRes.ok) throw new Error(`S3 Download Error ${csvRes.status}`);
      return await csvRes.text();
    } catch (e) {
      if (retries === 0) {
        console.error(e.message);
        return null;
      }
      retries--;
      await sleep(2000);
    }
  }
}

function parseCSVRow(str) {
  let arr = [];
  let quote = false;
  let val = '';
  for (let c = 0; c < str.length; c++) {
    let cc = str[c], nc = str[c+1];
    if (cc === '"' && quote && nc === '"') { val += '"'; c++; continue; }
    if (cc === '"') { quote = !quote; continue; }
    if (cc === ',' && !quote) { arr.push(val); val = ''; continue; }
    val += cc;
  }
  arr.push(val);
  return arr;
}

function parseCSV(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== "");
  if (lines.length === 0) return [];
  const headers = parseCSVRow(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVRow(lines[i]);
    const row = {};
    headers.forEach((h, idx) => { row[h] = vals[idx] || null; });
    rows.push(row);
  }
  return rows;
}

async function processCity(cityRecord) {
  console.log(`Processing city: ${cityRecord.city}, ${cityRecord.state}`);
  let completedKeywords = cityRecord.keywords_completed || [];
  let missingKeywords = KEYWORDS.filter(k => !completedKeywords.includes(k));

  for (const keyword of missingKeywords) {
    console.log(`  Starting export for keyword: ${keyword}`);
    
    console.log(`  Checking existing exports for ${cityRecord.city}_${keyword}...`);
    const listReq = await requestScrapio('/exports');
    let existingExport = null;
    if (listReq && listReq.data) {
      existingExport = listReq.data.find(e => 
        e.search_params && e.search_params.city === cityRecord.city && 
        ((e.search_params.types && e.search_params.types.some(t => t.toLowerCase() === keyword.toLowerCase().replace(' ', '-'))) || 
        (e.name && e.name.toLowerCase().includes(keyword.toLowerCase())))
      );
    }

    let exportId = null;
    if (existingExport && (existingExport.status === 'success' || existingExport.status === 'preparing-scraping' || existingExport.status === 'completed')) {
      console.log(`  Found existing export ${existingExport.id} with status ${existingExport.status}`);
      exportId = existingExport.id;
    } else {
      let exportReq = null;
      let createAttempts = 0;
      while (createAttempts < 1) {
        exportReq = await requestScrapio('/exports', 'POST', {
          search_term: keyword,
          country_code: cityRecord.country,
          city: cityRecord.city,
          name: `${cityRecord.city}_${keyword}`
        });
        if (exportReq && (exportReq.id || (exportReq.data && exportReq.data.id))) {
          exportId = exportReq.id || exportReq.data.id;
          break;
        } else {
          console.log("  Export creation got error (probably 403 limit). Skipping this keyword for now.");
          break;
        }
        createAttempts++;
      }
    }

    if (!exportId) {
      console.error(`  Failed to create or find export for ${keyword}`);
      continue;
    }
    
    console.log(`  Using export: ${exportId}. Polling...`);
    
    // 2. Poll until completed
    let status = 'pending';
    let attempts = 0;
    while (attempts < 20) { // Max 10 mins (20 * 30s)
      const checkReq = await requestScrapio(`/exports/${exportId}`);
      if (!checkReq) {
        attempts++;
        await sleep(30000);
        continue;
      }
      status = checkReq.status || (checkReq.data ? checkReq.data.status : 'pending');
      console.log(`    Status: ${status}`);
      if (status === 'completed' || status === 'success') {
        break;
      }
      attempts++;
      await sleep(30000);
    }
    
    if (status !== 'completed' && status !== 'success') {
      console.error(`  Export ${exportId} timed out or failed with status ${status}`);
      await requestSupabase(`/rest/v1/scrapio_cities?id=eq.${cityRecord.id}`, 'PATCH', { status: 'failed' });
      continue;
    }
    
    // 3. Download CSV
    console.log(`  Downloading CSV for ${exportId}...`);
    const csvData = await downloadScrapio(exportId);
    if (!csvData) {
      await requestSupabase(`/rest/v1/scrapio_cities?id=eq.${cityRecord.id}`, 'PATCH', { status: 'failed' });
      continue;
    }
    
    // 4. Parse CSV & Insert
    const parsed = parseCSV(csvData);
    console.log(`  Parsed ${parsed.length} rows. Mapping and inserting...`);
    
    if (parsed.length > 0) {
      const inserts = parsed.map(row => {
        let email = null;
        if (row.website_data) {
          try {
            const parsedData = JSON.parse(row.website_data);
            if (parsedData.emails && parsedData.emails.length > 0) {
              email = parsedData.emails[0].email;
            }
          } catch(e) {}
        }
        if (!email && row.email) email = row.email;
        if (!email && row.all_emails) email = row.all_emails.split(',')[0];
        
        return {
          business_name: row.name,
          address: row.location_full_address || row.location_address,
          city: row.location_city || cityRecord.city,
          state: row.location_state || cityRecord.state,
          country: row.location_country_code || cityRecord.country,
          phone: row.phone,
          email: email,
          website: row.website,
          status: 'new',
          keyword: keyword,
          source: 'scrapio'
        };
      });
      
      const insertRes = await requestSupabase(`/rest/v1/trym_leads`, 'POST', inserts, { "Prefer": "return=minimal" });
      if (!insertRes) {
        console.error(`  Failed to insert rows to Supabase.`);
      } else {
        console.log(`  Inserted batch of ${inserts.length} leads.`);
      }
    }
    
    // 5. Update keyword completion
    completedKeywords.push(keyword);
    let patchData = { keywords_completed: completedKeywords };
    if (completedKeywords.length >= 3) {
      patchData.status = 'done';
    }
    await requestSupabase(`/rest/v1/scrapio_cities?id=eq.${cityRecord.id}`, 'PATCH', patchData);
  }
  return true;
}

async function main() {
  console.log(`Fetching up to ${CITIES_LIMIT} pending cities...`);
  const query = `/rest/v1/scrapio_cities?status=eq.pending&order=population.desc&limit=${CITIES_LIMIT}`;
  const cities = await requestSupabase(query);
  
  if (!cities || cities.length === 0) {
    console.log("No pending cities found.");
    console.log("ALL DONE");
    process.exit(0);
  }
  
  for (const city of cities) {
    await processCity(city);
    await sleep(3000); 
  }
  
  console.log("ALL DONE");
}

main().catch(err => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
