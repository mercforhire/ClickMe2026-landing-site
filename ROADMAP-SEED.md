# ClickMe Marketing Site — roadmap seed

Notes to hand to `/gsd-new-project`. Not a GSD artifact; delete once PROJECT.md exists.

## What this is

The marketing surface for ClickMe, an iOS expert-consultation marketplace. Experts
publish topics and open hours; clients book 30-minute voice calls and are charged
after the session. Backend is a separate repo (Node/Express/Supabase/Stripe Connect).

Lives at `uptrendinvestments.net/clickme/` — a subdirectory of Uptrend Investments Inc.'s
site, served as its own Vercel project behind a rewrite from the parent.

## The one metric

App Store installs. Every page either drives an install or supports someone deciding
to install. A page that does neither should not exist.

## Two audiences, not one

This is a two-sided marketplace, and the sides are not equally hard. Clients arrive
with a question. Experts have to be recruited, and empty categories make the client
experience worthless. Supply acquisition is likely the harder marketing problem and
currently gets one section on a page aimed at clients.

## Suggested phases

**1. Launch-ready** — mostly done. Three pages (landing, privacy, support), dark
identity matched to the app, Vercel config, sitemap. Remaining: legal review of the
privacy policy, deploy, parent rewrite, root robots.txt line.

**2. Post-approval** — real App Store URL (4 places), Apple's official badge artwork
replacing the inline SVG approximation, an OG share image (links currently preview as
bare text), favicon and touch icons.

**3. Measurement** — you cannot grow what you cannot see. Privacy-respecting analytics,
and App Store click tracking specifically, so "does this page convert" is answerable.
Do this before optimizing anything.

**4. Framework migration** — move to Astro before page count grows. Shared layout,
one stylesheet, content collections. The current hand-written approach does not
survive 28 near-identical category pages with duplicated inline CSS. Doing this
after the category pages means migrating 30 files instead of 3.

**5. Expert recruitment** — a dedicated supply-side page or section: what experts
earn, how payouts work, how little time it takes. Probably the highest-leverage
surface on the site.

**6. Category pages** — one per taxonomy category (28 today: Prompt Engineering,
AI Agents & Automation, MLOps, AI Safety, Finance, Legal, Health, Real Estate, and
more). The main organic-search play. Generated from the taxonomy, not hand-written.
Depends on phase 4.

**7. Content / SEO** — guides and articles feeding the category pages. Only worth
starting once 4 and 6 exist to receive the traffic.

**8. Conversion work** — real review social proof once sessions exist, FAQ, pricing
clarity. Ordered last deliberately: optimizing before measurement (3) is guessing.

## Constraints to carry into planning

- Subdirectory hosting: `robots.txt` and any `.well-known` file must live at the
  PARENT domain root, not here. A sitemap here cannot advertise itself.
- Dark-only. The iOS app has no light mode; the site matching it is a decision,
  not an oversight. Palette and glow are documented in README.md.
- Copy is grounded in real backend behavior (30-minute blocks, charged after the
  session, in-app voice, reviews gated on completed sessions). Keep it that way —
  do not let marketing copy drift from what the product does.
- Legal pages name Uptrend Investments Inc. and carry a real address. Changes to
  the privacy policy need legal review, not just an edit.
