#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const DRY_RUN = process.argv.includes('--dry-run');
if (DRY_RUN) console.log('[DRY RUN] No writes will be made to Supabase.\n');

const SUPABASE_URL            = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SCRAPIO_API_KEY         = process.env.SCRAPIO_API_KEY;
const N8N_WEBHOOK_URL         = process.env.N8N_WEBHOOK_URL ?? "https://n8n.readnrate.com/webhook/trym-scrapio";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SCRAPIO_API_KEY) {
  console.error('Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SCRAPIO_API_KEY');
  process.exit(1);
}

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
        // ── Email: try website_data JSON first, then direct fields ───────────
        let email = null;
        if (row.website_data) {
          try {
            const parsedData = JSON.parse(row.website_data);
            if (parsedData.emails && parsedData.emails.length > 0) {
              email = parsedData.emails[0].email;
            }
          } catch(e) {}
        }
        if (!email && row.email)      email = row.email;
        if (!email && row.all_emails) email = row.all_emails.split(',')[0].trim();

        // ── Helper: pick first truthy value from candidate keys ──────────────
        const pick = (...keys) => {
          for (const k of keys) { if (row[k] != null && row[k] !== '') return row[k]; }
          return null;
        };
        const bool = (...keys) => {
          const v = pick(...keys);
          if (v === null) return null;
          return v === true || v === 'true' || v === '1' || v === 'Yes';
        };
        const num  = (...keys) => {
          const v = pick(...keys);
          return v != null ? parseFloat(v) || null : null;
        };
        const int  = (...keys) => {
          const v = pick(...keys);
          return v != null ? parseInt(v, 10) || null : null;
        };

        return {
          // ── Core ────────────────────────────────────────────────────────────
          business_name:  pick('name', 'business_name'),
          address:        pick('full_address', 'location_full_address', 'location_address'),
          street_1:       pick('street', 'location_street', 'street_1'),
          street_2:       pick('street_2', 'location_street_2'),
          city:           pick('city', 'location_city') || cityRecord.city,
          state:          pick('state', 'location_state') || cityRecord.state,
          country:        pick('country_code', 'location_country_code', 'country') || cityRecord.country,
          postal_code:    pick('postal_code', 'location_postal_code', 'zip'),
          borough:        pick('borough', 'location_borough'),
          level_1_division: pick('state_long', 'level_1_division'),
          level_2_division: pick('county', 'level_2_division'),
          timezone:       pick('timezone'),
          latitude:       num('latitude', 'lat'),
          longitude:      num('longitude', 'lng', 'lon'),

          // ── Contact ─────────────────────────────────────────────────────────
          phone:          pick('phone'),
          phone_intl:     pick('phone_intl', 'international_phone'),
          email,
          email_2:        pick('email_2'),
          email_3:        pick('email_3'),
          email_4:        pick('email_4'),
          email_5:        pick('email_5'),
          all_emails:     pick('all_emails'),
          website:        pick('website'),
          link:           pick('link', 'google_maps_url', 'maps_url'),

          // ── Google IDs ──────────────────────────────────────────────────────
          google_id:      pick('google_id', 'id'),
          place_id:       pick('place_id'),
          cid:            pick('cid'),
          mid:            pick('mid'),

          // ── Business info ───────────────────────────────────────────────────
          main_type:      pick('main_type', 'type'),
          all_types:      pick('all_types', 'types'),
          description_1:  pick('description', 'description_1'),
          description_2:  pick('description_2'),
          description_3:  pick('description_3'),
          price_range:    pick('price_range', 'price_level'),
          is_claimed:     bool('is_claimed', 'claimed'),
          is_closed:      bool('is_closed', 'permanently_closed'),
          is_closed_temporarily: bool('is_closed_temporarily', 'temporarily_closed'),
          working_hours:  pick('working_hours', 'hours', 'opening_hours'),
          occupancy:      pick('occupancy'),
          characteristics: pick('characteristics', 'amenities'),
          offerings_link: pick('offerings_link'),
          hotel_info:     pick('hotel_info'),
          other_places:   pick('other_places'),

          // ── Reviews ─────────────────────────────────────────────────────────
          reviews_count:  int('reviews_count', 'review_count', 'reviews'),
          reviews_rating: num('rating', 'reviews_rating', 'average_rating'),
          reviews_id:     pick('reviews_id'),
          reviews_per_score: pick('reviews_per_score'),
          reviews_tags:   pick('reviews_tags'),

          // ── Photos ──────────────────────────────────────────────────────────
          photos_count:   int('photos_count', 'photo_count'),
          photo_1:        pick('photo_1', 'main_photo'),
          photo_2:        pick('photo_2'),
          all_photos:     pick('all_photos'),
          menu_photos:    pick('menu_photos'),
          photos_360:     pick('photos_360', 'street_view'),

          // ── Social ──────────────────────────────────────────────────────────
          facebook:       pick('facebook'),
          instagram:      pick('instagram'),
          twitter:        pick('twitter'),
          linkedin:       pick('linkedin'),
          all_facebook_links:  pick('all_facebook_links'),
          all_youtube_links:   pick('all_youtube_links'),
          all_twitter_links:   pick('all_twitter_links'),

          // ── Website meta (from website_data JSON if available) ───────────────
          website_title:            pick('website_title'),
          website_meta_keywords:    pick('website_meta_keywords'),
          website_meta_description: pick('website_meta_description'),
          website_meta_image:       pick('website_meta_image'),
          website_meta_generator:   pick('website_meta_generator'),
          website_lang:             pick('website_lang'),

          // ── Contact pages ────────────────────────────────────────────────────
          contact_page_1: pick('contact_page_1'),
          contact_page_2: pick('contact_page_2'),
          contact_page_3: pick('contact_page_3'),
          contact_page_4: pick('contact_page_4'),
          contact_page_5: pick('contact_page_5'),
          all_contact_pages: pick('all_contact_pages'),

          // ── Booking/ordering ─────────────────────────────────────────────────
          booking_links:  pick('booking_links', 'reservations'),
          order_links:    pick('order_links', 'order_online'),

          // ── Meta ─────────────────────────────────────────────────────────────
          status:  'new',
          keyword,
          source:  'scrapio',
        };
      });
      
      if (DRY_RUN) {
        console.log(`  [DRY RUN] Would insert ${inserts.length} leads.`);
      } else {
        const insertRes = await requestSupabase(`/rest/v1/trym_leads`, 'POST', inserts, { "Prefer": "return=minimal" });
        if (!insertRes) {
          console.error(`  Failed to insert rows to Supabase.`);
        } else {
          console.log(`  Inserted batch of ${inserts.length} leads.`);
        }
      }
    }

    // 5. Update keyword completion
    completedKeywords.push(keyword);
    let patchData = { keywords_completed: completedKeywords };
    if (completedKeywords.length >= 3) {
      patchData.status = 'done';
    }
    if (!DRY_RUN) await requestSupabase(`/rest/v1/scrapio_cities?id=eq.${cityRecord.id}`, 'PATCH', patchData);
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
