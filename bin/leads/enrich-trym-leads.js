#!/usr/bin/env node
/**
 * enrich-trym-leads.js
 * Comprehensively enriches trym_leads using TWO phases per lead:
 *   1. Website scrape  — meta, emails, social links, phone, hours, images, contact/booking pages
 *   2. Google Maps     — google_id, place_id, reviews_count, reviews_rating, is_closed, price_range, etc.
 *
 * Usage: node enrich-trym-leads.js [limit=50] [--loop] [--deep]
 *   --loop  : keep running rounds until no un-enriched leads remain (5s pause between rounds)
 *   --deep  : also process leads that already have logo_url but are still missing google_id
 */
const { execSync } = require('child_process');
const fs   = require('fs');
const https = require('https');
const http  = require('http');

const SUPABASE_URL = 'https://zexumnlvkrjryvzrlavp.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ─── Core helpers ────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function resolveUrl(src, base) {
  if (!src) return null;
  src = src.trim();
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) return null;
  if (src.startsWith('//')) return 'https:' + src;
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (!base) return null;
  try { return new URL(src, base).href; } catch { return null; }
}

function fetchUrl(url, timeoutMs = 12000, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, {
      timeout: timeoutMs,
      headers: { 'User-Agent': UA, ...extraHeaders }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = res.headers.location;
        const next = loc.startsWith('http') ? loc : new URL(loc, url).href;
        resolve(fetchUrl(next, timeoutMs, extraHeaders));
        return;
      }
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, body, finalUrl: url }));
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('TIMEOUT')); });
    req.on('error', reject);
  });
}

async function supabaseUpdate(id, data) {
  const body = JSON.stringify(data);
  const url  = new URL(`${SUPABASE_URL}/rest/v1/trym_leads?id=eq.${id}`);
  return new Promise((resolve) => {
    const req = https.request({
      hostname: url.hostname,
      path:     url.pathname + url.search,
      method:   'PATCH',
      headers: {
        'apikey':         SERVICE_KEY,
        'Authorization':  `Bearer ${SERVICE_KEY}`,
        'Content-Type':   'application/json',
        'Prefer':         'return=representation',
        'Content-Length': Buffer.byteLength(body),
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(d)); } catch { resolve(true); }
        } else {
          console.log(`  PATCH error ${res.statusCode}: ${d.substring(0, 120)}`);
          resolve(null);
        }
      });
    });
    req.on('error', e => { console.log('  PATCH error:', e.message); resolve(null); });
    req.write(body);
    req.end();
  });
}

// ─── HTML extraction helpers ──────────────────────────────────────────────────

/** Read a <meta name/property="X" content="Y"> tag, trying multiple name variants */
function metaContent(html, ...names) {
  for (const name of names) {
    // content before name/property
    let m = html.match(new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, 'i'
    ));
    if (!m) m = html.match(new RegExp(
      `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'
    ));
    if (m && m[1].trim()) return m[1].trim();
  }
  return null;
}

function extractEmails(html) {
  const found = new Set();
  // mailto: links (most reliable)
  for (const m of html.matchAll(/href=["']mailto:([^"'?\s]+)/gi)) {
    const e = m[1].toLowerCase().trim();
    if (e.includes('@') && !e.includes('example') && !e.includes('youremail')) found.add(e);
  }
  // Plain-text email pattern
  for (const m of html.matchAll(/[\w.+-]{2,}@[\w-]{2,}\.(?:com|ca|org|net|io|co|fr|de|uk|au|nz|be|nl|se|no|dk|fi|es|it|pt)\b/gi)) {
    const e = m[0].toLowerCase();
    if (!e.includes('example') && !e.includes('sentry') && !e.includes('wixpress') && !e.includes('@2x')) {
      found.add(e);
    }
  }
  return [...found].slice(0, 10);
}

function extractPhones(html) {
  const found = new Set();
  for (const m of html.matchAll(/href=["']tel:([^"']+)["']/gi)) {
    found.add(m[1].trim());
  }
  return [...found];
}

function extractSocial(html) {
  const result = {
    facebook: null, instagram: null, twitter: null, linkedin: null,
    all_facebook_links: null, all_twitter_links: null, all_youtube_links: null,
  };
  const fb = [], tw = [], yt = [];

  for (const m of html.matchAll(/href=["'](https?:\/\/(?:www\.)?(?:facebook|fb)\.com\/(?!sharer|share\b|plugins|dialog|photo|video|events|pages\/category)[^"'?\s#]{1,80})["']/gi)) {
    const u = m[1].replace(/\/$/, '');
    if (!result.facebook) result.facebook = u;
    fb.push(u);
  }
  for (const m of html.matchAll(/href=["'](https?:\/\/(?:www\.)?instagram\.com\/(?!p\/|reel\/|explore\/|sharer)[^"'?\s#]{1,60})["']/gi)) {
    if (!result.instagram) result.instagram = m[1].replace(/\/$/, '');
  }
  for (const m of html.matchAll(/href=["'](https?:\/\/(?:www\.)?(?:twitter|x)\.com\/(?!intent|share\b|home)[^"'?\s#]{1,60})["']/gi)) {
    const u = m[1].replace(/\/$/, '');
    if (!result.twitter) result.twitter = u;
    tw.push(u);
  }
  for (const m of html.matchAll(/href=["'](https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[^"'?\s#]{2,80})["']/gi)) {
    if (!result.linkedin) result.linkedin = m[1].replace(/\/$/, '');
  }
  for (const m of html.matchAll(/href=["'](https?:\/\/(?:www\.)?youtube\.com\/[^"'?\s#]{4,100})["']/gi)) {
    yt.push(m[1]);
  }

  if (fb.length) result.all_facebook_links = [...new Set(fb)].join(',');
  if (tw.length) result.all_twitter_links  = [...new Set(tw)].join(',');
  if (yt.length) result.all_youtube_links  = [...new Set(yt)].join(',');
  return result;
}

function extractContactPages(html, base) {
  const PATTERN = /\/(contact|about|nous-contacter|nous-joindre|book(?:ing)?|appointment|rendez-vous|afspraak|reserv|termin|kontakt|reach)/i;
  const seen = new Set(), pages = [];
  for (const m of html.matchAll(/href=["']([^"'#?]{3,120})["']/gi)) {
    const url = resolveUrl(m[1], base);
    if (url && !seen.has(url) && PATTERN.test(url)) { seen.add(url); pages.push(url); }
  }
  return pages.slice(0, 5);
}

function extractBookingLinks(html) {
  const PATTERN = /calendly\.com|fresha\.com|vagaro\.com|booksy\.com|mindbodyonline\.com|square\.site|acuityscheduling\.com|setmore\.com|simplybook\.me|treatwell\.|styleseat\.com|genbook\.com/i;
  const seen = new Set(), links = [];
  for (const m of html.matchAll(/href=["'](https?:\/\/[^"'\s]+)["']/gi)) {
    if (!seen.has(m[1]) && PATTERN.test(m[1])) { seen.add(m[1]); links.push(m[1]); }
  }
  return links.slice(0, 5);
}

function extractImages(html, base) {
  const seen = new Set(), imgs = [];
  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
    const r = resolveUrl(m[1], base);
    if (!r) continue;
    if (/sprite|1x1|pixel|tracking|blank\.(?:gif|png)|loader|placeholder/i.test(r)) continue;
    if (!seen.has(r)) { seen.add(r); imgs.push(r); }
  }
  return imgs.slice(0, 15);
}

function extractLogo(html, base) {
  // 1. <img> with "logo" in src
  const imgs = extractImages(html, base);
  const byName = imgs.find(s => /logo/i.test(s));
  if (byName) return byName;
  // 2. <img alt="logo ...">
  const altM = html.match(/<img[^>]+alt=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i)
             || html.match(/<img[^>]+src=["']([^"']+)["'][^>]*alt=["'][^"']*logo[^"']*["']/i);
  if (altM) { const u = resolveUrl(altM[1], base); if (u) return u; }
  // 3. Favicon
  const fav = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i)
            || html.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i);
  if (fav) return resolveUrl(fav[1], base);
  return null;
}

function extractHero(html, base) {
  const og = metaContent(html, 'og:image', 'twitter:image');
  if (og) { const u = resolveUrl(og, base); if (u) return u; }
  const imgs = extractImages(html, base);
  return imgs.find(s => /hero|banner|slider|main[-_]?image|cover|header[-_]?bg/i.test(s))
      || (imgs.length ? imgs[0] : null);
}

function extractWorkingHours(html) {
  // schema.org openingHoursSpecification JSON
  const spec = html.match(/"openingHoursSpecification"\s*:\s*(\[[\s\S]{10,800}?\])/);
  if (spec) return spec[1].replace(/\s+/g, ' ').trim().substring(0, 1000);
  // schema.org simple string
  const simple = html.match(/"openingHours"\s*:\s*(\[[^\]]+\]|"[^"]+")/);
  if (simple) return simple[1].replace(/"/g, '').trim();
  return null;
}

// ─── Services scraping ───────────────────────────────────────────────────────

/**
 * Extracts services with prices and images from a website.
 * Priority: JSON-LD schema.org → dedicated services page → price pattern scan.
 * Returns array of {name, price, description, image_url} capped at 20 items.
 */
async function scrapeServices(website, html, base) {
  const services = [];
  const seen = new Set();

  function addService(name, price, description, image_url) {
    if (!name || seen.has(name.toLowerCase().trim())) return;
    seen.add(name.toLowerCase().trim());
    services.push({
      name: name.trim().substring(0, 120),
      price: price ? price.trim().substring(0, 40) : null,
      description: description ? description.trim().substring(0, 300) : null,
      image_url: image_url || null,
    });
  }

  // ── 1. JSON-LD schema.org (most reliable) ──────────────────────────────────
  function parseJsonLd(htmlText) {
    for (const m of htmlText.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        const obj = JSON.parse(m[1]);
        const items = Array.isArray(obj) ? obj : [obj];
        for (const item of items) {
          // hasOfferCatalog or ItemList
          const catalog = item.hasOfferCatalog || item.itemListElement || item.offers;
          if (catalog) {
            const list = Array.isArray(catalog) ? catalog : catalog.itemListElement || (catalog.itemOffered ? [catalog] : []);
            for (const entry of list) {
              const name = entry.name || entry.itemOffered?.name;
              const price = entry.price || entry.offers?.price || entry.priceSpecification?.price;
              const desc = entry.description || entry.itemOffered?.description;
              const img = entry.image || entry.itemOffered?.image;
              if (name) addService(name, price ? String(price) : null, desc, typeof img === 'string' ? resolveUrl(img, base) : null);
            }
          }
          // Top-level Service/Product
          if (['Service','Product','Offer'].includes(item['@type'])) {
            const price = item.price || item.offers?.price;
            addService(item.name, price ? String(price) : null, item.description,
              typeof item.image === 'string' ? resolveUrl(item.image, base) : null);
          }
        }
      } catch {}
    }
  }

  parseJsonLd(html);

  // ── 2. Dedicated services/menu page ────────────────────────────────────────
  if (services.length < 3) {
    const SERVICE_PAGE = /\/(service|menu|tarif|prix|treatment|prestation|coiffure|soin|forfait|price|offre|offer)/i;
    const seen2 = new Set();
    const servicePages = [];
    for (const m of html.matchAll(/href=["']([^"'#?]{3,120})["']/gi)) {
      const url = resolveUrl(m[1], base);
      if (url && !seen2.has(url) && SERVICE_PAGE.test(url)) {
        seen2.add(url);
        servicePages.push(url);
      }
    }

    for (const spUrl of servicePages.slice(0, 2)) {
      try {
        const resp = await fetchUrl(spUrl, 8000);
        if (!resp || !resp.body) continue;
        const spHtml = resp.body;

        // Try JSON-LD on the services page first
        parseJsonLd(spHtml);

        // ── 3. Price pattern scan on the services page ──────────────────────
        // Find all sections: split by block headings
        const PRICE_RE = /(?:from\s+)?(?:\$|€|£|USD|CAD|EUR|GBP)\s*\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?\s*(?:\$|€|£|USD|CAD|EUR|GBP)/gi;
        // Strip tags from sections and search for price+heading pairs
        const stripped = spHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
        const priceMatches = [...stripped.matchAll(PRICE_RE)];
        for (const pm of priceMatches.slice(0, 30)) {
          const idx = pm.index ?? 0;
          const context = stripped.substring(Math.max(0, idx - 200), idx + 50);
          // Find the last heading-like text before the price
          const headingM = context.match(/(?:^|[\n.!?])\s*([A-Z][^$€£\n.!?]{3,60})\s*$/);
          if (headingM) {
            const name = headingM[1].trim();
            // Find an image in the same section of HTML (crude block search)
            const blockStart = Math.max(0, spHtml.indexOf(name) - 500);
            const blockEnd = Math.min(spHtml.length, spHtml.indexOf(name) + 500);
            const block = spHtml.substring(blockStart, blockEnd);
            const imgM = block.match(/<img[^>]+src=["']([^"']+)["']/i);
            const imgUrl = imgM ? resolveUrl(imgM[1], spUrl) : null;
            addService(name, pm[0], null, imgUrl);
          }
        }
      } catch {}
    }
  }

  // ── 3. Price pattern fallback on homepage ──────────────────────────────────
  if (services.length === 0) {
    const PRICE_RE = /(?:from\s+)?(?:\$|€|£|USD|CAD|EUR|GBP)\s*\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?\s*(?:\$|€|£|USD|CAD|EUR|GBP)/gi;
    const stripped = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const priceMatches = [...stripped.matchAll(PRICE_RE)];
    for (const pm of priceMatches.slice(0, 20)) {
      const idx = pm.index ?? 0;
      const context = stripped.substring(Math.max(0, idx - 150), idx + 30);
      const headingM = context.match(/(?:^|[\n.!?])\s*([A-Z][^$€£\n.!?]{3,50})\s*$/);
      if (headingM) {
        const name = headingM[1].trim();
        const blockStart = Math.max(0, html.indexOf(name) - 400);
        const blockEnd = Math.min(html.length, html.indexOf(name) + 400);
        const block = html.substring(blockStart, blockEnd);
        const imgM = block.match(/<img[^>]+src=["']([^"']+)["']/i);
        const imgUrl = imgM ? resolveUrl(imgM[1], base) : null;
        addService(name, pm[0], null, imgUrl);
      }
    }
  }

  return services.slice(0, 20);
}

// ─── Phase 1 : Website scraping ───────────────────────────────────────────────

async function scrapeWebsite(website) {
  let html = null;
  const outFile = '/tmp/scrapling_enrich.html';

  // Try scrapling (headless, handles JS-rendered pages)
  try {
    const escaped = website.replace(/'/g, "'\\''");
    execSync(
      `scrapling extract fetch '${escaped}' ${outFile} --headless --disable-resources 2>/dev/null`,
      { timeout: 30000, encoding: 'utf8' }
    );
    html = fs.readFileSync(outFile, 'utf8');
    try { fs.unlinkSync(outFile); } catch {}
  } catch {}

  // Fallback: plain HTTP
  if (!html || html.length < 200) {
    try {
      const resp = await fetchUrl(website, 10000);
      if (resp && resp.status < 500 && resp.body && resp.body.length >= 200) html = resp.body;
    } catch {}
  }

  if (!html || html.length < 200) return null;

  const base   = website;
  const result = {};

  // ── Meta tags ──
  const titleM = html.match(/<title[^>]*>([^<]{1,300})<\/title>/i);
  if (titleM) result.website_title = titleM[1].trim();

  const desc = metaContent(html, 'description', 'og:description', 'twitter:description');
  if (desc) result.website_meta_description = desc.substring(0, 1000);

  const kw = metaContent(html, 'keywords');
  if (kw) result.website_meta_keywords = kw.substring(0, 500);

  const ogImg = metaContent(html, 'og:image', 'twitter:image');
  if (ogImg) result.website_meta_image = resolveUrl(ogImg, base);

  const gen = metaContent(html, 'generator');
  if (gen) result.website_meta_generator = gen.substring(0, 200);

  const langM = html.match(/<html[^>]+lang=["']([^"']{2,10})["']/i);
  if (langM) result.website_lang = langM[1].trim();

  // ── Images ──
  result.logo_url       = extractLogo(html, base);
  result.hero_image_url = extractHero(html, base);
  const allImgs = extractImages(html, base);
  if (allImgs.length > 0) {
    result.photo_1    = allImgs[0] || null;
    result.photo_2    = allImgs[1] || null;
    result.all_photos = allImgs.join(',');
  }

  // ── Social ──
  Object.assign(result, extractSocial(html));

  // ── Emails (homepage + up to 2 contact pages) ──
  const contactPages = extractContactPages(html, base);
  const emails = extractEmails(html);

  for (const cpUrl of contactPages.slice(0, 2)) {
    try {
      const cpResp = await fetchUrl(cpUrl, 8000);
      if (cpResp && cpResp.body) {
        for (const e of extractEmails(cpResp.body)) {
          if (!emails.includes(e)) emails.push(e);
        }
      }
    } catch {}
  }

  if (emails.length > 0) {
    result.email     = emails[0];
    result.email_2   = emails[1] || null;
    result.email_3   = emails[2] || null;
    result.email_4   = emails[3] || null;
    result.email_5   = emails[4] || null;
    result.all_emails = emails.join(',');
  }

  // ── Contact pages ──
  if (contactPages.length > 0) {
    result.contact_page_1    = contactPages[0] || null;
    result.contact_page_2    = contactPages[1] || null;
    result.contact_page_3    = contactPages[2] || null;
    result.contact_page_4    = contactPages[3] || null;
    result.contact_page_5    = contactPages[4] || null;
    result.all_contact_pages = contactPages.join(',');
  }

  // ── Phone ──
  const phones = extractPhones(html);
  if (phones.length > 0) result.phone = phones[0];

  // ── Booking links ──
  const bookings = extractBookingLinks(html);
  if (bookings.length > 0) result.booking_links = bookings.join(',');

  // ── Working hours ──
  const hours = extractWorkingHours(html);
  if (hours) result.working_hours = hours;

  // ── Services & prices ──
  const services = await scrapeServices(website, html, base);
  if (services && services.length > 0) result.services = JSON.stringify(services);

  return result;
}

// ─── Phase 2 : Google Maps scraping ──────────────────────────────────────────

async function scrapeGoogleMaps(businessName, city, country) {
  const result = {};

  // Step A — find the Maps listing via a Google Search
  const q = encodeURIComponent(`${businessName} ${city} ${country || ''}`);
  let mapsUrl = null;

  try {
    const searchResp = await fetchUrl(
      `https://www.google.com/search?q=${q}+google+maps&num=5&hl=en`,
      10000,
      { 'Accept-Language': 'en-US,en;q=0.9', 'Accept': 'text/html,application/xhtml+xml' }
    );
    if (searchResp && searchResp.body) {
      // Try to find a direct maps.google.com or google.com/maps link
      const direct = searchResp.body.match(/https?:\/\/(?:www\.)?(?:maps\.google\.com|google\.com\/maps\/place)\/[^"'\s&<>]{10,}/i);
      if (direct) {
        mapsUrl = direct[0].split('"')[0].split("'")[0];
      } else {
        // Try encoded /url?q= redirect
        const enc = searchResp.body.match(/\/url\?q=(https?%3A%2F%2F(?:maps\.google|google\.com%2Fmaps)[^&"'\s]{5,})/i);
        if (enc) mapsUrl = decodeURIComponent(enc[1]);
      }
    }
  } catch {}

  // Step B — fall back to a direct Maps search URL
  if (!mapsUrl) {
    mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(`${businessName} ${city}`)}`;
  }

  // Step C — fetch the Maps page and parse it
  try {
    const mapsResp = await fetchUrl(mapsUrl, 14000, {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml',
    });

    if (!mapsResp || !mapsResp.body || mapsResp.body.length < 500) return result;
    const html     = mapsResp.body;
    const finalUrl = mapsResp.finalUrl || mapsUrl;

    // Store the Maps link
    if (finalUrl && finalUrl.includes('google.com/maps')) result.link = finalUrl;

    // place_id — appears in URL params or embedded JSON
    const placeM = finalUrl.match(/place_id=([^&\s]+)/i)
                || html.match(/"place_id"\s*:\s*"(ChIJ[^"]+)"/i);
    if (placeM) result.place_id = placeM[1];

    // CID
    const cidM = finalUrl.match(/[?&!]cid=(\d{10,})/i)
              || html.match(/"cid"\s*:\s*"?(\d{10,})"?/i);
    if (cidM) result.cid = cidM[1];

    // google_id (0x hex IDs in the URL path)
    const gidM = finalUrl.match(/!1s(0x[0-9a-f]+:[^!]+)/i)
              || html.match(/"google_id"\s*:\s*"([^"]+)"/i);
    if (gidM) result.google_id = gidM[1];

    // reviews_count
    const rcM = html.match(/(\d[\d,]+)\s+(?:review|avis|Rezension|recensione|beoordeling)/i)
             || html.match(/"reviewCount"\s*:\s*"?(\d+)"?/i)
             || html.match(/"userRatingCount"\s*:\s*(\d+)/i);
    if (rcM) result.reviews_count = parseInt(rcM[1].replace(/,/g, ''), 10);

    // reviews_rating
    const rrM = html.match(/"ratingValue"\s*:\s*"?([\d.]+)"?/i)
             || html.match(/"aggregateRating"[^}]{0,200}"ratingValue"\s*:\s*"?([\d.]+)"?/is);
    if (rrM) result.reviews_rating = parseFloat(rrM[1]);

    // is_closed / is_closed_temporarily
    if (/permanently\s+closed|fermé\s+définitivement|dauerhaft\s+geschlossen/i.test(html)) {
      result.is_closed = true;
    } else if (/temporarily\s+closed|fermé\s+temporairement/i.test(html)) {
      result.is_closed_temporarily = true;
    }

    // price_range
    const priceM = html.match(/"price_level"\s*:\s*(\d)/i);
    if (priceM) {
      result.price_range = ['', '$', '$$', '$$$', '$$$$'][parseInt(priceM[1])] || null;
    } else {
      const dolM = html.match(/class="[^"]*mgr77e[^"]*"[^>]*>(\$+)/i) || html.match(/·\s*(\$+)\s*·/);
      if (dolM) result.price_range = dolM[1];
    }

    // main_type / business category
    const typeM = html.match(/"primaryType"\s*:\s*"([^"]{3,60})"/i)
               || html.match(/itemprop=["']description["'][^>]*>([^<]{3,60})<\/span>/i);
    if (typeM) result.main_type = typeM[1].trim();

    // working_hours from schema.org
    const hoursM = html.match(/"openingHoursSpecification"\s*:\s*(\[[\s\S]{10,800}?\])/);
    if (hoursM) result.working_hours = hoursM[1].replace(/\s+/g, ' ').trim().substring(0, 1000);

    // photo from og:image (Maps listing thumbnail)
    const ogImg = metaContent(html, 'og:image');
    if (ogImg && !result.photo_1) result.photo_1 = ogImg;

  } catch { /* Maps scraping failing silently is acceptable */ }

  return result;
}

// ─── Batch fetch ──────────────────────────────────────────────────────────────

async function fetchBatch(limit, deep) {
  const filter = deep
    ? `logo_url=not.is.null&google_id=is.null`
    : `logo_url=is.null`;

  const url = `${SUPABASE_URL}/rest/v1/trym_leads` +
    `?select=id,business_name,website,city,country` +
    `&${filter}&limit=${limit}&order=created_at.asc`;

  const raw = await new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.get({
      hostname: u.hostname,
      path:     u.pathname + u.search,
      headers:  { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    });
    req.on('error', reject);
    req.end();
  });
  return JSON.parse(raw);
}

// ─── Process batch ────────────────────────────────────────────────────────────

async function processBatch(data) {
  let enriched = 0, skipped = 0;

  for (let i = 0; i < data.length; i++) {
    const { id, business_name, website, city, country } = data[i];
    console.log(`\n[${i + 1}/${data.length}] ${business_name} — ${city}, ${country || ''}`);

    try {
      const updates = {};

      // ── Phase 1 : website ──────────────────────────────────────────────────
      if (website) {
        process.stdout.write(`  → Website: ${website} … `);
        const webData = await scrapeWebsite(website);
        if (webData) {
          const filled = Object.keys(webData).filter(k => webData[k]);
          process.stdout.write(`${filled.length} fields\n`);
          Object.assign(updates, webData);
        } else {
          process.stdout.write('no data\n');
        }
      } else {
        console.log('  → No website URL');
      }

      // ── Phase 2 : Google Maps ──────────────────────────────────────────────
      process.stdout.write(`  → Google Maps: "${business_name}" ${city} … `);
      const mapsData = await scrapeGoogleMaps(business_name, city, country);
      const mapsFields = {};
      for (const [k, v] of Object.entries(mapsData)) {
        if (v !== null && v !== undefined && v !== '' && !updates[k]) mapsFields[k] = v;
      }
      const mFilled = Object.keys(mapsFields).filter(k => mapsFields[k]);
      process.stdout.write(`${mFilled.length} fields\n`);
      Object.assign(updates, mapsFields);

      // ── Write to Supabase ──────────────────────────────────────────────────
      // If we still have no logo, use Google's favicon CDN as fallback so the
      // loop termination filter (logo_url IS NULL) stops re-processing this lead.
      if (!updates.logo_url) {
        if (website) {
          try {
            const domain = new URL(website).hostname;
            updates.logo_url = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
          } catch {
            updates.logo_url = 'processed';
          }
        } else {
          updates.logo_url = 'processed';
        }
      }

      const toWrite = Object.fromEntries(
        Object.entries(updates).filter(([, v]) => v !== null && v !== undefined && v !== '')
      );
      // Bump created_at so this lead surfaces in Mission Control (ordered desc)
      toWrite.created_at = new Date().toISOString();

      await supabaseUpdate(id, toWrite);
      console.log(`  ✓ Saved ${Object.keys(toWrite).length} fields`);
      enriched++;

    } catch (e) {
      console.log(`  ✗ Error: ${e.message}`);
      // Mark as processed to prevent infinite loop
      await supabaseUpdate(id, { logo_url: 'processed' }).catch(() => {});
      skipped++;
    }

    await sleep(2500);
  }

  return { enriched, skipped };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args  = process.argv.slice(2);
  const loop  = args.includes('--loop');
  const deep  = args.includes('--deep');
  const limit = parseInt(args.find(a => /^\d+$/.test(a)) || '50', 10);

  let round = 0, totalEnriched = 0, totalSkipped = 0;

  do {
    round++;
    if (loop) console.log(`\n${'─'.repeat(60)}\n[Loop] Round ${round} — fetching up to ${limit} leads…`);
    else      console.log(`Fetching ${limit} leads to enrich${deep ? ' (--deep: maps pass)' : ''}…`);

    let data;
    try { data = await fetchBatch(limit, deep); }
    catch (e) { console.error('Failed to fetch batch:', e.message); break; }

    if (!Array.isArray(data) || data.length === 0) {
      console.log(deep ? 'All leads have google_id. Done.' : 'All leads enriched. Done.');
      break;
    }

    console.log(`Processing ${data.length} leads…`);
    const { enriched, skipped } = await processBatch(data);
    totalEnriched += enriched;
    totalSkipped  += skipped;
    console.log(`\n=== Round ${round} — enriched: ${enriched}, skipped: ${skipped} ===`);

    if (loop && data.length === limit) {
      console.log('[Loop] Pausing 5s before next round…');
      await sleep(5000);
    }
  } while (loop);

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`Total enriched: ${totalEnriched}  |  Total skipped: ${totalSkipped}`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
