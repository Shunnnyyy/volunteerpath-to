# VolunteerPath TO

VolunteerPath TO is a Next.js app that lists Toronto volunteer opportunities for
high school students. The site reads opportunities from Supabase and refreshes
them through a Vercel Cron-powered crawler.

## Local Development

First, run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Create a local `.env.local` before calling the API routes:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
CRON_SECRET=...
```

## Automatic Crawler

The crawler lives in `src/lib/scrapeOpportunities.ts` and runs from
`GET /api/sync`. It fetches official volunteer pages, normalizes each source into
the app's opportunity shape, upserts rows into `volunteer_opportunities`, and
marks stale scraped rows inactive.

Vercel runs the crawler every 6 hours from `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/sync",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

In production, `/api/sync` requires either:

- `Authorization: Bearer $CRON_SECRET`
- `/api/sync?secret=$CRON_SECRET` for a manual run

## Supabase Tables

The app expects:

- `volunteer_opportunities`: stores crawled volunteer opportunities.
- `site_stats`: stores the homepage view counter row with key `homepage_views`.

The current Supabase project is `volunteerpath-to`.
