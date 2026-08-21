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
security headers (including a CSP that blocks scripts outright, since these pages
have none).

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
