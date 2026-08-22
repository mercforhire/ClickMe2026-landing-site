# ClickMe — Landing Page

Static marketing site for the ClickMe iOS app. Three self-contained HTML files,
no build step, no dependencies, no external requests. Open `index.html` in a
browser to preview.

Deliberately kept **outside** the backend repo so marketing edits never redeploy
the payments API.

## Files

| File | Purpose |
|---|---|
| `index.html` | Landing page — hero, how a session works, features, experts, App Store CTAs |
| `privacy.html` | Privacy policy (Apple requires a privacy policy URL) |
| `support.html` | Support page (Apple requires a support URL) |

## Fill these in before publishing

Every token in the table below has been filled.

| Token | Where | What it needed |
|---|---|---|
| ~~`SUPPORT_EMAIL`~~ | all three | ✅ filled — `clickmeapp@uptrendinvestments.net` |
| ~~`COMPANY_LEGAL_NAME`~~ | index, privacy | ✅ filled — Uptrend Investments Inc. |
| ~~`COMPANY_ADDRESS`~~ | privacy.html | ✅ filled |
| ~~`EFFECTIVE_DATE`~~ | privacy.html | ✅ filled — 21 August 2026 |
| ~~`RESPONSE_TIME`~~ | support.html | ✅ filled — two business days |

One placeholder is deliberately not in this table: it can't be filled until
Apple approves the app, so it lives in "Deferred until App Store approval"
below instead of here.

## What needs a human before launch

The privacy policy has not been reviewed by a lawyer. It describes how the
app and backend genuinely handle data — Stripe for cards and payout identity,
Agora for voice, Supabase for accounts, APNs for notifications, calls not
recorded — so it is an accurate starting point rather than boilerplate. It is
still not legal advice. Have counsel review it before launch.

## Deferred until App Store approval

These three things only happen once Apple approves the app — none of them
block launch:

- **The real App Store URL.** `APP_STORE_URL` is a placeholder in four spots
  in `index.html`. Find them with:

  ```sh
  grep -rn "APP_STORE_URL" .
  ```

  Replace them in one pass once you have the real URL:

  ```sh
  sed -i '' 's|APP_STORE_URL|https://apps.apple.com/app/id0000000000|g' *.html
  ```

- **Apple's official badge artwork.** The button uses an inline SVG Apple mark
  so the page stays self-contained today. Apple's Identity Guidelines require
  the official badge artwork with correct clear space and minimum size — swap
  it in once Apple approves the app.

- **The CTA swap.** Once Apple approves the app, the hero and closing CTAs
  should send visitors to an App Store install; whatever they point at in the
  meantime, that is the end state.

## Deploying (Vercel, as a subdirectory of uptrendinvestments.net)

Target URLs:

```
https://uptrendinvestments.net/clickme/
https://uptrendinvestments.net/clickme/privacy.html
https://uptrendinvestments.net/clickme/support.html
```

This folder deploys as its **own Vercel project**, and the parent site proxies to it.
That keeps the two independent: a copy fix here never redeploys the investments site,
and either can roll back on its own.

### 1. Deploy this folder

Push it to its own repo and import it in Vercel, or run `vercel` from this directory.
No build command, no output directory — it is static files. `vercel.json` sets the
security headers, including a CSP — see "Content Security Policy" below.

Note the production URL Vercel gives you, e.g. `clickme-landing.vercel.app`.

### 2. Add the rewrite to the PARENT project

In the `uptrendinvestments.net` project's `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/clickme", "destination": "https://clickme-landing.vercel.app/" },
    { "source": "/clickme/:path*", "destination": "https://clickme-landing.vercel.app/:path*" }
  ]
}
```

Both lines matter — the first handles `/clickme` with no trailing path, the second
handles everything under it. Redeploy the parent.

### 3. Add the sitemap to the PARENT robots.txt

`robots.txt` is only honored at the domain root, so `sitemap.xml` here cannot
advertise itself. Add this line to the root `robots.txt` of uptrendinvestments.net:

```
Sitemap: https://uptrendinvestments.net/clickme/sitemap.xml
```

### Optional: drop the .html extensions

Add `"cleanUrls": true` to this project's `vercel.json` to serve `/clickme/privacy`
instead of `/clickme/privacy.html`. Left off by default because the `.html` links
work identically when you open the files locally by double-clicking, and enabling it
makes every in-page link take a 308 redirect unless you also rewrite the hrefs.

## Universal Links (if you ever want them from this domain)

Apple requires `/.well-known/apple-app-site-association` at the **domain root** — a
subdirectory cannot serve it. Today the app's AASA is served by the backend on its
own Railway domain, so nothing is needed here. If you later want
`uptrendinvestments.net` links to open the app, that file must go at the parent
root with `Content-Type: application/json` and no redirect.

## Content Security Policy

`vercel.json` declares the CSP once; this section is the only place its
directives are quoted in prose, so an edit to one updates the other in the
same commit (see "Doc-with-code convention" below).

- **Form submissions** — `form-action 'self'` restricts where a `<form>` on
  this site may submit, to this origin and nowhere else. It has to be stated
  explicitly: `form-action` does not fall back to `default-src`, so
  `default-src 'self'` does not already cover it, and leaving the directive
  unset would permit submission to any origin — worse than restricting it.
- **No scripts** — `script-src 'none'` is load-bearing, not incidental: every
  page here ships zero JavaScript, and this directive is what keeps that
  true. Before adding a script, justify why it's worth weakening the CSP
  against the alternative of not using JavaScript at all.

## Waitlist unsubscribe and deletion requests

Phase 4 wires up the form that adds an address to the waitlist; this section
documents how an operator handles a request about an address already on it,
once one arrives at the existing support inbox.

- **Where requests arrive** — the existing support address,
  `clickmeapp@uptrendinvestments.net`. No new address, no form, no endpoint:
  the manual path exists so a subscriber's request never needs a second
  credential or a change to the CSP.
- **Two request types, handled differently** — "stop emailing me" sets
  `unsubscribed_at` on that row and keeps it, so a later send can exclude the
  address and there is a record consent was withdrawn; "delete my data"
  removes the row outright. A withdrawal is not the same request as an
  erasure, and treating the second as a mere flag would be the wrong answer
  to it.
- **The steps** — Supabase dashboard → Table Editor → the `waitlist` table →
  find the row by `email` → either set `unsubscribed_at` to the current
  timestamp, or delete the row.
- **Why this is dashboard-only** — the key the site itself uses can only
  insert a row; it holds no privilege to select, update or delete one, so
  neither action is reachable through the site, by anyone, including us.
  That is a deliberate property of the store, not a gap to close by widening
  the grant.
- **Which project** — this table must never live in the Supabase project the
  app and backend use for accounts and payment identity; keeping a marketing
  waitlist out of that project is the point. It does share a project with
  another, non-sensitive site, because Supabase's free plan allows two active
  projects per account and that limit is counted across every organization
  you own — so a second organization does not buy a third project. The
  consequence to remember: the publishable key is project-wide, so it reaches
  that other site's tables too, bounded by whatever those tables grant.
- **The schema** — defined in `sql/waitlist.sql`, committed alongside this
  file so the procedure and the table it operates on stay in one place.

## Design notes

Kept here so future edits stay coherent rather than drifting.

- **Palette** — near-black ground (`#0A0C0B`) behind every page, raised
  surfaces (`#171B18`) that lift cards and panels off it, and a single mint
  accent (`#4FE88C`) that carries every interactive and live-state cue.
- **Glow** — `--glow-sm` and `--glow-lg`, both mint-derived shadows, land on
  the wordmark dot, the open slot pill, the primary CTA, and the "For experts"
  bullet markers — the same handful of places the accent itself appears. The
  small dot inside the open slot pulses on opacity alone and carries no glow.
- **Geometry** — pill geometry: slots and buttons are fully rounded pills;
  cards and panels use a large, soft corner radius instead.
- **Accent rule** — mint marks what is live or what you can act on, nothing
  decorative. Before giving something the accent, ask whether it is live or
  actionable; if it isn't, it doesn't get mint.
- **Type** — the system sans stack (`--sans`) throughout, for every page. No
  web fonts, which keeps every page self-contained and fast.
- **Dark-only** — the site is dark-only, deliberately: the iOS app it markets
  has no light mode, so there is no light theme for this site to match.
- **Signature** — the hero schedule strip: booked slots struck through and dimmed,
  one slot lit with a pulsing dot. It is the product's core object, not decoration.
- **No numbered steps** in the features grid — those aren't a sequence. The
  "how a session works" list *is* ordered, so it uses FIND / BOOK / TALK / AFTER
  markers that name the stage instead of counting it.
- Reduced motion respected, keyboard focus visible.

## Doc-with-code convention

This file restates values that live in the code — `:root` custom-property
values, CSP directives, deployment steps — rather than pointing at the code,
because that reads better on its own. The tradeoff is that the prose only
stays true if it moves with the code. So: changing the value of a `:root`
custom property, changing a CSP directive, changing a documented
deployment step, or changing the waitlist schema in `sql/waitlist.sql`
updates the paragraph describing it, in the same commit — not a follow-up
one.

The Design notes and Deploying sections describe current state, not the
history of how it got that way. When something changes, edit the
description in place rather than appending a note about the change.
