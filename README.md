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

Every placeholder is an UPPERCASE token. Find them all with:

```sh
grep -rn "APP_STORE_URL\|SUPPORT_EMAIL\|COMPANY_LEGAL_NAME\|COMPANY_ADDRESS\|EFFECTIVE_DATE\|RESPONSE_TIME" .
```

| Token | Where | What it needs |
|---|---|---|
| `APP_STORE_URL` | index.html ×4 | `https://apps.apple.com/app/id<your-app-id>` |
| `SUPPORT_EMAIL` | all three | The address you'll actually monitor |
| `COMPANY_LEGAL_NAME` | index, privacy | Registered entity name |
| `COMPANY_ADDRESS` | privacy.html | Registered business address |
| `EFFECTIVE_DATE` | privacy.html | Date the policy takes effect |
| `RESPONSE_TIME` | support.html | e.g. "one business day" — promise what you can keep |

Replace them in one pass:

```sh
sed -i '' 's|APP_STORE_URL|https://apps.apple.com/app/id0000000000|g' *.html
```

## Two things that need a human before launch

1. **The privacy policy has not been reviewed by a lawyer.** It describes how the
   app and backend genuinely handle data — Stripe for cards and payout identity,
   Agora for voice, Supabase for accounts, APNs for notifications, calls not
   recorded — so it is an accurate starting point rather than boilerplate. It is
   still not legal advice. Have counsel review it.

2. **The App Store badge is an approximation.** The button uses an inline SVG
   Apple mark so the page stays self-contained. Apple's Identity Guidelines
   require the official badge artwork with correct clear space and minimum size.
   Download the real badge and swap it in before you launch.

## Deploying

Any static host. No build command, no output directory.

- **Cloudflare Pages / Netlify / Vercel** — connect the repo, leave build settings
  empty, deploy the root.
- **GitHub Pages** — push and enable Pages on the branch root.

Point your domain at it. Do **not** serve this from the Railway backend — that
host runs a single replica tuned for API traffic, and coupling the two means a
copy fix restarts payment processing.

### If you put the site on the same domain as the app's Universal Links

The backend serves `/.well-known/apple-app-site-association` at its domain root.
If the marketing domain is ever the same domain, that path must keep returning the
backend's AASA file with `Content-Type: application/json` and no redirect — route
it at the CDN before adding any catch-all.

## Design notes

Kept here so future edits stay coherent rather than drifting.

- **Palette** — cool pale sage ground (`#E6EBE7`), deep petrol ink (`#0D211E`),
  cadmium red-orange (`#FF3B1F`) reserved *only* for the live slot, the sequence
  markers, and focus rings. If the accent starts appearing everywhere, it stops
  reading as a signal.
- **Type** — monospace carries the structural role (wordmark, slot times,
  eyebrows) because the product is a timetable; system sans for body. No web
  fonts, which keeps every page self-contained and fast.
- **Signature** — the hero schedule strip: booked slots struck through and dimmed,
  one slot lit with a pulsing dot. It is the product's core object, not decoration.
- **No numbered steps** in the features grid — those aren't a sequence. The
  "how a session works" list *is* ordered, so it uses FIND / BOOK / TALK / AFTER
  markers that name the stage instead of counting it.
- Dark mode via `prefers-color-scheme`, reduced motion respected, keyboard focus
  visible.
