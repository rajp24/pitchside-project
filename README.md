# Pitchside Displays

Storefront, customizer, checkout and admin for made-to-order soccer card
display cases. Vanilla HTML/CSS/JS on Vite for the front end, with a couple
of Vercel serverless functions and Upstash Redis behind `/admin` for live
batch-stock tracking. No framework anywhere — vanilla JS throughout.

## Setup

```bash
npm install
npm run dev       # front-end only — /api routes are NOT served, see below
npm run build      # production build to dist/ (main site + /admin)
npm run preview    # preview the production build locally (still no /api)
```

`npm run dev` / `npm run preview` only serve the static Vite output — they
don't run the `/api` serverless functions. To exercise login, the batch
API, or anything under `/admin` locally, use the Vercel CLI instead:

```bash
npm install -g vercel
vercel link       # first time only, links this dir to a Vercel project
vercel env pull   # pulls ADMIN_PASSWORD / Redis env vars down locally
vercel dev
```

Note: session cookies are set with `Secure`, so they won't be stored by the
browser over plain `http://localhost` — `vercel dev` serves http locally, so
a full login round-trip won't persist across requests in local dev. The
API logic itself can still be exercised directly (curl, or a script hitting
the endpoints), and everything works end-to-end once deployed on Vercel's
`https` domain.

## Structure

- `index.html` — main site shell, loads fonts and `src/main.js`
- `admin/index.html` — `/admin` page shell, loads `src/admin.js`
- `src/styles.css` — global reset and base styles only; everything else is
  styled inline in `src/main.js` / `src/admin.js`, matching the source design
- `src/main.js` — public site: app state, render loop, and the home/
  customize/checkout screens
- `src/admin.js` — admin page: password gate, batch panel, orders link
- `api/batch.js` — `GET` (public, cached 60s) / `POST` (admin-only) for the
  live batch count
- `api/login.js` — checks `ADMIN_PASSWORD`, rate-limited 5 attempts / 15 min
  per IP, sets the session cookie
- `api/logout.js` — clears the session, both client-side and in Redis
- `api/_lib/` — shared Redis client, cookie helpers, session helpers
- `public/` — static assets served as-is (images, `robots.txt`)
- `design/` — scratch space for Claude Design canvas exports (see below)

## Backend setup (Upstash Redis + admin password)

The batch count, sessions, and login rate-limiting all live in one Upstash
Redis database, provisioned through the Vercel Marketplace:

```bash
vercel install upstash
```

(or from the Vercel dashboard: Project → Storage → Create Database →
Upstash → Redis). This sets `KV_REST_API_URL` / `KV_REST_API_TOKEN` (or
`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`, depending on how the
integration was added — `api/_lib/redis.js` accepts either pair) on the
Vercel project automatically.

Also set, in the Vercel project's Environment Variables:

- `ADMIN_PASSWORD` — the password for `/admin`. Pick something you wouldn't
  mind rate-limiting a stranger over (5 guesses / 15 min per IP).

Redis holds exactly one piece of real data — `batch:remaining` (an
integer) — plus short-lived session tokens (`session:<token>`, 7-day TTL)
and login rate-limit counters (`loginattempts:<ip>`, 15-minute TTL). Until
an admin logs in and saves a value, `batch:remaining` doesn't exist and the
public site's `/api/batch` reports `0` (sold out) — set the real starting
count from `/admin` right after your first deploy.

## Product photography

Product photos live in `public/images/`. `src/main.js` builds the `SHOTS`
array by pairing `SHOT_LABELS` with `SHOT_FILES` (in order) — add a new
photo by dropping the file into `public/images/` and adding its filename
and label to those two arrays.

## Importing a Claude Design export

1. From the design canvas, export or copy the `.dc.html` file (and any
   files it imports, e.g. `support.js`) into `design/`.
2. Translate the relevant `<x-dc>` markup and `DCLogic` state/render logic
   into `src/main.js` — this repo doesn't run the Design canvas runtime
   directly; each import is hand-translated into plain DOM code.
3. Pull any new copy, layout, or asset references into `src/styles.css` /
   `src/main.js` / `public/` as needed.
4. Zipped exports dropped in `design/` are gitignored (`design/*.zip`) —
   only commit what's actually translated into the app.

## Deploying

Deploys to Vercel — the static site and `/admin` build with `npm run
build` (output `dist/`), and `api/*.js` deploy automatically as serverless
functions. Requires the Redis + `ADMIN_PASSWORD` setup above; without them
`/api/batch`, `/api/login` and `/api/logout` will 500.
