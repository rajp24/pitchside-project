// Pitchside Displays — storefront, customizer, checkout and admin mockup.
// Implemented from the "Pitchside Displays.dc.html" Claude Design export as a
// plain state -> render() -> DOM loop, no framework.

const CURRENCIES = [
  { code: 'USD', sym: '$', price: 350, ship: 35 },
  { code: 'EUR', sym: '€', price: 335, ship: 55 },
  { code: 'GBP', sym: '£', price: 285, ship: 48 },
];

const FORMATIONS = { '4-3-3': [3, 3, 4, 1] };

const TEAM_OPTIONS = [
  'Team name here', 'Manchester United FC', 'Real Madrid CF', 'FC Barcelona', 'Arsenal FC',
  'Liverpool FC', 'Chelsea FC', 'FC Bayern München', 'Paris Saint-Germain', 'AC Milan',
  'Inter Milan', 'Borussia Dortmund', 'Ajax Amsterdam', 'Another club — tell us',
];

const STADIUM_OPTIONS = [
  'Stadium name here', 'Old Trafford', 'Santiago Bernabéu', 'Spotify Camp Nou', 'Emirates Stadium',
  'Anfield', 'Stamford Bridge', 'Allianz Arena', 'Parc des Princes', 'San Siro',
  'Signal Iduna Park', 'Johan Cruijff Arena', 'Another stadium — tell us',
];

const SPECS = [
  { k: 'Outer size', v: '22 in × 32 in' }, { k: 'Slab slots', v: '11' },
  { k: 'Fits', v: 'PSA / ACE / same-size slabs' },
  { k: 'Front', v: 'UV-protected acrylic, hinged' }, { k: 'Boxed weight', v: '~20 lb' },
];

const STEPS = [
  { n: '01', t: 'Pick your club', d: 'Any club, any era. We source the stadium print to match.' },
  { n: '02', t: 'Add the details', d: "Personalized customization requests, including tifos, flags, player names, banners, or any other specific details you'd like featured in the stands." },
  { n: '03', t: 'We build and ship', d: 'Approval mockup first, then a 10-14 business day build and tracked delivery.' },
];

const FAQS = [
  { q: 'What slabs fit?', a: 'PSA and ACE cases, plus anything the same footprint. Slots hold them without tape or glue.' },
  { q: 'Can I change the cards later?', a: 'Yes. The front is hinged, so you swap slabs without dismantling anything.' },
  { q: 'Which clubs can you do?', a: 'Any club we can get a clean stadium image for. Ask us about national teams too.' },
  { q: 'How long does it take?', a: 'Roughly 10-14 business days from approval, depending on the batch.' },
  { q: 'Where do you ship?', a: 'Everything ships from the USA, worldwide on request. Tracked with UPS.' },
];

const CHECKOUT_FIELDS = [
  { label: 'Full name', ph: 'Your name', full: true }, { label: 'Email', ph: 'you@example.com', full: false },
  { label: 'Phone', ph: '(555) 123-4567', full: false }, { label: 'Address', ph: 'Street and number', full: true },
  { label: 'City', ph: 'Chicago', full: false }, { label: 'State / ZIP', ph: 'IL 60601', full: false },
  { label: 'Country', ph: 'United States', full: true },
];

const PAY_METHODS = [
  { name: 'Card', note: 'Visa, Mastercard, Amex — via Shopify Payments' },
  { name: 'Shop Pay', note: 'Pay in 4 interest-free installments' },
  { name: 'PayPal', note: 'Buyer protection included' },
  { name: 'Apple Pay / Google Pay', note: 'One-tap on mobile' },
];

const SHOT_LABELS = [
  'Hinged front, eleven slots ready',
  'Mounted on a mantel',
  'Door open for swapping slabs',
  'Front three only',
  'Closed, empty stadium print',
  'Frame depth and hinge',
];
const SHOT_FILES = [
  '3C67B8AD-57F9-4493-BC18-450166495533.PNG',
  'EC7A3367-A735-4D0B-9CB3-B921471F4DB7.PNG',
  'AD9B18D1-4427-42F6-8EF3-65B63003BEA3.PNG',
  '53910F18-4CC1-4585-8770-9D822D43751E.PNG',
  'BCB54C4C-AD04-4D13-960E-8C95816EA069.PNG',
  'FF6C8EB2-1D6C-4DA1-A14D-29AFA0D423FA.PNG',
];
const SHOTS = SHOT_LABELS.map((label, i) => ({ src: `/images/${SHOT_FILES[i]}`, label }));

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Section entrances fire once. Keys that have already crossed 15%
// visibility render straight into their resting state on every future
// render — no replaying the fade when an unrelated state change (e.g.
// switching currency) rebuilds the whole page.
const revealedSections = new Set();

function revealAttrs(key) {
  const seen = revealedSections.has(key);
  return `class="reveal${seen ? ' is-visible' : ''}" data-reveal="${key}"`;
}

// Shown until /api/batch resolves (or if it fails) — never render an empty
// or collapsed stock line while the real number loads.
const FALLBACK_REMAINING = 12;

let state = {
  screen: 'home',
  gi: 0,
  cur: 0,
  team: 'Team name here',
  stadium: 'Stadium name here',
  formation: '4-3-3',
  extras: { Tifos: true, Flags: true, 'Player names': false },
  notes: '',
  filled: [0, 1, 2, 4, 6, 10],
  pay: 0,
  remaining: FALLBACK_REMAINING,
};

function setState(patch) {
  state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
  render();
}

function money(n) {
  return CURRENCIES[state.cur].sym + n;
}

function soldOut() {
  return state.remaining === 0;
}

function stockLine() {
  return soldOut() ? 'Sold out' : `Only ${state.remaining} left in this batch`;
}

async function fetchBatchRemaining() {
  try {
    const res = await fetch('/api/batch', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    if (Number.isInteger(data.remaining)) {
      setState({ remaining: data.remaining });
    }
  } catch {
    // network error or offline — keep showing the fallback value
  }
}

function configLine() {
  const active = Object.keys(state.extras).filter((k) => state.extras[k]);
  return `${state.team} · ${state.stadium}${active.length ? ' · ' + active.join(', ') : ''}`;
}

// -- markup pieces ----------------------------------------------------------

function topBanner() {
  return `<div style="background:#12120f;color:rgba(255,255,255,.72);font-size:12px;letter-spacing:.06em;text-align:center;padding:9px 16px">Built to order in the USA · handmade in small batches · tracked UPS shipping worldwide</div>`;
}

function header() {
  const nav = [
    ['home', 'Product'],
    ['customize', 'Build yours'],
    ['checkout', 'Checkout'],
  ];
  const navHtml = nav
    .map(
      ([screen, label]) =>
        `<button data-action="nav" data-screen="${screen}" class="nav-link" style="background:none;border:0;padding:6px 0;font-size:14px;color:#12120f;cursor:pointer">${label}</button>`
    )
    .join('');
  return `
  <header style="position:sticky;top:0;z-index:20;background:rgba(243,241,236,.88);backdrop-filter:blur(12px);border-bottom:1px solid rgba(0,0,0,.08)">
    <div style="max-width:1240px;margin:0 auto;padding:16px 32px;display:flex;align-items:center;gap:32px">
      <div style="display:flex;align-items:center;margin-right:8px">
        <img class="fade-img" src="/images/logo-light.png" alt="Pitchside Displays" style="height:60px;width:auto;aspect-ratio:876/719;display:block"/>
      </div>
      <nav style="display:flex;gap:26px;flex:1">
        ${navHtml}
        <a href="/admin" class="nav-link" style="padding:6px 0;font-size:14px;color:rgba(0,0,0,.45)">Admin</a>
      </nav>
      <div style="display:flex;align-items:center;gap:14px">
        <div style="display:inline-flex;align-items:center;gap:7px;background:#b3261e;color:#fff;border-radius:999px;padding:7px 14px 7px 11px;font-family:'Archivo',sans-serif;font-weight:700;font-size:12px;letter-spacing:.04em;text-transform:uppercase;box-shadow:0 1px 8px rgba(179,38,30,.32)">
          <span style="width:7px;height:7px;border-radius:50%;background:#fff;animation:psd-pulse 1.4s ease-in-out infinite"></span>${esc(stockLine())}
        </div>
        <button data-action="nav" data-screen="customize" class="btn-primary" style="color:#fff;border:0;border-radius:999px;padding:11px 22px;font-size:13.5px;font-weight:500;cursor:pointer">Order now</button>
      </div>
    </div>
  </header>`;
}

function footer() {
  return `
  <footer style="background:#12120f;color:#fff;margin-top:auto">
    <div style="max-width:1240px;margin:0 auto;padding:52px 32px 40px;display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr;gap:36px">
      <div>
        <div style="font-family:'Archivo',sans-serif;font-weight:800;font-size:17px;letter-spacing:-.02em;text-transform:uppercase">Pitchside Displays</div>
        <p style="font-size:14px;line-height:1.6;color:rgba(255,255,255,.5);margin:12px 0 0;max-width:32ch">Made-to-order display cases for graded football cards. Built one at a time.</p>
      </div>
      <div>
        <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.4);font-family:'Archivo',sans-serif;font-weight:600;margin-bottom:12px">Contact</div>
        <a href="mailto:pitchsidedisplays@gmail.com" style="display:block;font-size:14px;color:#fff;margin-bottom:8px">pitchsidedisplays@gmail.com</a>
        <a href="https://instagram.com/pitchsidedisplays" target="_blank" rel="noopener" style="display:block;font-size:14px;color:#fff">@pitchsidedisplays</a>
      </div>
      <div>
        <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.4);font-family:'Archivo',sans-serif;font-weight:600;margin-bottom:12px">Shipping</div>
        <div style="font-size:14px;color:rgba(255,255,255,.6);line-height:1.7">Ships from the USA<br/>Worldwide via UPS<br/>22 × 32 in · ~20 lb</div>
      </div>
      <div>
        <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.4);font-family:'Archivo',sans-serif;font-weight:600;margin-bottom:12px">Info</div>
        <div style="font-size:14px;color:rgba(255,255,255,.6);line-height:1.7">Returns &amp; damages<br/>Care guide<br/>Terms</div>
      </div>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,.12)">
      <div style="max-width:1240px;margin:0 auto;padding:18px 32px;font-size:12.5px;color:rgba(255,255,255,.35)">© 2026 Pitchside Displays</div>
    </div>
  </footer>`;
}

function homeScreen() {
  const hero = SHOTS[state.gi];
  const galleryHtml = SHOTS.map(
    (shot, i) => `
    <button data-action="gallery-select" data-idx="${i}" style="flex:1;padding:0;border-radius:10px;overflow:hidden;background:#fff;cursor:pointer;aspect-ratio:3/4;border:1.5px solid ${i === state.gi ? '#12120f' : 'rgba(0,0,0,.1)'};opacity:${i === state.gi ? '1' : '.72'};transition:opacity var(--duration-fast) var(--ease-out),border-color var(--duration-fast) var(--ease-out)">
      <img class="fade-img" src="${shot.src}" alt="${esc(shot.label)}" style="display:block;width:100%;height:100%;object-fit:cover"/>
    </button>`
  ).join('');

  const currencyHtml = CURRENCIES.map(
    (c, i) => `
    <button data-action="currency-select" data-idx="${i}" style="border:0;border-radius:999px;padding:7px 16px;font-size:12.5px;font-weight:500;cursor:pointer;background:${i === state.cur ? '#12120f' : 'transparent'};color:${i === state.cur ? '#fff' : 'rgba(0,0,0,.55)'}">${c.code}</button>`
  ).join('');

  const specsHtml = SPECS.map(
    (spec) => `
    <div style="background:#fff;padding:16px 18px">
      <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(0,0,0,.42);font-family:'Archivo',sans-serif;font-weight:600">${esc(spec.k)}</div>
      <div style="font-size:15px;margin-top:5px">${esc(spec.v)}</div>
    </div>`
  ).join('');

  const stepsHtml = STEPS.map(
    (step) => `
    <div style="border-top:1px solid rgba(0,0,0,.12);padding-top:18px">
      <div style="font-family:'Archivo',sans-serif;font-weight:800;font-size:13px;color:#1f6b4f;letter-spacing:.08em">${step.n}</div>
      <div style="font-family:'Archivo',sans-serif;font-weight:700;font-size:20px;letter-spacing:-.02em;margin:10px 0 8px">${esc(step.t)}</div>
      <p style="font-size:14.5px;line-height:1.55;color:rgba(0,0,0,.58);margin:0">${esc(step.d)}</p>
    </div>`
  ).join('');


  const faqsHtml = FAQS.map(
    (faq) => `
    <div style="border-bottom:1px solid rgba(0,0,0,.1);padding:20px 0;display:grid;grid-template-columns:1fr 1.3fr;gap:28px">
      <div style="font-size:15.5px;font-weight:500">${esc(faq.q)}</div>
      <div style="font-size:15px;line-height:1.55;color:rgba(0,0,0,.6)">${esc(faq.a)}</div>
    </div>`
  ).join('');

  return `
  <main style="flex:1">
    <section style="max-width:1240px;margin:0 auto;padding:56px 32px 40px;display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:start">
      <div>
        <div style="position:relative;background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:8px;box-shadow:0 24px 50px -32px rgba(18,18,15,.4)">
          <div style="position:relative;border-radius:14px;overflow:hidden;background:#eae7e0;aspect-ratio:4/5">
            <img class="fade-img" src="${hero.src}" alt="Custom pitchside display case" style="display:block;width:100%;height:100%;object-fit:contain"/>
            <div style="position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 90px rgba(18,18,15,.16)"></div>
            <div style="position:absolute;left:14px;bottom:14px;display:flex;align-items:center;gap:10px">
              <span style="background:rgba(18,18,15,.82);color:#fff;backdrop-filter:blur(6px);border-radius:999px;padding:6px 12px;font-family:'Archivo',sans-serif;font-weight:700;font-size:10.5px;letter-spacing:.14em">${state.gi + 1} / ${SHOTS.length}</span>
              <span style="background:rgba(255,255,255,.9);color:#12120f;backdrop-filter:blur(6px);border-radius:999px;padding:6px 12px;font-size:11.5px;letter-spacing:.02em">${esc(hero.label)}</span>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:12px;margin-top:14px">${galleryHtml}</div>
      </div>

      <div style="padding-top:6px">
        <div style="display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(0,0,0,.12);border-radius:999px;padding:5px 12px;font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:rgba(0,0,0,.55);font-family:'Archivo',sans-serif;font-weight:600">
          <span style="width:6px;height:6px;border-radius:50%;background:#1f6b4f"></span>Made to order · ships from the USA
        </div>
        <h1 style="font-family:'Archivo',sans-serif;font-weight:800;font-size:52px;line-height:.98;letter-spacing:-.032em;margin:18px 0 0;text-wrap:pretty">Custom soccer card display case</h1>
        <p style="font-size:16.5px;line-height:1.55;color:rgba(0,0,0,.62);margin:16px 0 0;max-width:44ch">Your club, your stadium, your eleven. Eleven graded slabs mounted behind UV acrylic, in a hinged black frame built to hang or stand.</p>

        <div style="display:flex;align-items:flex-end;gap:16px;margin:28px 0 0">
          <div style="font-family:'Archivo',sans-serif;font-weight:800;font-size:40px;letter-spacing:-.03em;line-height:1">${money(CURRENCIES[state.cur].price)}</div>
          <div style="font-size:13px;color:rgba(0,0,0,.5);padding-bottom:7px">+ shipping, calculated at checkout</div>
        </div>
        <div style="display:flex;gap:6px;margin-top:14px;background:#e9e6df;border-radius:999px;padding:4px;width:fit-content">${currencyHtml}</div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:rgba(0,0,0,.08);border:1px solid rgba(0,0,0,.08);border-radius:14px;overflow:hidden;margin:28px 0 0">${specsHtml}</div>

        <div style="display:flex;gap:12px;margin-top:26px">
          ${
            soldOut()
              ? `<span class="btn-primary" aria-disabled="true" style="flex:1;color:#fff;border:0;border-radius:12px;padding:19px 26px;font-size:15.5px;font-weight:500;cursor:not-allowed;display:flex;align-items:center;justify-content:center;gap:10px;opacity:.5">Sold out</span>`
              : `<a href="https://buy.stripe.com/cNi14p6W78f8bWFcpJ7g402" class="btn-primary" style="flex:1;color:#fff;border-radius:12px;padding:19px 26px;font-size:15.5px;font-weight:500;display:flex;align-items:center;justify-content:center;gap:10px">Start your custom order <span style="font-size:17px">→</span></a>`
          }
          <a href="https://instagram.com/pitchsidedisplays" target="_blank" rel="noopener" style="border:1px solid rgba(0,0,0,.14);border-radius:12px;padding:19px 22px;font-size:15px;color:#12120f;display:flex;align-items:center">See it on IG</a>
        </div>
        <div style="margin-top:14px;font-size:12.5px;color:rgba(0,0,0,.5);line-height:1.5">Shipping within the US. International enquiries — contact us at <a href="mailto:pitchsidedisplays@gmail.com" style="color:rgba(0,0,0,.5)">pitchsidedisplays@gmail.com</a> for a shipping quote.</div>
        <div style="margin-top:22px;border:1px solid rgba(179,38,30,.28);background:rgba(179,38,30,.05);border-radius:14px;padding:16px 18px">
          <div style="font-family:'Archivo',sans-serif;font-weight:800;font-size:15px;letter-spacing:-.01em;color:#b3261e">${esc(stockLine())}</div>
          <div style="margin-top:8px;font-size:12.5px;color:rgba(0,0,0,.55);line-height:1.5">${soldOut() ? 'This batch has sold out. Once all current orders are completed, the next batch will open for new orders.' : 'Each batch is built by hand. Once all current orders are completed, the next batch will open for new orders.'}</div>
        </div>
        <div style="margin-top:14px;display:flex;gap:14px;font-size:13px;color:rgba(0,0,0,.5)">
          <span>10-14 day build</span><span>·</span><span>Ships from the USA</span><span>·</span><span>Tracked UPS delivery</span>
        </div>
      </div>
    </section>

    <section ${revealAttrs('home-steps')} style="border-top:1px solid rgba(0,0,0,.08);background:#fff">
      <div style="max-width:1240px;margin:0 auto;padding:64px 32px">
        <h2 style="font-family:'Archivo',sans-serif;font-weight:700;font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:rgba(0,0,0,.45);margin:0 0 34px">How it works</h2>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:36px">${stepsHtml}</div>
      </div>
    </section>

    <section ${revealAttrs('home-video')} style="background:#f3f1ec">
      <div class="video-demo-grid" style="max-width:1240px;margin:0 auto;padding:64px 32px">
        <div style="position:relative;width:100%;aspect-ratio:1280/2276;mask-image:linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%);-webkit-mask-image:linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%)">
          <video
            id="demo-video"
            poster="/images/poster.jpg"
            muted
            loop
            playsinline
            disablepictureinpicture
            controlslist="nodownload"
            ${prefersReducedMotion() ? 'controls' : ''}
            style="display:block;width:100%;height:100%;object-fit:cover"
          >
            <source src="/images/video.webm" type="video/webm">
            <source src="/images/video.mp4" type="video/mp4">
          </video>
        </div>
        <div>
          <h2 style="font-family:'Archivo',sans-serif;font-weight:700;font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:rgba(0,0,0,.45);margin:0">See it in the room</h2>
          <div style="font-family:'Archivo',sans-serif;font-weight:800;font-size:34px;line-height:1.08;letter-spacing:-.03em;margin:14px 0 0">The same case, on an actual wall</div>
          <p style="font-size:15.5px;line-height:1.6;color:rgba(0,0,0,.6);margin:16px 0 0;max-width:42ch">No renders. This is the 22 × 32 in case from the gallery — hinge open, hinge closed, mounted above a mantel at true scale.</p>
          <div style="margin-top:26px;display:flex;flex-direction:column;gap:14px">
            <div style="border-top:1px solid rgba(0,0,0,.1);padding-top:14px">
              <div style="font-family:'Archivo',sans-serif;font-weight:700;font-size:14px">Hinged front</div>
              <div style="font-size:13.5px;color:rgba(0,0,0,.55);margin-top:3px">Swap slabs without unmounting the case</div>
            </div>
            <div style="border-top:1px solid rgba(0,0,0,.1);padding-top:14px">
              <div style="font-family:'Archivo',sans-serif;font-weight:700;font-size:14px">22 × 32 in</div>
              <div style="font-size:13.5px;color:rgba(0,0,0,.55);margin-top:3px">Shown here at true size on a standard mantel</div>
            </div>
            <div style="border-top:1px solid rgba(0,0,0,.1);padding-top:14px">
              <div style="font-family:'Archivo',sans-serif;font-weight:700;font-size:14px">20 lb boxed</div>
              <div style="font-size:13.5px;color:rgba(0,0,0,.55);margin-top:3px">Packed weight, shipped insured</div>
            </div>
            <div style="border-top:1px solid rgba(0,0,0,.1);padding-top:14px">
              <div style="font-family:'Archivo',sans-serif;font-weight:700;font-size:14px">UV acrylic</div>
              <div style="font-size:13.5px;color:rgba(0,0,0,.55);margin-top:3px">Cuts glare under direct light</div>
            </div>
          </div>
          ${
            soldOut()
              ? `<span class="btn-primary" aria-disabled="true" style="display:inline-block;margin-top:28px;color:#fff;border:0;border-radius:12px;padding:16px 24px;font-size:14.5px;font-weight:500;cursor:not-allowed;opacity:.5">Sold out</span>`
              : `<a href="https://buy.stripe.com/cNi14p6W78f8bWFcpJ7g402" class="btn-primary" style="display:inline-block;margin-top:28px;color:#fff;border-radius:12px;padding:16px 24px;font-size:14.5px;font-weight:500">Start your custom order</a>`
          }
        </div>
      </div>
    </section>

    <section ${revealAttrs('home-faq')} style="border-top:1px solid rgba(0,0,0,.08)">
      <div style="max-width:1240px;margin:0 auto;padding:56px 32px 72px;display:grid;grid-template-columns:.8fr 1.2fr;gap:56px">
        <h2 style="font-family:'Archivo',sans-serif;font-weight:800;font-size:34px;line-height:1.05;letter-spacing:-.03em;margin:0">Questions,<br/>answered</h2>
        <div style="border-top:1px solid rgba(0,0,0,.1)">${faqsHtml}</div>
      </div>
    </section>
  </main>`;
}

function customizeScreen() {
  const counts = FORMATIONS[state.formation];
  let n = counts.reduce((a, b) => a + b, 0);
  const rowsHtml = counts
    .map((c) => {
      const slots = [];
      for (let i = 0; i < c; i++) {
        const idx = --n;
        const on = state.filled.indexOf(idx) !== -1;
        slots.push(`
          <button data-action="slot-toggle" data-idx="${idx}" style="width:19%;aspect-ratio:5/7;border-radius:5px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:10px;font-family:'Archivo',sans-serif;font-weight:700;letter-spacing:.06em;border:1.5px solid ${on ? '#f7f6f2' : 'rgba(255,255,255,.3)'};background:${on ? '#f7f6f2' : 'rgba(255,255,255,.06)'};color:${on ? '#12120f' : 'rgba(255,255,255,.45)'};box-shadow:0 2px 10px rgba(0,0,0,.35)">${on ? 'PSA' : idx + 1}</button>`);
      }
      return `<div style="display:flex;gap:4.5%;justify-content:center">${slots.join('')}</div>`;
    })
    .join('');

  const teamOptsHtml = TEAM_OPTIONS.map((t) => `<option value="${esc(t)}" ${t === state.team ? 'selected' : ''}>${esc(t)}</option>`).join('');
  const stadiumOptsHtml = STADIUM_OPTIONS.map((s) => `<option value="${esc(s)}" ${s === state.stadium ? 'selected' : ''}>${esc(s)}</option>`).join('');

  const extraKeys = Object.keys(state.extras);
  const extrasHtml = extraKeys
    .map((k) => {
      const on = state.extras[k];
      return `<button data-action="extra-toggle" data-key="${esc(k)}" style="border-radius:999px;padding:10px 16px;font-size:13.5px;cursor:pointer;border:1px solid ${on ? '#12120f' : 'rgba(0,0,0,.14)'};background:${on ? '#12120f' : '#fff'};color:${on ? '#fff' : 'rgba(0,0,0,.65)'}">${esc(k)}</button>`;
    })
    .join('');

  const price = CURRENCIES[state.cur].price;

  return `
  <main style="flex:1;max-width:1240px;margin:0 auto;padding:40px 32px 72px;width:100%;box-sizing:border-box">
    <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:26px">
      <h1 style="font-family:'Archivo',sans-serif;font-weight:800;font-size:34px;letter-spacing:-.03em;margin:0">Build your display</h1>
      <div style="font-size:13.5px;color:rgba(0,0,0,.5)">Step 1 of 2 · ${esc(stockLine())}</div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:start">
      <div style="background:#12120f;border-radius:18px;padding:26px;position:sticky;top:88px">
        <div style="text-align:center;color:#fff;margin-bottom:18px">
          <div style="font-family:'Archivo',sans-serif;font-weight:800;font-size:17px;letter-spacing:.06em;text-transform:uppercase">${esc(state.team)}</div>
        </div>
        <div style="position:relative;aspect-ratio:22/30;border-radius:6px;overflow:hidden;border:1px solid rgba(255,255,255,.22);background:linear-gradient(180deg,#0e0e0c 0%,#12140f 34%,rgba(31,107,79,.5) 72%,rgba(31,107,79,.72) 100%)">
          <div style="position:absolute;left:7%;right:7%;top:5%;bottom:5%;border:1px solid rgba(255,255,255,.22)"></div>
          <div style="position:absolute;left:30%;right:30%;top:5%;height:11%;border:1px solid rgba(255,255,255,.18);border-top:0"></div>
          <div style="position:absolute;left:30%;right:30%;bottom:5%;height:11%;border:1px solid rgba(255,255,255,.18);border-bottom:0"></div>
          <div style="position:absolute;left:7%;right:7%;top:50%;height:1px;background:rgba(255,255,255,.18)"></div>
          <div style="position:absolute;left:50%;top:50%;width:26%;aspect-ratio:1;transform:translate(-50%,-50%);border:1px solid rgba(255,255,255,.18);border-radius:50%"></div>
          <div style="position:absolute;left:11%;right:11%;top:9%;bottom:9%;display:flex;flex-direction:column;justify-content:space-between">${rowsHtml}</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;color:rgba(255,255,255,.55);font-size:12.5px">
          <span>${state.filled.length} of 11 slots marked</span>
          <button data-action="reset-slots" style="background:none;border:1px solid rgba(255,255,255,.25);color:rgba(255,255,255,.8);border-radius:999px;padding:6px 14px;font-size:12px;cursor:pointer">Clear</button>
        </div>
        <p style="color:rgba(255,255,255,.4);font-size:12px;line-height:1.5;margin:14px 0 0">Tap a slot to mark which slabs you're mounting. Slots fit PSA, ACE and same-size graded cards.</p>
      </div>

      <div style="display:flex;flex-direction:column;gap:20px">
        <div style="background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:16px;padding:24px;display:grid;grid-template-columns:1fr 1fr;gap:18px">
          <div>
            <label style="display:block;font-size:12.5px;font-weight:500;margin-bottom:7px">Club</label>
            <select data-action="set-team" style="width:100%;box-sizing:border-box;padding:13px 12px;border:1px solid rgba(0,0,0,.14);border-radius:10px;font-size:14.5px;background:#fff">${teamOptsHtml}</select>
          </div>
          <div>
            <label style="display:block;font-size:12.5px;font-weight:500;margin-bottom:7px">Stadium background</label>
            <select data-action="set-stadium" style="width:100%;box-sizing:border-box;padding:13px 12px;border:1px solid rgba(0,0,0,.14);border-radius:10px;font-size:14.5px;background:#fff">${stadiumOptsHtml}</select>
          </div>
          <div style="grid-column:1/-1">
            <label style="display:block;font-size:12.5px;font-weight:500;margin-bottom:9px">Crowd extras</label>
            <div style="display:flex;gap:10px;flex-wrap:wrap">${extrasHtml}</div>
          </div>
          <div style="grid-column:1/-1">
            <label style="display:block;font-size:12.5px;font-weight:500;margin-bottom:7px">Additional notes</label>
            <textarea data-action="set-notes" placeholder="Player names, a season, a shirt number under each slab, anything else." style="width:100%;box-sizing:border-box;min-height:96px;padding:13px 12px;border:1px solid rgba(0,0,0,.14);border-radius:10px;font-size:14.5px;resize:vertical">${esc(state.notes)}</textarea>
          </div>
        </div>

        <div style="background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:16px;padding:24px">
          <div style="display:flex;justify-content:space-between;font-size:14.5px;padding-bottom:12px;border-bottom:1px solid rgba(0,0,0,.08)"><span style="color:rgba(0,0,0,.55)">Custom display case, 22 × 32 in</span><span>${money(price)}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:14.5px;padding:12px 0;border-bottom:1px solid rgba(0,0,0,.08)"><span style="color:rgba(0,0,0,.55)">${esc(configLine())}</span><span style="color:rgba(0,0,0,.45)">Included</span></div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;padding-top:16px">
            <span style="font-family:'Archivo',sans-serif;font-weight:700;font-size:18px">Total</span>
            <span style="font-family:'Archivo',sans-serif;font-weight:800;font-size:24px;letter-spacing:-.02em">${money(price)} <span style="font-size:13px;font-weight:500;color:rgba(0,0,0,.45)">+ shipping</span></span>
          </div>
          <button data-action="nav" data-screen="checkout" class="btn-primary" style="width:100%;margin-top:18px;color:#fff;border:0;border-radius:12px;padding:18px;font-size:15.5px;font-weight:500;cursor:pointer">Continue to checkout</button>
        </div>
      </div>
    </div>
  </main>`;
}

function checkoutScreen() {
  const price = CURRENCIES[state.cur].price;
  const ship = CURRENCIES[state.cur].ship;
  const totals = [
    { k: 'Subtotal', v: money(price) },
    { k: 'Shipping (tracked, from USA)', v: money(ship) },
    { k: 'Sales tax', v: 'Calculated at payment' },
  ];

  const fieldsHtml = CHECKOUT_FIELDS.map(
    (f) => `
    <div style="grid-column:${f.full ? '1/-1' : 'auto'}">
      <label style="display:block;font-size:12.5px;font-weight:500;margin-bottom:7px">${esc(f.label)}</label>
      <input placeholder="${esc(f.ph)}" style="width:100%;box-sizing:border-box;padding:13px 12px;border:1px solid rgba(0,0,0,.14);border-radius:10px;font-size:14.5px"/>
    </div>`
  ).join('');

  const payHtml = PAY_METHODS.map((pm, i) => {
    const on = state.pay === i;
    return `
    <button data-action="pay-select" data-idx="${i}" style="display:flex;align-items:center;gap:14px;text-align:left;border-radius:12px;padding:16px 18px;cursor:pointer;border:1.5px solid ${on ? '#12120f' : 'rgba(0,0,0,.12)'};background:${on ? '#f7f6f2' : '#fff'}">
      <span style="width:16px;height:16px;border-radius:50%;border:1.5px solid ${on ? '#12120f' : 'rgba(0,0,0,.3)'};background:${on ? '#12120f' : 'transparent'};flex:none"></span>
      <span style="flex:1">
        <span style="display:block;font-size:14.5px;font-weight:500">${esc(pm.name)}</span>
        <span style="display:block;font-size:12.5px;color:rgba(0,0,0,.5);margin-top:2px">${esc(pm.note)}</span>
      </span>
    </button>`;
  }).join('');

  const totalsHtml = totals
    .map(
      (row) => `
    <div style="display:flex;justify-content:space-between;font-size:14px;padding:11px 0;border-bottom:1px solid rgba(0,0,0,.06)"><span style="color:rgba(0,0,0,.55)">${esc(row.k)}</span><span>${esc(row.v)}</span></div>`
    )
    .join('');

  const totalLabel = money(price + ship);

  return `
  <main style="flex:1;max-width:1040px;margin:0 auto;padding:40px 32px 72px;width:100%;box-sizing:border-box">
    <h1 style="font-family:'Archivo',sans-serif;font-weight:800;font-size:34px;letter-spacing:-.03em;margin:0 0 26px">Checkout</h1>
    <div style="display:grid;grid-template-columns:1.15fr .85fr;gap:28px;align-items:start">
      <div style="display:flex;flex-direction:column;gap:20px">
        <div style="background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:16px;padding:24px">
          <div style="font-family:'Archivo',sans-serif;font-weight:700;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:rgba(0,0,0,.45);margin-bottom:18px">Contact &amp; delivery</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">${fieldsHtml}</div>
        </div>

        <div style="background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:16px;padding:24px">
          <div style="font-family:'Archivo',sans-serif;font-weight:700;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:rgba(0,0,0,.45);margin-bottom:18px">Payment</div>
          <div style="display:flex;flex-direction:column;gap:10px">${payHtml}</div>
          <p style="font-size:12.5px;color:rgba(0,0,0,.45);line-height:1.5;margin:16px 0 0">Mockup only — the live site routes this to a hosted checkout, so no card data touches the site.</p>
        </div>
      </div>

      <div style="background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:16px;padding:24px;position:sticky;top:88px">
        <div style="font-family:'Archivo',sans-serif;font-weight:700;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:rgba(0,0,0,.45);margin-bottom:16px">Order summary</div>
        <div style="display:flex;gap:14px;padding-bottom:16px;border-bottom:1px solid rgba(0,0,0,.08)">
          <div style="width:64px;height:86px;border-radius:8px;overflow:hidden;background:#efece6;flex:none"><img class="fade-img" src="${SHOTS[state.gi].src}" alt="" style="width:100%;height:100%;object-fit:cover"/></div>
          <div>
            <div style="font-size:14.5px;font-weight:500">Custom display case</div>
            <div style="font-size:12.5px;color:rgba(0,0,0,.5);margin-top:4px;line-height:1.5">${esc(configLine())}</div>
          </div>
        </div>
        ${totalsHtml}
        <div style="display:flex;justify-content:space-between;align-items:baseline;padding-top:16px">
          <span style="font-family:'Archivo',sans-serif;font-weight:700;font-size:17px">Total</span>
          <span style="font-family:'Archivo',sans-serif;font-weight:800;font-size:24px;letter-spacing:-.02em">${totalLabel}</span>
        </div>
        <button class="btn-primary" style="width:100%;margin-top:18px;color:#fff;border:0;border-radius:12px;padding:18px;font-size:15.5px;font-weight:500;cursor:pointer">Pay ${totalLabel}</button>
        <div style="margin-top:14px;font-size:12.5px;color:rgba(0,0,0,.5);line-height:1.6">Ships from the USA, 22 × 32 in and ~20 lb boxed · US delivery 3–5 days after build · tracked</div>
      </div>
    </div>
  </main>`;
}

// -- render + event wiring ---------------------------------------------------

function screenHtml() {
  switch (state.screen) {
    case 'customize':
      return customizeScreen();
    case 'checkout':
      return checkoutScreen();
    case 'home':
    default:
      return homeScreen();
  }
}

let videoObserver = null;

function setupVideoObserver() {
  videoObserver?.disconnect();
  videoObserver = null;

  if (state.screen !== 'home' || prefersReducedMotion()) return;

  const video = document.getElementById('demo-video');
  if (!video) return;

  videoObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.intersectionRatio >= 0.4) {
          entry.target.play().catch(() => {});
        } else {
          entry.target.pause();
        }
      }
    },
    { threshold: 0.4 }
  );
  videoObserver.observe(video);
}

let revealObserver = null;

function setupRevealObserver() {
  revealObserver?.disconnect();
  revealObserver = null;

  // CSS already forces .reveal to its resting state under reduced motion
  // regardless of whether it ever gets observed — this just skips the
  // pointless observing/unobserving work on top of that.
  if (prefersReducedMotion()) return;

  const targets = document.querySelectorAll('.reveal:not(.is-visible)');
  if (!targets.length) return;

  revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.intersectionRatio < 0.15) continue;
        entry.target.classList.add('is-visible');
        revealedSections.add(entry.target.dataset.reveal);
        revealObserver.unobserve(entry.target);
      }
    },
    { threshold: 0.15 }
  );
  targets.forEach((el) => revealObserver.observe(el));
}

function render() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div style="min-height:100vh;display:flex;flex-direction:column">
      ${topBanner()}
      ${header()}
      ${screenHtml()}
      ${footer()}
    </div>`;
  setupVideoObserver();
  setupRevealObserver();
}

function bindEvents() {
  const app = document.getElementById('app');

  app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;

    switch (action) {
      case 'nav':
        setState({ screen: el.dataset.screen });
        break;
      case 'gallery-select':
        setState({ gi: Number(el.dataset.idx) });
        break;
      case 'currency-select':
        setState({ cur: Number(el.dataset.idx) });
        break;
      case 'slot-toggle': {
        const idx = Number(el.dataset.idx);
        setState((st) => ({
          filled: st.filled.indexOf(idx) !== -1 ? st.filled.filter((x) => x !== idx) : st.filled.concat(idx),
        }));
        break;
      }
      case 'reset-slots':
        setState({ filled: [] });
        break;
      case 'extra-toggle': {
        const key = el.dataset.key;
        setState((st) => ({ extras: { ...st.extras, [key]: !st.extras[key] } }));
        break;
      }
      case 'pay-select':
        setState({ pay: Number(el.dataset.idx) });
        break;
      default:
        break;
    }
  });

  app.addEventListener('change', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;

    switch (action) {
      case 'set-team':
        setState({ team: el.value });
        break;
      case 'set-stadium':
        setState({ stadium: el.value });
        break;
      case 'set-notes':
        setState({ notes: el.value });
        break;
      default:
        break;
    }
  });
}

function setupImageFadeIn() {
  // 'load'/'error' don't bubble, so this listens on the capture phase on a
  // permanent ancestor instead — one listener, works for every .fade-img
  // ever rendered (including ones recreated by a later re-render), no
  // re-attaching per image.
  const reveal = (e) => {
    const img = e.target;
    if (img.tagName === 'IMG' && img.classList.contains('fade-img')) {
      img.classList.add('is-loaded');
    }
  };
  document.addEventListener('load', reveal, true);
  document.addEventListener('error', reveal, true);
}

function init() {
  bindEvents();
  render();
  setupImageFadeIn();
  window.addEventListener('beforeunload', () => {
    videoObserver?.disconnect();
    revealObserver?.disconnect();
  });
  fetchBatchRemaining();
  // Catches the case where the tab was already open (so the on-load fetch
  // ran before an admin's update) and is switched back to later.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') fetchBatchRemaining();
  });
}

document.addEventListener('DOMContentLoaded', init);
