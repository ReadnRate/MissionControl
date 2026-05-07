This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Environment Variables

Local development uses `.env.local` (gitignored). The same keys must be set in the Vercel project settings for production.

### Required (always)

| Var | Used by | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Public Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | Anon (RLS-bound) key |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Bypasses RLS. **Never** import `src/lib/supabase-admin.ts` from a client component |

### Required for Author Reels (`src/app/reels/`, `src/app/api/reels/`)

| Var | Phase | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | Script generation | Claude API key |
| `HEYGEN_API_KEY` | Video generation | HeyGen v3 API key |
| `HEYGEN_AVATAR_ID` | Video generation | HeyGen avatar to use |
| `HEYGEN_VOICE_ID` | Video generation | HeyGen voice to use |
| `HEYGEN_WEBHOOK_SECRET` | Video webhook | Random string; must match HeyGen webhook config |
| `R2_ACCOUNT_ID` | Video upload | `ef08e83e72bbd0f830c11fea2c94b144` |
| `R2_ACCESS_KEY_ID` | Video upload | Cloudflare R2 token |
| `R2_SECRET_ACCESS_KEY` | Video upload | Cloudflare R2 secret |
| `R2_BUCKET` | Video upload | `readnrate-public` |
| `ZERNIO_API_KEY` | Scheduled posting | |
| `CRON_SECRET` | Cron auth | Random; sent as `Authorization: Bearer <secret>` |
| `DISCORD_WEBHOOK_URL` | Notifications | Optional |

## Generating Supabase types

`src/lib/database.types.ts` is generated. Regenerate after schema changes:

```bash
npx supabase gen types typescript --project-id zexumnlvkrjryvzrlavp > src/lib/database.types.ts
```

(Or use the Supabase MCP `generate_typescript_types` tool.)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
