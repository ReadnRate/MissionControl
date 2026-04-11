# TOOLS.md - joe's Tool Configuration

## API Keys (in `/data/.openclaw/workspace/.env`)
| Key | Service | Plan | Rate Limit |
|-----|---------|------|------------|
| `TAVILY_API_KEY` | Tavily Search | Pro | 3000 requests/month |
| `FIRECRAWL_API_KEY` | Firecrawl Scraper | Pro | 5000 credits/month |
| `SUPABASE_URL` | Supabase | - | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | - | Admin access |

## Tool Priority for Web Scraping / Lead Gen
**ALWAYS use in this order — cheapest first:**

1. **`web_search` (Brave API)** — FREE via OpenClaw. Use for Google-scale searches.
   - Rate limit: 2000 queries/month
   - Always try this FIRST before any paid API

2. **`web_fetch`** — FREE via OpenClaw. Use for scraping individual pages.
   - No rate limit (uses OpenClaw infrastructure)
   - Try this SECOND for page content extraction

3. **Tavily API** (`TAVILY_API_KEY`) — Paid but targeted.
   - Use when Brave Search insufficient or for deep search
   - Track monthly usage

4. **Firecrawl** (`FIRECRAWL_API_KEY`) — MOST EXPENSIVE.
   - Use ONLY when web_fetch is blocked by JavaScript/captcha AND Tavily fails
   - Burns credits fast — always check if worth it before calling

## CRITICAL RULES

### Data Fabrication (NEVER DO)
- **NEVER** fabricate leads, names, emails, URLs, or any data
- If a scraper returns incomplete data, mark invalid fields as `null` — don't invent values
- If URL doesn't resolve (HTTP 404/timeout), set `website_url: null` but KEEP the record
- If email format is invalid, do NOT insert — print warning instead

### Rate Limit Protection
- Before calling Firecrawl: check if `web_fetch` can do the same job
- Before calling Tavily: check if `web_search` (Brave) can do the same job
- Log all paid API calls in Supabase `api_usage` table or a local file

### Before Writing Any New Script
1. Check `.env` for available API keys
2. Read relevant skill files in `~/.openclaw/workspace/skills/`
3. Use `web_search` to verify the target site is reachable
4. Print a DRY RUN preview before inserting data to DB

### n8n Configuration (CRITICAL)
**Version**: Community self-hosted (n8n.readnrate.com)
- ❌ Variables d'environnement **NE SONT PAS** disponibles (feat:variables = Enterprise only)
- ✅ Credentials se configurent manuellement dans l'UI n8n
- ✅ Nodes Supabase pré-fabriqués + credentials intégrés = méthode correcte
- ✅ Nodes HTTP Request avec `{{ $env.VAR }}` ne fonctionneront PAS
- **Règle**: Avant de construire un workflow n8n, vérifier la version et demander à Manuel

### Supabase author_leads Table Columns
```
first_name, last_name, email, book_title, genre,
website_url, status, personalization_text, created_at, updated_at
```
- `status` values: 'new', 'contacted', 'replied', 'converted', 'invalid'
- NEVER delete records — mark `status: 'invalid'` instead
