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

The Claude Design export (`design/Pitchside Displays.dc.html`) referenced
photos that live in the design canvas, not in this repo. Until real photos
are supplied, `src/main.js` generates labeled placeholder images at
runtime (`placeholderShot()`) so the gallery, hero and admin thumbnails all
render correctly. To swap in real photos:

1. Drop the image files into `public/images/`.
2. In `src/main.js`, replace the `SHOTS` array (built from `SHOT_LABELS` +
   `placeholderShot()`) with entries pointing at `/images/your-file.jpg`.

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
