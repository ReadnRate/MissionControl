#!/usr/bin/env node
/**
 * enrich-trym-leads.js
 * Enriches trym_leads with: logo_url, hero_image_url, facebook, instagram, google_business_url, services, reviews, photos
 * Usage: node enrich-trym-leads.js [limit=50]
 */
const { execSync } = require('child_process');
const fs = require('fs');
const https = require('https');
const http = require('http');

const SUPABASE_URL = 'https://zexumnlvkrjryvzrlavp.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM';

// ─── Helpers ────────────────────────────────────────────────────────────────

function fetchUrl(url, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, { timeout: timeoutMs, headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(fetchUrl(res.headers.location, timeoutMs));
      } else {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => resolve({ status: res.statusCode, body }));
      }
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('TIMEOUT')); });
    req.on('error', reject);
  });
}

function extractImages(html) {
  const seen = new Set();
  const imgs = [];
  for (const m of html.matchAll(/<img[^>]+src="([^"]+)"/gi)) {
    const s = m[1];
    if (!s.startsWith('data:') && !s.includes('sprite') && !s.includes('icon') && !s.includes('1x1') && !seen.has(s)) {
      seen.add(s);
      imgs.push(s);
    }
  }
  return imgs.slice(0, 15);
}

function extractHero(html) {
  // og:image first
  const og = html.match(/<meta property="og:image"[^>]*content="([^"]+)"/i);
  if (og) return og[1];
  // Then hero candidates
  const imgs = [...html.matchAll(/<img[^>]+src="([^"]+)"/gi)].map(m => m[1]);
  const hero = imgs.find(s => s.match(/hero|banner|slider|main|showcase|IMG_|slide/i));
  return hero || (imgs.length ? imgs[0] : null);
}

function extractLogo(html) {
  const imgs = [...html.matchAll(/<img[^>]+src="([^"]+)"/gi)].map(m => m[1]);
  const logo = imgs.find(s => s.match(/logo/i));
  if (logo) return logo;
  const fav = html.match(/<link[^>]+rel="(?:shortcut )?icon"[^>]*href="([^"]+)"/i);
  if (fav) return fav[1].startsWith('http') ? fav[1] : null;
  return null;
}

function scrapeWebsite(website) {
  return new Promise((resolve) => {
    const outFile = '/tmp/scrapling_enrich.html';
    const escaped = website.replace(/'/g, "'\\''");
    const cmd = `scrapling extract fetch '${escaped}' ${outFile} --headless --disable-resources 2>/dev/null`;

    let html;
    try {
      execSync(cmd, { timeout: 30000, encoding: 'utf8' });
      html = fs.readFileSync(outFile, 'utf8');
      fs.unlinkSync(outFile);
    } catch (e) {
      // fallback: plain HTTP fetch
      fetchUrl(website, 8000).then(resp => {
        if (!resp || resp.status >= 500) return resolve(null);
        html = resp.body;
        if (!html || html.length < 200) return resolve(null);
        finish(html, website);
      }).catch(() => resolve(null));
      return;
    }

    finish(html, website);

    function finish(html, website) {
      if (!html || html.length < 200) { resolve(null); return; }

      const allImgs = extractImages(html);
      const heroImage = extractHero(html);
      const logoUrl = extractLogo(html);
      const fb = html.match(/facebook\.com\/([^/?\s"']+)/i);
      const ig = html.match(/instagram\.com\/([^/?\s"']+)/i);

      resolve({
        logo_url: logoUrl,
        hero_image_url: heroImage,
        facebook: fb ? `https://facebook.com/${fb[1]}` : null,
        instagram: ig && !['sharer','shares','plugins'].includes(ig[1]) ? `https://instagram.com/${ig[1]}` : null,
        photos: allImgs.length > 0 ? allImgs.slice(0, 5) : null
      });
    }
  });
}

async function googleSearchFallback(businessName, city) {
  try {
    const query = encodeURIComponent(`${businessName} ${city} hair salon`);
    const resp = await fetchUrl(`https://www.google.com/search?q=${query}&num=3`, 8000);
    const m = resp.body.match(/href="(\/url\?q=https?:\/\/[^"&]+)/);
    if (m) {
      const destUrl = decodeURIComponent(m[1].replace('/url?q=', '').split('&')[0]);
      return { google_business_url: destUrl };
    }
  } catch (e) {}
  return {};
}

async function supabaseUpdate(id, data) {
  const body = JSON.stringify(data);
  const url = new URL(`${SUPABASE_URL}/rest/v1/trym_leads?id=eq.${id}`);
  return new Promise((resolve) => {
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'PATCH',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'Content-Length': Buffer.byteLength(body),
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(d));
        } else {
          console.log(`  PATCH error ${res.statusCode}:`, d.substring(0, 100));
          resolve(null);
        }
      });
    });
    req.on('error', e => { console.log('  PATCH error:', e.message); resolve(null); });
    req.write(body);
    req.end();
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function fetchBatch(limit) {
  const url = `${SUPABASE_URL}/rest/v1/trym_leads?select=id,business_name,website,city&logo_url=is.null&limit=${limit}&order=created_at.asc`;
  const raw = await new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.get({
      hostname: u.hostname, path: u.pathname + u.search,
      headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d)); });
    req.on('error', reject); req.end();
  });
  return JSON.parse(raw);
}

async function processBatch(data) {
  let enriched = 0, skipped = 0;

  for (let i = 0; i < data.length; i++) {
    const lead = data[i];
    const { id, business_name, website, city } = lead;
    process.stdout.write(`\n[${i+1}/${data.length}] ${business_name} `);

    try {
      let result;
      if (website) {
        process.stdout.write(`[scraping ${website}] `);
        result = await scrapeWebsite(website);
      }

      if (!result || Object.values(result).every(v => !v)) {
        process.stdout.write('[search fallback] ');
        const fbResult = await googleSearchFallback(business_name, city);
        result = { ...result, ...fbResult };
      }

      const updates = {};
      for (const [k, v] of Object.entries(result || {})) {
        if (v) updates[k] = v;
      }

      if (Object.keys(updates).length > 0) {
        await supabaseUpdate(id, updates);
        const keys = Object.keys(updates).join(', ');
        process.stdout.write(`✓ ${keys}\n`);
        enriched++;
      } else {
        process.stdout.write('⚠ no data found\n');
        skipped++;
      }
    } catch (e) {
      process.stdout.write(`✗ ${e.message}\n`);
      skipped++;
    }

    // Rate limit between requests
    await new Promise(r => setTimeout(r, 2000));
  }

  return { enriched, skipped };
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args  = process.argv.slice(2);
  const loop  = args.includes('--loop');
  const limit = parseInt(args.find(a => /^\d+$/.test(a)) || '50');

  let round = 0;
  let totalEnriched = 0;
  let totalSkipped  = 0;

  do {
    round++;
    if (loop) console.log(`\n${'─'.repeat(50)}\n[Loop] Round ${round} — fetching up to ${limit} leads…`);
    else      console.log(`Fetching ${limit} leads with logo_url=is.null...`);

    let data;
    try {
      data = await fetchBatch(limit);
    } catch (e) {
      console.log('Failed to fetch leads:', e.message);
      break;
    }

    if (!Array.isArray(data) || data.length === 0) {
      console.log('All leads already enriched! Done.');
      break;
    }

    console.log(`Processing ${data.length} leads...`);
    const { enriched, skipped } = await processBatch(data);
    totalEnriched += enriched;
    totalSkipped  += skipped;

    console.log(`\n=== Round ${round} done — enriched: ${enriched}, skipped: ${skipped} ===`);

    if (loop && data.length === limit) {
      console.log('[Loop] Pausing 5 s before next round…');
      await new Promise(r => setTimeout(r, 5000));
    }

  } while (loop);

  if (loop) {
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`[Loop] All rounds complete.`);
    console.log(`  Total enriched: ${totalEnriched}`);
    console.log(`  Total skipped:  ${totalSkipped}`);
  } else {
    console.log(`\n=== DONE ===`);
    console.log(`  Enriched: ${totalEnriched}`);
    console.log(`  Skipped:  ${totalSkipped}`);
  }
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
