# SANJHA — Village Farms as One

Hackathon-ready full-stack prototype: premium glassmorphic UI (Tailwind + Framer Motion + Radix primitives), **Next.js App Router** (scaffolded with the current `create-next-app` toolchain — **Next 16** in this repo; you can pin `next@15` if you need an exact major), **Supabase-ready** clients, **PWA** service worker, **IndexedDB** offline queue, **React Leaflet** cluster map, **Recharts** dashboards, **Web Speech** voice copilot, and API routes for **AI**, **OpenWeatherMap**, and **Twilio** stubs.

## Quick start

```bash
cd agro
cp .env.example .env.local   # optional: fill keys for live integrations
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the cinematic landing page; use **Open app** or `/dashboard` for the product shell.

## Environment variables

See `.env.example`. The app runs **without** any keys: AI falls back to multilingual demo strings, weather returns demo JSON, SMS returns `501` until Twilio is configured, and Supabase auth shows a hint on `/login`.

## Database

`supabase/schema.sql` defines PostgreSQL tables (`users`, `farms`, `crops`, `harvests`, `marketplace_listings`, `bids`, `community_posts`, `soil_reports`, `notifications`, `ratings`) with RLS enabled. Paste into the Supabase SQL editor, then set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Deploy to Vercel

1. Push this folder to GitHub/GitLab/Bitbucket.
2. In [Vercel](https://vercel.com), **Import** the repository; framework preset **Next.js**.
3. Add the same environment variables as `.env.example` in **Project → Settings → Environment Variables**.
4. Deploy. PWA `manifest.json` and `/sw.js` are served from `public/`.

## Project layout (high level)

- `src/app/` — routes: landing `/`, app pages under `(app)/`, API routes under `api/`.
- `src/components/` — UI primitives, `AppShell`, map, voice copilot.
- `src/lib/` — Supabase helpers, IndexedDB offline store, i18n, soil heuristics, demo data.
- `public/manifest.json`, `public/sw.js` — PWA shell and offline caching (minimal; extend for production).

## Scripts

- `npm run dev` — development server  
- `npm run build` — production build  
- `npm run start` — run production build locally  
- `npm run lint` — ESLint  

## Note on workspace root warning

If Next warns about multiple `package-lock.json` files (e.g. one in your user folder and one in this project), run commands from **this** directory or remove the stray lockfile outside the project so Turbopack resolves the correct root.
