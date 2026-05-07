# Author Reels System — Implementation Spec

**Project**: Mission Control (`mission-control-next/`)
**Stack**: Next.js 16.1.6 (App Router) + React 19 + TypeScript 5 + Tailwind 4 + Supabase JS 2.99 + SWR 2.4
**Supabase Project ID**: `zexumnlvkrjryvzrlavp`
**R2 Bucket**: `readnrate-public` on Cloudflare account `ef08e83e72bbd0f830c11fea2c94b144`
**Public domain**: `https://images.readnrate.com`

---

## Goal

Build an automated motivational reel system for self-published authors:
1. Generate scripts from quotes in `author_quotes` table (via Claude API)
2. Generate videos via HeyGen API
3. Human approval at script and video stages (UI in Mission Control)
4. Schedule posting via Zernio API to IG/FB/TikTok/Pinterest/LinkedIn

**Cadence**: 3 reels/week. Human spends ~15 min/week reviewing.

---

## What's Already Done (DB)

You don't need to create these — they exist in Supabase project `zexumnlvkrjryvzrlavp`:

**Tables:**
- `author_quotes` (237 rows, all status='approved', linked to authors via author_id)
- `authors` (79 rows, all enriched with intro_hook, hidden_story, self_pub_relevant)
- `system_prompts` (4 prompts: script v2, captions for IG/FB/TT, LinkedIn, Pinterest)
- `reel_publications` (per-platform per-quote tracking)

**Workflow status flow on author_quotes:**
```
approved → script_pending → script_approved → 
video_pending → video_approved → scheduled → posted
                            ↘ rejected (any step)
```

**Helper views:**
- `quotes_with_author_context` — JOIN of quotes + author bio data
- `scripts_to_review` — quotes with `status='script_pending'`
- `videos_to_review` — quotes with `status='video_pending'`
- `scheduled_reels` — quotes with `status='scheduled'`
- `quotes_stock_summary` — counts per theme per status

**Helper functions:**
- `generate_r2_key_for_quote(quote_id)` → `author-quotes/reels/YYYY/MM/YYYY-MM-DD-author-theme.mp4`
- `generate_public_url_for_quote(quote_id)` → full https URL on images.readnrate.com

---

## What You Need to Build

### Phase 1: Foundation

#### 1.1 Add server-side Supabase client

Create `src/lib/supabase-admin.ts`:

```ts
import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY missing');
}

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
```

**Important**: Only import this in API routes (server-side). Never in client components.

#### 1.2 Generate TypeScript types

Run from `mission-control-next/`:
```bash
npx supabase gen types typescript \
  --project-id zexumnlvkrjryvzrlavp \
  > src/lib/database.types.ts
```

Use these types in all queries.

#### 1.3 Add shadcn/ui

```bash
cd mission-control-next
npx shadcn@latest init
npx shadcn@latest add button card dialog textarea input label \
  badge select calendar popover toast
```

Use shadcn components for the new UI (matches the `frontend-design` skill conventions).

#### 1.4 Environment variables

Add to `.env.local` and Vercel project settings:
```
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=...
HEYGEN_API_KEY=...
HEYGEN_AVATAR_ID=...    (Manu will provide)
HEYGEN_VOICE_ID=...     (Manu will provide)
HEYGEN_WEBHOOK_SECRET=... (generate random, store in HeyGen webhook config)
ZERNIO_API_KEY=...
R2_ACCOUNT_ID=ef08e83e72bbd0f830c11fea2c94b144
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=readnrate-public
DISCORD_WEBHOOK_URL=...  (optional, for notifications)
CRON_SECRET=...          (random, used to auth Vercel Cron)
```

---

### Phase 2: API Routes

All API routes go in `src/app/api/reels/`.

#### 2.1 `POST /api/reels/generate-script`

**Trigger**: User clicks "Generate Script" button on an approved quote.

**Body**: `{ quoteId: string }`

**Logic**:
1. Fetch quote + author context from view `quotes_with_author_context`
2. Fetch active prompt where `key='reel_script_generator_v2'` from `system_prompts`
3. Call Anthropic API with that prompt as system, build user message from inputs
4. Save response to `author_quotes.script`, update `status='script_pending'`, set `script_generated_at=now()`, increment `regeneration_count`
5. Return `{ script: string, wordCount: number }`

**Anthropic call details:**
- Use `@anthropic-ai/sdk` (install if missing: `npm i @anthropic-ai/sdk`)
- Model: `claude-opus-4-5` (or whatever's in `system_prompts.model`)
- Temperature: from `system_prompts.temperature`
- Max tokens: from `system_prompts.max_tokens`

**User message format**:
```
author: {author}
quote: "{quote}"
theme: {theme}
source: {source}
intro_hook: {intro_hook}
hidden_story: {hidden_story}
self_pub_relevant: {self_pub_relevant}
self_pub_story: {self_pub_story or "n/a"}
```

#### 2.2 `POST /api/reels/regenerate-script`

Same as `/generate-script` but accepts `{ quoteId, feedback?: string }`. If `feedback` provided, append to user message: `"Previous attempt feedback: {feedback}. Try again with this in mind."`

#### 2.3 `POST /api/reels/approve-script`

**Body**: `{ quoteId: string, editedScript?: string }`

**Logic**:
1. If `editedScript` provided, save it to `author_quotes.script` first
2. Update `status='script_approved'`, set `script_approved_at=now()`
3. Return success

#### 2.4 `POST /api/reels/generate-video`

**Trigger**: User clicks "Generate Video" on a script-approved quote.

**Body**: `{ quoteId: string }`

**Logic**:
1. Fetch quote with approved script
2. Call HeyGen API (see HeyGen section below)
3. Save `heygen_video_id` to `author_quotes`, set `status='video_pending'`, `video_generated_at=now()`
4. Return `{ heygenVideoId: string }`

**HeyGen call**:
```
POST https://api.heygen.com/v3/video-agents
Headers:
  X-Api-Key: {HEYGEN_API_KEY}
  Content-Type: application/json

Body:
{
  "prompt": "{script}",
  "avatar_id": "{HEYGEN_AVATAR_ID}",
  "voice_id": "{HEYGEN_VOICE_ID}",
  "aspect_ratio": "9:16",
  "callback_url": "https://{vercel-domain}/api/reels/heygen-webhook",
  "callback_secret": "{HEYGEN_WEBHOOK_SECRET}"
}
```

If HeyGen doesn't support `callback_url` natively, poll status in a separate API route — but try webhook first, it's cleaner.

#### 2.5 `POST /api/reels/heygen-webhook`

**Trigger**: HeyGen calls this when video generation completes.

**Auth**: Verify `X-HeyGen-Secret` header matches `HEYGEN_WEBHOOK_SECRET`. Reject with 401 otherwise. **Critical for security**.

**Body** (HeyGen format): something like `{ video_id, status, video_url, duration }`

**Logic**:
1. Find `author_quotes` row where `heygen_video_id = body.video_id`
2. If status is "completed":
   - Download MP4 from `video_url`
   - Generate R2 key via SQL: `select generate_r2_key_for_quote(quote_id)`
   - Upload MP4 to R2 bucket `readnrate-public` at that key (use `@aws-sdk/client-s3` configured for R2)
   - Get public URL via `select generate_public_url_for_quote(quote_id)`
   - Update `author_quotes`: `r2_video_url`, `r2_video_key`, `status='video_pending'` (awaiting human approval)
   - Optional: Discord webhook ping
3. If status is "failed":
   - Update `status='rejected'`, `rejection_reason=heygen error`
   - Discord ping

**R2 upload pattern** (with `@aws-sdk/client-s3`):
```ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

await r2.send(new PutObjectCommand({
  Bucket: 'readnrate-public',
  Key: r2Key,
  Body: videoBuffer,
  ContentType: 'video/mp4',
}));
```

#### 2.6 `POST /api/reels/approve-video`

**Body**: 
```ts
{ 
  quoteId: string, 
  scheduledFor: string, // ISO datetime
  platforms: ('instagram'|'facebook'|'tiktok'|'pinterest'|'linkedin')[]
}
```

**Logic**:
1. For each platform, generate caption (see captions below)
2. Insert row in `reel_publications` for each platform with status='pending'
3. Update `author_quotes.status='scheduled'`, `scheduled_for`, `scheduled_platforms`, `video_approved_at=now()`

**Caption generation**: Loop through platforms, fetch the matching prompt key from `system_prompts`, call Claude API. For Pinterest, parse JSON output to get title + description.

#### 2.7 `POST /api/reels/reject` (any stage)

**Body**: `{ quoteId, reason: string }`

Sets `status='rejected'`, `rejection_reason`, `rejected_at`. Frontend will offer "Pick another quote" or "Regenerate" buttons depending on which stage rejected from.

#### 2.8 `GET /api/cron/publish-scheduled-reels`

**Auth**: Check `Authorization: Bearer {CRON_SECRET}` header. Reject otherwise.

**Trigger**: Vercel Cron, runs every hour.

**Logic**:
1. Find rows in `reel_publications` where `status='pending'` AND `scheduled_for <= now()`
2. For each row:
   - Set status to `'posting'`
   - Get the public R2 URL of the video
   - Get the caption for that platform
   - Call Zernio API to post to that platform
   - On success: status='published', set `zernio_post_id`, `platform_post_url`, `published_at`
   - On failure: status='failed', set `error_message`, increment `retry_count` (max 3 retries handled in next cron run)
3. After all platforms for a quote are done (success or fail), update `author_quotes.status='posted'` if at least one succeeded
4. Discord ping with summary

**Zernio API call** (verify exact format in their docs):
```
POST https://zernio.com/api/v1/posts (or whatever the actual endpoint is)
Headers: 
  Authorization: Bearer {ZERNIO_API_KEY}

Body:
{
  "platform": "instagram",
  "media_url": "https://images.readnrate.com/author-quotes/reels/...",
  "caption": "...",
  "scheduled_at": null  // post immediately
}
```

#### 2.9 Configure Vercel Cron

Create or update `vercel.json` at repo root (or inside `mission-control-next` if that's the deploy root):

```json
{
  "crons": [
    {
      "path": "/api/cron/publish-scheduled-reels",
      "schedule": "0 * * * *"
    }
  ]
}
```

---

### Phase 3: UI Pages

All under `src/app/reels/`. Match the look and feel of existing pages (`src/app/page.tsx`, `src/app/tasks/`, etc.). Use SWR for data fetching, shadcn for components.

#### 3.1 `/reels` — Dashboard

**Purpose**: Quick stats and entry points.

**Show**:
- Stock by status (counts from `quotes_stock_summary`)
- "Generate scripts for this week" button (lets user pick 3 random approved quotes and kick off script generation)
- Recent activity feed (last 10 reels, any status)
- Links to /reels/scripts, /reels/videos, /reels/calendar

#### 3.2 `/reels/scripts` — Approve Scripts

**Data source**: `scripts_to_review` view via SWR.

**For each script, show**:
- Author name + intro_hook (small)
- Quote (italicized)
- Generated script in an **editable textarea**
- Word count badge (green if 75-85, yellow if 60-100, red otherwise — use the auto-computed `script_word_count` column for the warning)
- Buttons:
  - **Approve & Save** (calls `approve-script` with potentially edited text)
  - **Regenerate** (opens dialog asking for optional feedback, calls `regenerate-script`)
  - **Reject** (opens dialog for reason, calls `reject`)

**UX detail**: When user types in the textarea, debounce a "would-be word count" preview update so they see live feedback.

#### 3.3 `/reels/videos` — Approve Videos

**Data source**: `videos_to_review` view via SWR.

**For each video, show**:
- Author name + theme + quote (small recap)
- Video player (HTML5 `<video>` with `src={r2_video_url}`)
- Approval form:
  - Date/time picker (default: next available Mon/Wed/Fri 9am)
  - Platforms checkboxes (default: all 5 checked)
  - **Approve & Schedule** button → calls `approve-video`
  - **Reject & Regenerate Video** button → calls `reject` with stage hint, frontend then offers to call `generate-video` again
  - **Reject & Pick Another Quote** button

**UX detail**: Show captions preview after user clicks Approve, before final commit. So they can edit captions per platform if they want.

#### 3.4 `/reels/calendar` — Scheduled & History

**Data source**: `scheduled_reels` view + `reel_publications` joined.

**Show**:
- Calendar view (use shadcn Calendar component) with dots on dates having posts
- List below: upcoming scheduled posts grouped by date
- Toggle to view "Posted" history with platform badges per row

For each scheduled item, allow:
- Reschedule (date picker)
- Cancel (sets status='rejected')

---

### Phase 4: Testing Plan

Before merging to main:

1. **DB connection test**: Hit `/api/reels/dashboard-stats` (you'll create a tiny GET endpoint), verify it queries `quotes_stock_summary`
2. **Script generation test**: Pick 1 quote, generate script, verify saved with correct word count
3. **HeyGen test**: Pick 1 approved script, generate video. Verify webhook fires, MP4 lands in R2 at the correct path, public URL returns 200
4. **Caption test**: Approve a video, check that 5 rows appear in `reel_publications` with appropriate captions per platform
5. **Cron test**: Manually invoke `/api/cron/publish-scheduled-reels` with the bearer token, verify it picks up scheduled rows (use a test scheduled_for in the past)
6. **Full E2E**: One quote, all the way from `approved` → `posted` on at least Instagram

---

### Phase 5: PR Strategy

Open small, focused PRs in this order. Each should be reviewable in <10 min.

1. **PR 1**: Foundation (Supabase admin client + types + shadcn install + env vars docs in README)
2. **PR 2**: API routes for script generation (`generate-script`, `regenerate-script`, `approve-script`, `reject`)
3. **PR 3**: `/reels/scripts` UI page
4. **PR 4**: API routes for video generation (`generate-video`, `heygen-webhook`)
5. **PR 5**: `/reels/videos` UI page
6. **PR 6**: API routes for scheduling + Vercel Cron (`approve-video`, cron handler, `vercel.json`)
7. **PR 7**: `/reels/calendar` UI page
8. **PR 8**: `/reels` dashboard page
9. **PR 9**: Polish (Discord webhooks, error handling improvements, retry logic on failed Zernio posts)

For each PR:
- Branch naming: `feat/reels-{phase}`
- Test the API routes manually with curl before opening PR
- Include screenshots in PR description for UI work

---

## Open Questions for Manu (ask before coding)

1. **HeyGen avatar_id and voice_id**: What are they? (Required for `.env.local`)
2. **Zernio API**: Do you have docs link or examples of API calls? Format may differ from what I assumed.
3. **Vercel deploy root**: Is `mission-control-next/` the deploy root in Vercel, or is the whole repo? Affects where `vercel.json` lives.
4. **Discord channel**: Which channel should success/failure pings go to? Webhook URL?
5. **Default schedule slot**: Mon/Wed/Fri 9am EST is what we said. Confirm timezone.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│  USER (Manu) — opens /reels/scripts                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│  Next.js App (mission-control-next on Vercel)           │
│                                                          │
│  Pages:                                                  │
│    /reels/scripts   → reads scripts_to_review (SWR)     │
│    /reels/videos    → reads videos_to_review (SWR)      │
│    /reels/calendar  → reads scheduled_reels (SWR)       │
│                                                          │
│  API Routes:                                             │
│    /api/reels/generate-script  → Anthropic API          │
│    /api/reels/generate-video   → HeyGen API             │
│    /api/reels/heygen-webhook   ← HeyGen callback        │
│    /api/reels/approve-video    → captions + DB          │
│    /api/cron/publish-scheduled-reels → Zernio (hourly)  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│  Supabase (zexumnlvkrjryvzrlavp)                        │
│   author_quotes, authors, system_prompts,               │
│   reel_publications + helper views/functions            │
└─────────────────────────────────────────────────────────┘
                 │
                 ↓ (after webhook downloads MP4)
┌─────────────────────────────────────────────────────────┐
│  Cloudflare R2 (readnrate-public)                       │
│  Path: author-quotes/reels/YYYY/MM/*.mp4                │
│  Public: https://images.readnrate.com/...               │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓ (cron pulls URL, sends to Zernio)
┌─────────────────────────────────────────────────────────┐
│  Zernio → IG / FB / TikTok / Pinterest / LinkedIn       │
└─────────────────────────────────────────────────────────┘
```

---

## Key Coding Conventions

- TypeScript strict, no `any` (use proper Supabase generated types)
- API routes return `NextResponse.json({...})` with proper status codes
- Validate all inputs with zod before DB writes (install: `npm i zod`)
- Errors: log to console.error AND return useful error message to client (never leak secrets)
- All Supabase admin queries from server only — never expose service role key
- File names: kebab-case for routes, PascalCase for components
- Use `'use client'` only when needed (forms, interactive); pages should be server components by default

---

## Start Here

1. Read this entire spec
2. Read the existing `src/app/page.tsx`, `src/app/layout.tsx`, `src/components/Sidebar.tsx`, `src/lib/supabase.ts` to understand conventions
3. Ask Manu the open questions above
4. Begin Phase 1 (foundation)
5. Open PR 1 when done, wait for review before proceeding to Phase 2
