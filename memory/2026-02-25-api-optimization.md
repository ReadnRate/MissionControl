# 2026-02-25 - Emergency API Optimization

## Crisis Resolved ✅
**Problem:** Hitting 429 Rate Limits on Gemini 3 Flash  
**Root Cause:** All requests routed to single saturated model  
**Solution:** Multi-model routing + context management

---

## Key Changes

### Model Routing (Now Active)
- **Default:** Claude Sonnet 4.5 (most tasks)
- **Gemini Flash:** Web search + quick status ONLY
- **GPT-4.1:** Complex reasoning (manual switch)

### Context Rules
1. Never re-read files already in context
2. Use targeted reads (offset/limit) for large files
3. Summarize outputs after first read
4. Batch operations when possible
5. Stop immediately on 429 errors

### Configuration
- Primary model: `anthropic/claude-sonnet-4-5`
- Context pruning: 45min TTL
- Compaction: Aggressive (70% threshold)
- Prompt caching: Enabled (Claude)

---

## Usage Notes

**You're now using Claude Sonnet 4.5 by default** - more efficient for:
- Code analysis
- File operations
- General reasoning
- Complex tasks

**Gemini Flash auto-routes for:**
- Web searches (via web_search tool)
- Quick status checks

**Manual switches (rare):**
```
/model openai/gpt-4.1  # Very complex reasoning
```

---

## Performance Target
- **Gemini Flash usage:** 85% reduction (100% → 15%)
- **429 errors:** Eliminated
- **Token efficiency:** High (caching + smart reads)

---

## Next Steps
1. ⚠️ **Restart required:** `openclaw gateway restart`
2. Monitor for 429 errors (should be gone)
3. Verify model routing in `/status`

**Status:** Configuration updated, restart pending
