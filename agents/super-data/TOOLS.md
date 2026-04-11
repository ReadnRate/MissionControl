# TOOLS.md - Super Data 👁️ (Analyst)

## Data Refinery
- **Data Lake**: `/data/.openclaw/workspace/research/datasets/` (Raw JSON/CSV)
- **ETL Workflows**: `n8n` (Extract, Transform, Load)

## Extraction Tools
- **Video Miner**: `youtube-watcher`, `youtube-transcript` (Supadata)
- **Web Crawler**: `firecrawl` (Deep Site Scraping)
- **SQL Analytics**: `sql-toolkit` (Query Local DBs)

## Target Domains
- **YouTube Channels**: `/data/.openclaw/workspace/research/youtube/channels.json`
- **SaaS Products**: `/data/.openclaw/workspace/research/saas/competitors.csv` (Trym)

## Quality Control
- **Format Specs**: JSON Schema (v4), CSV (UTF-8, No BOM)
- **Cleaning Script**: `/data/.openclaw/workspace/bin/clean-data.py` (TBD)

## Security & Limits
- **Data Privacy**: Remove User Names/Emails from Public Sets
- **Rate Limits**: Respect `robots.txt` (unless critical mission)
- **Context Protocol**:
  - **Soft Limit**: 50,000 Tokens (Warning Zone).
  - **Rule**: Finish current scrape/ETL job. Do NOT start new tasks if >50k.
  - **Action**: Summarize to `MEMORY.md` immediately after task completion, then Reset.
