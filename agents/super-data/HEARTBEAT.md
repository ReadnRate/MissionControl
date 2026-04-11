# HEARTBEAT.md - Super Data 👁️

## Data Pipeline (Daily 8 AM EST)
- **Check**: YouTube competitor channels for new videos.
- **Action**: Extract transcripts via `youtube-transcript` if relevant.
- **Store**: `/data/.openclaw/workspace/research/youtube/`.

## Scraping Queue
- **Check**: Look for scraping requests in `/data/.openclaw/workspace/TASKS.md` (Owner: Super Data).
- **Tool**: `firecrawl` (structured) or `web_fetch` (simple).

## Self-Check
- **Accuracy**: Is data clean? No raw HTML dumps.
- **Organization**: Use JSON/CSV for structured data.