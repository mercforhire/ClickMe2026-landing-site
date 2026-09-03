/**
 * Rebuilds the two screens/*.webp that need retouching before they can be published.
 *
 * NOT part of the site and NOT part of any build. Nothing on the site loads this and
 * it adds no dependency to the repo — it is run by hand, occasionally, to regenerate
 * two assets. It lives here so the retouch is reproducible and auditable rather than
 * being an unexplained image someone has to take on trust.
 *
 * Why any retouching is needed: the app's seeded demo data uses photographs of real
 * people as expert avatars (and, in one case, a stock photo of a bathroom-cleaner
 * bottle). Those are not ours to publish on a marketing page. Every one of them is
 * replaced with the app's *own* no-photo placeholder, so the screenshots still show
 * real ClickMe UI.
 *
 * What is NEVER touched: copy, prices, star ratings, review counts, names, job
 * titles, categories, ordering, layout. Only avatars, and the tab-bar smear the
 * avatars caused. If a screen's *data* is wrong for marketing, the fix is to reseed
 * the app and re-capture — not to edit it here.
 *
 * The tab bar is translucent, so wherever it overlapped a photo it was blurring that
 * photo into a coloured smear across the bottom of the frame. Covering the avatar
 * alone leaves the smear, so the whole bar is transplanted from a capture where the
 * identical bar sits over a plain background. Sources are chosen to have the same tab
 * selected, and alignment is asserted at run time on the mint glyph of the selected
 * tab before anything is written.
 *
 * Run:
 *   mkdir -p /tmp/sharpenv && (cd /tmp/sharpenv && npm i sharp)
 *   NODE_PATH=/tmp/sharpenv/node_modules node tools/retouch-screens.js
 *
 * Input lives in `ios screenshots/`, which is gitignored — see README.
 */
const sharp = require('sharp');
const path = require('path');

const SHOTS = path.join(__dirname, '..', 'ios screenshots');
const OUTDIR = path.join(__dirname, '..', 'screens');
const cap = t => path.join(SHOTS, `Simulator Screenshot - iPhone 17 - 2026-09-02 at ${t}.png`);

const W = 1206;                     // iPhone 17 simulator capture width
const PILL = { t: 2373, h: 186 };   // the floating tab bar, identical in every capture

// Sampled out of the app's own placeholder avatar.
const FILL = 'rgb(36,51,41)', STROKE = 'rgb(58,72,63)', ICON = 'rgb(113,122,116)';

const SCREENS = {
  explore: {
    src: '16.15.41',
    // Same bar with Explore selected, over a plain background.
    bandFrom: '22.12.30',
    // Bar sits over a photo here, so the whole bar is replaced.
    band: true,
    // Placeholder circle copied from the Liam Bennett card, on the same row.
    copies: [{ size: 80, fromX: 808, toX: 106, y: 1808 }],
    // Recommended Experts thumbnail, redrawn at thumbnail size.
    plates: [{ l: 102, t: 2187, w: 287, h: 288, r: 24, glyphY: 93, glyphScale: 1.7 }],
    toneAt: { a: [200, 1000, 2585, 2615], b: [200, 340, 2605, 2618] },
    // Mint glyph of the selected tab; must line up in src and bandFrom.
    glyph: { x0: 140, x1: 260, y0: 2390, y1: 2560 },
  },
  search: {
    src: '16.16.43',
    // Same bar with Search selected, over a plain background.
    bandFrom: '22.13.00',
    band: true,
    // Four photo avatars replaced by the placeholder the app already renders for
    // Ada Kensington in row 1 of this same list. Discs are 240px on a 372px pitch;
    // rows 1-4 share an identical card background, so a square patch composites
    // invisibly. Row 5 runs under the tab bar and is covered by the band.
    copies: [1230, 1602, 1974, 2346].map(cy => ({ size: 260, fromX: 97, toX: 97, y: cy - 130, fromY: 728 })),
    plates: [],
    toneAt: { a: [200, 1000, 2570, 2620], b: [200, 1000, 2570, 2620] },
    glyph: { x0: 300, x1: 520, y0: 2390, y1: 2560 },
  },
};

const raw = f => sharp(f).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const at = (o, x, y) => { const i = (y * o.info.width + x) * o.info.channels;
  return [o.data[i], o.data[i + 1], o.data[i + 2]]; };
const mean = (o, [x0, x1, y0, y1]) => { let s = [0, 0, 0], n = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const p = at(o, x, y); s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; n++; }
  return s.map(v => v / n); };

// Bounding box of the selected tab's mint glyph — the alignment fingerprint.
const mintBox = (o, g) => { let b = [1e9, -1, 1e9, -1];
  for (let y = g.y0; y < g.y1; y++) for (let x = g.x0; x < g.x1; x++) {
    const [r, gr, bl] = at(o, x, y);
    if (gr > 150 && gr - r > 40 && gr - bl > 20) {
      b[0] = Math.min(b[0], x); b[1] = Math.max(b[1], x);
      b[2] = Math.min(b[2], y); b[3] = Math.max(b[3], y); } }
  return b; };

const glyphSvg = (cx, cy, s) =>
  `<circle cx="${cx}" cy="${cy - 13 * s}" r="${17 * s}" fill="${ICON}"/>` +
  `<path d="M ${cx - 30 * s} ${cy + 30 * s} a ${30 * s} ${27 * s} 0 0 1 ${60 * s} 0 z" fill="${ICON}"/>`;

async function build(name, S) {
  const src = cap(S.src), bandSrc = cap(S.bandFrom);
  const a = await raw(src), b = await raw(bandSrc);

  // Refuse to write a misaligned transplant rather than ship a broken frame.
  const ba = mintBox(a, S.glyph), bb = mintBox(b, S.glyph);
  const drift = ba.map((v, i) => Math.abs(v - bb[i]));
  if (Math.max(...drift) > 2)
    throw new Error(`${name}: tab bar misaligned between ${S.src} and ${S.bandFrom} ` +
      `(mint glyph ${ba} vs ${bb}) — do not transplant`);

  const ma = mean(a, S.toneAt.a), mb = mean(b, S.toneAt.b);
  const delta = [0, 1, 2].map(i => Math.round(ma[i] - mb[i]));

  const layers = [];

  for (const p of S.plates) {
    layers.push({ left: p.l, top: p.t, input: Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${p.w}" height="${p.h}">` +
      `<path d="M ${p.r} 1 H ${p.w - p.r} A ${p.r} ${p.r} 0 0 1 ${p.w - 1} ${p.r} ` +
      `V ${p.h} H 1 V ${p.r} A ${p.r} ${p.r} 0 0 1 ${p.r} 1 Z" ` +
      `fill="${FILL}" stroke="${STROKE}" stroke-width="2"/>` +
      glyphSvg(p.w / 2, p.glyphY, p.glyphScale) + `</svg>`) });
  }

  for (const c of S.copies) {
    layers.push({ left: c.toX, top: c.y, input: await sharp(src)
      .extract({ left: c.fromX, top: c.fromY ?? c.y, width: c.size, height: c.size })
      .png().toBuffer() });
  }

  if (S.band) {
    const band = await sharp(bandSrc)
      .extract({ left: 0, top: PILL.t, width: W, height: PILL.h })
      .removeAlpha().raw().toBuffer();
    for (let i = 0; i < band.length; i += 3)
      for (let c = 0; c < 3; c++)
        band[i + c] = Math.min(255, Math.max(0, band[i + c] + delta[c]));
    layers.push({ left: 0, top: PILL.t, input: await sharp(band,
      { raw: { width: W, height: PILL.h, channels: 3 } }).png().toBuffer() });
  }

  const out = path.join(OUTDIR, `${name}.webp`);
  // Same treatment as every other screen: 680px wide WebP, q78. See README.
  await sharp(await sharp(src).composite(layers).png().toBuffer())
    .resize({ width: 680 }).webp({ quality: 78 }).toFile(out);
  console.log(`  ${name}.webp  tone delta ${JSON.stringify(delta)}  glyph drift ${JSON.stringify(drift)}`);
}

(async () => {
  const want = process.argv.slice(2);
  for (const [name, S] of Object.entries(SCREENS))
    if (!want.length || want.includes(name)) await build(name, S);
})().catch(e => { console.error(e.message); process.exit(1); });
