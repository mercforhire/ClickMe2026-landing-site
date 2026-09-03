/**
 * Rebuilds screens/explore.webp from the raw simulator capture of the Explore tab.
 *
 * NOT part of the site and NOT part of any build. Nothing on the site loads this,
 * and it adds no dependency to the repo — it is run by hand, occasionally, and only
 * to regenerate one asset. It lives here so the retouch is reproducible and
 * auditable rather than being an unexplained image someone has to take on trust.
 *
 * Why the capture needs retouching at all: the seeded demo data behind the Explore
 * tab uses photographs of real people as expert avatars. Those are not ours to
 * publish on a marketing page. Both instances are replaced with the app's *own*
 * no-photo placeholder, so the screenshot still shows real ClickMe UI:
 *
 *   1. Morris Corkery's avatar on the "1:1 Strategy Session" card — replaced by
 *      copying the placeholder circle the app already renders for Liam Bennett on
 *      the card beside it. A pixel copy, not a redraw; both cards share the exact
 *      same background (30,32,35), so it composites invisibly.
 *   2. Morris Corkery's thumbnail in Recommended Experts — redrawn as the same
 *      placeholder at thumbnail size, in the app's placeholder colours.
 *   3. The floating tab bar is translucent, so it was blurring that same photo and
 *      smearing it across the bottom of the frame. The whole bar is transplanted
 *      from a capture where it sits over a plain background instead (22.12.30,
 *      which has the identical bar with Explore selected — verified aligned to
 *      within 1px on the mint "Explore" glyph), tone-matched to this capture.
 *
 * Nothing else in the frame is altered: the copy, prices, ratings, categories and
 * layout are exactly what the app rendered.
 *
 * Run:
 *   mkdir -p /tmp/sharpenv && (cd /tmp/sharpenv && npm i sharp)
 *   NODE_PATH=/tmp/sharpenv/node_modules node tools/retouch-explore.js
 *
 * Input lives in `ios screenshots/`, which is gitignored — see README.
 */
const sharp = require('sharp');
const path = require('path');

const SHOTS = path.join(__dirname, '..', 'ios screenshots');
const cap = t => path.join(SHOTS, `Simulator Screenshot - iPhone 17 - 2026-09-02 at ${t}.png`);
const EXPLORE = cap('16.15.41');          // the Explore tab
const TABBAR  = cap('22.12.30');          // same tab bar, over a plain background
const OUT     = path.join(__dirname, '..', 'screens', 'explore.webp');

const W = 1206;                            // iPhone 17 simulator capture size
const AVATAR  = { size: 80, from: 808, to: 106, top: 1808 };   // small placeholder circle
const THUMB   = { l: 102, t: 2187, w: 287, h: 288, r: 24 };    // Recommended Experts photo
const BAND    = { t: 2373, h: 186 };                           // the tab-bar pill, full width

// Sampled out of the app's own placeholder avatar.
const FILL = 'rgb(36,51,41)', STROKE = 'rgb(58,72,63)', ICON = 'rgb(113,122,116)';

const raw = f => sharp(f).removeAlpha().raw().toBuffer({ resolveWithObject: true });

(async () => {
  const ex = await raw(EXPLORE), tb = await raw(TABBAR);
  const at = (o, x, y) => { const i = (y * o.info.width + x) * o.info.channels;
    return [o.data[i], o.data[i + 1], o.data[i + 2]]; };
  const mean = (o, x0, x1, y0, y1) => { let s = [0, 0, 0], n = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const p = at(o, x, y); s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; n++; }
    return s.map(v => v / n); };

  // The two captures sit a few levels apart in tone; match the transplant to this one.
  const a = mean(ex, 200, 1000, 2585, 2615), b = mean(tb, 200, 340, 2605, 2618);
  const delta = [0, 1, 2].map(i => Math.round(a[i] - b[i]));

  const circle = await sharp(EXPLORE)
    .extract({ left: AVATAR.from, top: AVATAR.top, width: AVATAR.size, height: AVATAR.size })
    .png().toBuffer();

  const glyph = (cx, cy, s) =>
    `<circle cx="${cx}" cy="${cy - 13 * s}" r="${17 * s}" fill="${ICON}"/>` +
    `<path d="M ${cx - 30 * s} ${cy + 30 * s} a ${30 * s} ${27 * s} 0 0 1 ${60 * s} 0 z" fill="${ICON}"/>`;
  const thumb = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${THUMB.w}" height="${THUMB.h}">` +
    `<path d="M ${THUMB.r} 1 H ${THUMB.w - THUMB.r} A ${THUMB.r} ${THUMB.r} 0 0 1 ${THUMB.w - 1} ${THUMB.r} ` +
    `V ${THUMB.h} H 1 V ${THUMB.r} A ${THUMB.r} ${THUMB.r} 0 0 1 ${THUMB.r} 1 Z" ` +
    `fill="${FILL}" stroke="${STROKE}" stroke-width="2"/>` +
    glyph(THUMB.w / 2, 93, 1.7) + `</svg>`);

  const band = await sharp(TABBAR)
    .extract({ left: 0, top: BAND.t, width: W, height: BAND.h }).removeAlpha().raw().toBuffer();
  for (let i = 0; i < band.length; i += 3)
    for (let c = 0; c < 3; c++)
      band[i + c] = Math.min(255, Math.max(0, band[i + c] + delta[c]));
  const bandPng = await sharp(band, { raw: { width: W, height: BAND.h, channels: 3 } })
    .png().toBuffer();

  const retouched = await sharp(EXPLORE).composite([
    { input: thumb,   left: THUMB.l,   top: THUMB.t },
    { input: bandPng, left: 0,         top: BAND.t },
    { input: circle,  left: AVATAR.to, top: AVATAR.top },
  ]).png().toBuffer();

  // Same treatment as every other screen: 680px wide WebP, q78. See README.
  await sharp(retouched).resize({ width: 680 }).webp({ quality: 78 }).toFile(OUT);
  console.log('wrote', path.relative(process.cwd(), OUT), 'tone delta', delta);
})();
