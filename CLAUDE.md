<!-- GSD:project-start source:PROJECT.md -->

## Project

**ClickMe Marketing Site**

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

**Core Value:** Every page either drives an App Store install or supports someone deciding to install
— and until the app ships, captures the intent of someone who would have.

### Constraints

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
- **Copy**: Grounded in real backend behavior — 30- and 60-minute blocks, charged
  after the session, in-app voice by default with Skype/Zoom as an option, reviews
  gated on completed sessions. Marketing copy must not drift from what the product
  actually does. (Corrected 2026-09-02 against iOS screenshots: the app offers both
  30- and 60-minute sessions and a Skype/Zoom meeting type; the site had claimed
  30-minute, in-app-only.)

- **Legal**: Legal pages name Uptrend Investments Inc. and carry a real registered
  address. Privacy policy changes need legal review, not just an edit.

- **Decoupling**: This repo exists separately so marketing edits never redeploy the
  payments API. Do not couple the site to the backend's deploy.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Vercel Functions, Node.js runtime, Web `fetch` handler format | Node.js **24.x** (current Vercel default LTS; 22.x and 20.x also supported, 20.x deprecated Oct 1 2026) | Serverless endpoint at `api/subscribe.js` that receives the form POST and writes to Supabase | Current (as of docs dated 2026-06-25 / 2026-08-03) canonical Vercel Function signature is the Web Standard export — `export default { fetch(request) { ... } }` — declared as needing **no additional configuration**. It works in a project with zero `package.json` and zero build command; Vercel auto-detects any file under `/api` as a Function regardless of framework. |
| Supabase REST (PostgREST) endpoint, called with native `fetch` | n/a (HTTP API, not a library) | Insert the waitlist row without adding `@supabase/supabase-js` to the repo | See detailed comparison below. For a single-table INSERT, raw `fetch` to `https://<project-ref>.supabase.co/rest/v1/<table>` is fully capable and keeps the repo at zero npm dependencies, which the project has stated as a hard requirement. |
| Supabase `publishable` / `secret` API keys | Current generation (`sb_publishable_...` / `sb_secret_...`) | Auth to the PostgREST endpoint | Supabase is **actively migrating off** the legacy `anon` / `service_role` JWT keys. Official docs (fetched 2026-08-21) state both key generations work today, but "they will be deprecated by the end of 2026." Since this project's stated goal is to ship v1 now, start on the new key names — do not provision legacy `anon`/`service_role` keys for a brand-new integration in Q3 2026. |
| Static PRG (POST/Redirect/GET) flow, no client JS | n/a | Render a success state after form submit | Matches the CSP goal (`script-src 'none'`) exactly. The function responds with a `303 See Other` redirect to a static `thanks.html`; no JS, no templating engine, no framework needed. |

### Supporting Libraries

| Library | Version | Purpose | When to Use (NOT now) |
|---------|---------|---------|-------------|
| `@supabase/supabase-js` | 2.x | Typed query builder, auth, realtime, storage | Only once the function needs more than a single blind INSERT — e.g. reading data back with complex filters, joining auth, or once you have 3+ endpoints where the boilerplate of hand-rolled `fetch` calls starts costing more than the dependency does. Not justified here. |
| `resend` (npm SDK) | 4.x | Transactional email sending | Only if/when you add confirmation or launch-announcement email (see opt-in section below). Even then, prefer Resend's plain REST API over the SDK to keep the function dependency-free — see below. |
| `@vercel/functions` | latest | `waitUntil`, geolocation, OIDC helpers | Not needed. The insert is a single awaited `fetch` call; there's no background work to defer. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vercel CLI (`vercel dev`) | Local testing of `api/subscribe.js` before deploy | No install needed beyond `npx vercel dev`; doesn't require a `package.json` in the project to run. |
| Vercel Project Settings → Build & Deployment → Node.js Version | Pin the Function runtime | Do this in the dashboard, not via `package.json` `engines.node` — adding a `package.json` purely to pin a Node version would be the first npm-adjacent file in an otherwise dependency-free repo. Confirm/set **22.x or 24.x** explicitly rather than trusting "whatever is default this month," since Vercel is deprecating 20.x on **Oct 1, 2026** and defaults can move. |

## Installation

# None. No package.json, no npm install, no build command.

# api/subscribe.js is dropped directly into the repo alongside index.html.

## The five questions, resolved

### 1. Vercel serverless functions on a zero-build static project

- Dropping `api/subscribe.js` into a project with no `package.json` and no build command still works in 2026. Vercel's own docs state plainly: *"To use the Node.js runtime for an individual Vercel Function, create a file inside the `/api` directory... No additional configuration is needed."* A `package.json` is only required if you need npm dependencies for the function — the project has none, so it's optional and should be omitted to preserve the zero-dependency posture.
- **Default runtime**: Node.js **24.x** is the current default for new projects (22.x and 20.x also available; 20.x is being disabled in Project Settings on **October 1, 2026**). Do not leave this to the default silently drifting — set it explicitly in Project Settings.
- **Function signature — resolve this explicitly, current docs supersede older tutorials**: the *current, recommended* format is the **Web Standard `fetch` export**, not the legacy `(req, res)` format:

### 2. Writing to Supabase without adding npm dependencies

- `Prefer: return=minimal` avoids echoing the row back (you don't need it, and it shrinks the response).
- `on_conflict=email` + `resolution=merge-duplicates` makes a resubmission of the same email a silent no-op instead of a 409 — put a `UNIQUE` constraint on the `email` column in the table definition for this to work, and to protect the table even if the API is hit outside this form.
- **`secret` key** (formerly `service_role`): bypasses Row Level Security entirely (`BYPASSRLS`). Simplest to set up — no RLS policy needed at all. But it is a full-access key to the entire project's data; if it ever leaks (misconfigured logging, an accidentally-public preview-environment env var, a copy-paste into a bug report) the blast radius is the whole database, not just the waitlist table.
- **`publishable` key** (formerly `anon`), combined with an explicit RLS policy that allows `INSERT` on the `waitlist` table for the `anon` role and denies `SELECT`/`UPDATE`/`DELETE`: the function can insert exactly one thing and can do nothing else, even if the key leaks. Slightly more setup (write one RLS policy), but it is the standard "least privilege" pattern for a public-facing insert-only form talking to Supabase.

### 3. A form that works with `script-src 'none'`

### 4. Spam/bot protection for a no-JS form, ranked by effort-to-value

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| Plain `fetch` to Supabase PostgREST | `@supabase/supabase-js` | Once the function does more than one blind INSERT (reads, filters, multiple tables/endpoints) |
| `publishable` key + INSERT-only RLS policy | `secret` key, RLS bypassed | If the function will ever need to do more than insert (e.g. read aggregate counts) and you're willing to accept the larger blast radius for the convenience |
| Web `fetch` Function export | Legacy `(request, response)` handler | If you specifically want the Vercel-provided `request.body`/`request.query` convenience parsing instead of `request.formData()` — functionally equivalent for this use case, purely a style choice |
| No confirmation email (single opt-in) | Resend + double opt-in flow | Once you're sending a real marketing/launch-announcement email to this list and want deliverability/consent hygiene, or if legal counsel (already a pending item on this project) flags a compliance need |
| 303 redirect PRG, static `thanks.html` | `:target`-keyed inline success/error messaging | If you want richer inline feedback without JS; adds complexity for marginal UX gain at this stage |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@supabase/supabase-js` for this endpoint | Adds the repo's first `package.json`, npm install step, and lockfile maintenance to save writing 4 static HTTP headers | Raw `fetch` to the PostgREST REST endpoint |
| `service_role`/`secret` key as the default choice | Bypasses RLS entirely; leaking it exposes the whole database, not just the waitlist table | `publishable`/`anon` key + an INSERT-only RLS policy |
| Legacy Supabase `anon`/`service_role` key names for a new integration started now | Supabase's own docs state these are being deprecated by end of 2026 | Provision `sb_publishable_...` / `sb_secret_...` keys from the start |
| Cloudflare Turnstile (or any JS-based challenge widget) | Requires relaxing `script-src` and typically `frame-src`; breaks the no-JS guarantee for real users unless the check is made optional, which defeats it | Vercel Bot Protection (edge-level, no page-side JS) + honeypot + rate limiting |
| Timestamp-based honeypot | Requires the landing page to be dynamically rendered per-request; the page is a static file with no per-request state | Plain (non-timestamp) honeypot field + `UNIQUE` constraint + Vercel Bot Protection |
| `302` redirect for the post-submit flow | Historically ambiguous about whether the browser should re-POST; `303` is the status code specified for "redirect after POST, fetch with GET" | `303 See Other` |
| Adding a `package.json` solely to pin `engines.node` | Introduces the repo's first npm-adjacent file for a setting that doesn't need one | Set the Node.js version in Vercel Project Settings → Build & Deployment |

## Stack Patterns by Variant

- Use Resend, called via its plain REST API (`POST https://api.resend.com/emails` with a bearer API key and `fetch`) rather than the `resend` npm SDK — same dependency-free logic as the Supabase decision. Free tier is 3,000 emails/month (100/day), which comfortably covers a pre-launch waitlist announcement.
- Do not use Supabase Auth for this. Supabase Auth's email flows (magic link, OTP) are built around creating rows in `auth.users` for actual account signup/authentication — using it to email a marketing waitlist would mean building real user accounts for people who are not, in fact, signing up for an account. Wrong tool for this job.
- Do not use Postmark unless there's a specific reason to prefer it; its free tier (100 emails, trial-only in most current pricing) is materially smaller than Resend's for this workload, and Resend's plain-REST posture fits the project's dependency ethos better.
- Escalate Vercel Bot Protection from "Log Only" to "Challenge" first (zero code change).
- Add/tighten the Firewall rate-limit rule on `/api/subscribe` second.
- Only consider a JS challenge (Turnstile or similar) as a last resort, and treat it as a deliberate CSP-policy change requiring its own decision, not a default.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Vercel Node.js runtime 24.x | Web `fetch` Function export | Current default; docs confirm the `fetch` export format is framework-agnostic and works identically across 20.x/22.x/24.x |
| Supabase `publishable`/`secret` keys | PostgREST `/rest/v1/` endpoint | Both old (`anon`/`service_role`) and new key generations work against the same REST endpoint today; only the key issuance/naming changed, not the API shape |
| `request.formData()` (Web API) | Vercel Node.js runtime `fetch` export | Native to the standard `Request` object; no Vercel-specific parsing helper needed, unlike the legacy `(req,res)` handler's `request.body` |

## Sources

- https://vercel.com/docs/functions/runtimes/node-js (last updated 2026-06-25) — Function creation in `/api`, no-config claim, request/response helpers, dependency behavior. HIGH confidence.
- https://vercel.com/docs/functions/functions-api-reference (last updated 2026-08-03) — Current canonical Web `fetch` handler signature, `config` object, cancellation. HIGH confidence.
- https://vercel.com/docs/functions/runtimes/node-js/node-js-versions (last updated 2026-02-27) — Default Node.js version (24.x), supported versions, 20.x deprecation date (Oct 1 2026). HIGH confidence.
- https://vercel.com/docs/bot-management (last updated 2026-07-17) — Bot Protection managed ruleset mechanics, free availability, Log/Challenge modes. HIGH confidence on mechanics; MEDIUM on the CSP-non-interaction inference (not stated explicitly in the doc).
- https://supabase.com/docs/guides/api/api-keys (fetched 2026-08-21) — `publishable`/`secret` key generations, deprecation timeline for `anon`/`service_role`, RLS bypass behavior of secret keys. HIGH confidence.
- WebSearch, multiple sources cross-referenced (PostgREST header conventions: `apikey`, `Authorization: Bearer`, `Prefer: return=minimal`/`return=representation`) — MEDIUM confidence, not fetched directly from `supabase.com/docs/guides/api` (that fetch returned a truncated excerpt); pattern is consistent across every independent source checked, including GitHub issue threads from the `postgrest-go` and Supabase discussion repos.
- MDN `Content-Security-Policy: form-action` directive docs, `content-security-policy.com/form-action/` — `form-action` does not inherit `default-src`, governs native form submission independent of `script-src`. HIGH confidence, standard/well-documented web platform behavior.
- WebSearch on Resend pricing (multiple 2026-dated pricing aggregator sources, cross-checked against each other) — Free tier 3,000 emails/month, 100/day cap. MEDIUM confidence — not fetched from resend.com/pricing directly; consistent across independently-authored sources.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
