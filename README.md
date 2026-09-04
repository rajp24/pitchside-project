# Pitchside Displays

Storefront, customizer, checkout and admin mockup for made-to-order soccer
card display cases. Vanilla HTML/CSS/JS on Vite — no framework, no build-time
dependencies beyond Vite itself.

## Setup

```bash
npm install
npm run dev       # start the dev server
npm run build      # production build to dist/
npm run preview    # preview the production build locally
```

## Structure

- `index.html` — page shell, loads fonts and `src/main.js`
- `src/styles.css` — global reset and base styles only; everything else is
  styled inline in `src/main.js`, matching the source design
- `src/main.js` — app state, render loop, and all four screens (home,
  customize, checkout, admin)
- `public/` — static assets served as-is
- `design/` — scratch space for Claude Design canvas exports (see below)

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

Static build, no server required — Vercel, Netlify, or any static host
works. Build command `npm run build`, output directory `dist`.
