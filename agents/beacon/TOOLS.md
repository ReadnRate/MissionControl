# TOOLS.md - Beacon 📡 (Research)

## Intelligence Network
- **Research Hub**: `/data/.openclaw/workspace/research/daily/`
- **Search Engines**: `google/gemini-3-flash-preview` (Default), `Tavily` (Deep Search)
- **Competitors List**: `/data/.openclaw/workspace/research/competitors.json`

## Analysis Tools
- **Market Scraper**: `firecrawl` (URL -> Markdown)
- **Video Transcript**: `youtube-transcript` (Supadata)
- **SEO Analyzer**: `seo-competitor-analysis` (Site Metrics)

## Data Storage
- **Knowledge Base**: `/data/.openclaw/workspace/research/`
- **Topic Clusters**: KDP News, Book Marketing, Fire Safety (GCA), White-Label SaaS (Trym)
- **Morning Brief Template**: `/data/.openclaw/workspace/research/morning-brief-template.md`

## Protocols
- **Source Verification**: Check 3 Sources (Minimum)
- **Data Cleanup**: Remove PII, Remove Duplicates
- **Access Limits**: `read`, `write` (Research Dirs Only)
- **Context Protocol**:
  - **Soft Limit**: 50,000 Tokens (Warning Zone).
  - **Rule**: Finish current research topic. Do NOT start new tasks if >50k.
  - **Action**: Summarize to `MEMORY.md` immediately after task completion, then Reset.
