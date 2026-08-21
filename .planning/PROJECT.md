# ClickMe Marketing Site

## What This Is

The marketing surface for ClickMe, an iOS expert-consultation marketplace where
experts publish topics and open hours, and clients book 30-minute voice calls that
are charged after the session. Today it is three hand-written, dependency-free HTML
pages — landing, privacy, support — styled dark-only to match the iOS app.

The app is **not yet submitted to the App Store**. Until it is, this site cannot
drive installs, so its near-term job is to go live as a pre-launch page that captures
waitlist emails and starts building demand ahead of approval.

The site is hosted at `uptrendinvestments.net/clickme/` as its own Vercel project,
proxied from the parent Uptrend Investments Inc. site. The backend (Node/Express/
Supabase/Stripe Connect) lives in a separate repo and is deliberately not coupled to
this one.

## Core Value

Every page either drives an App Store install or supports someone deciding to install
— and until the app ships, captures the intent of someone who would have.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — the site is built but has never been deployed. Nothing is validated until
it is live and observed.)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Waitlist email capture — same-origin form POST to a Vercel serverless function
      that writes to Supabase
- [ ] Landing-page CTAs swapped from the dead `APP_STORE_URL` placeholder to the
      waitlist capture, with pre-launch framing
- [ ] CSP relaxed exactly enough to permit the form (`form-action 'self'`) while
      keeping `script-src 'none'`
- [ ] `privacy.html` updated to document email collection, retention, and deletion
- [ ] Deployed to Vercel as its own project
- [ ] Parent-site rewrite added so `uptrendinvestments.net/clickme/` resolves
- [ ] `Sitemap:` line added to the parent domain's root `robots.txt`
- [ ] README design notes corrected to match the shipped dark/mint palette

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- **Real App Store URL and official Apple badge artwork** — gated on an approval date
  we do not control. Deferred to the post-approval milestone so this milestone can
  finish on a date we do control.
- **Analytics and App Store click tracking** — the "measure before you optimize"
  argument protects the conversion and content work, and all of that is deferred.
  Nothing in this milestone depends on measurement. Moves to v2.
- **Astro migration** — decided against for now. The toolchain cost is only justified
  by a page count that does not exist yet; revisit when category pages are actually
  imminent.
- **Category pages (28 taxonomy categories)** — depends on the framework migration.
- **Content / SEO guides** — nothing to feed until category pages exist.
- **Dedicated expert-recruitment surface** — experts are already lined up and onboarded
  outside the site, so the supply-side marketing problem is not currently live.
- **Conversion optimization (real reviews, FAQ, pricing clarity)** — requires completed
  sessions that do not exist yet, and measurement that is deferred.
- **Light mode** — the iOS app has no light mode. Dark-only is a decision, not an
  oversight.
- **Universal Links / `.well-known` files** — cannot be served from a subdirectory,
  and the app's AASA is already served by the backend on its own domain.

## Context

**What is already built (unshipped):**

- `index.html` — hero, how-a-session-works sequence, features grid, experts section,
  App Store CTAs. Contains 4 occurrences of the literal `APP_STORE_URL` placeholder.
- `privacy.html` — a genuine description of how the app handles data (Stripe for cards
  and payout identity, Agora for voice, Supabase for accounts, APNs for notifications,
  calls not recorded). Accurate, but **never reviewed by a lawyer**.
- `support.html` — Apple requires a support URL.
- `sitemap.xml`, `vercel.json` (security headers incl. a strict CSP), `README.md`.
- All other placeholder tokens (support email, legal name, address, effective date,
  response time) are filled. Only `APP_STORE_URL` remains.

**Known drift to correct:** README's "Design notes" section documents a pale sage
ground (`#E6EBE7`) with a cadmium red-orange accent. The shipped `index.html` is
`--ground:#0A0C0B` with `--mint:#4FE88C` and glow tokens, from the dark rework in
commit `9a91070`. The seed notes claim the palette is documented in the README; it is
not. This is exactly the drift that causes future edits to diverge.

**Current CSP** blocks the planned work until changed:
`default-src 'self'; script-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'`

**External dependency:** legal review of `privacy.html`. Runs out-of-band and does not
gate the milestone, but the policy edit documenting email collection is in-scope work.

**Origin:** this project was seeded from `ROADMAP-SEED.md`, which proposed eight phases
written on the assumption that launch was imminent. That assumption was wrong — the app
is still in development — which is why the phase order here differs substantially.
Delete `ROADMAP-SEED.md` once this document is in place.

## Constraints

- **Tech stack**: Hand-written static HTML, no build step, no framework — Astro was
  explicitly declined for this milestone. A serverless function is permitted; a
  frontend toolchain is not.
- **Dependencies**: The repo currently has zero npm dependencies. Importing
  `@supabase/supabase-js` into the serverless function would end that; calling
  Supabase's REST endpoint with plain `fetch` would preserve it. Planning-time call.
- **Security**: `script-src 'none'` should survive this milestone. A plain form POST
  needs no JavaScript; any JS-based enhancement must justify weakening the CSP.
- **Hosting**: Subdirectory deployment means `robots.txt` and any `.well-known` file
  must live at the PARENT domain root. A sitemap here cannot advertise itself.
- **Design**: Dark-only, matching the iOS app. Mint accent with glow, pill geometry.
- **Copy**: Grounded in real backend behavior — 30-minute blocks, charged after the
  session, in-app voice, reviews gated on completed sessions. Marketing copy must not
  drift from what the product actually does.
- **Legal**: Legal pages name Uptrend Investments Inc. and carry a real registered
  address. Privacy policy changes need legal review, not just an edit.
- **Decoupling**: This repo exists separately so marketing edits never redeploy the
  payments API. Do not couple the site to the backend's deploy.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Ship now as a pre-launch page rather than holding until approval | Starts the SEO clock and captures demand from people who would have installed; approval timing is unknown | — Pending |
| Waitlist emails go to a Vercel serverless function writing to Supabase | Avoids adding a third-party vendor to the privacy policy; reuses a stack already in play; keeps the marketing site decoupled from the backend's deploy | — Pending |
| Stay on hand-written static HTML; decline Astro for now | The migration is only justified by a page count that does not exist; deferring costs one bigger migration later, but avoids paying for a toolchain that may never be needed | — Pending |
| App Store swap-in deferred to its own milestone | Gated on Apple's approval date, which we do not control; keeps this milestone finishable | — Pending |
| Analytics deferred to v2 | The work it would protect (conversion, content, category pages) is all deferred; nothing here depends on measurement | — Pending |
| No dedicated expert-recruitment surface | Experts are lined up and onboarded outside the site; the supply problem the seed anticipated is not currently live | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-21 after initialization*
