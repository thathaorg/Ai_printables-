# KIWIZ – AI Printables — Complete Project Handbook

> Everything in one file: what this product is, the full PRD it follows, how it works,
> what has been built and verified, the API keys and services it uses, the repo setup,
> and exactly what work remains.
> Last updated: **2026-08-14**. Written in simple language on purpose.

---

## 1. What is Kiwiz? (30 seconds)

KIWIZ helps parents and teachers make **printable worksheets for toddlers** using
**preset templates**. The user picks a template ("Alphabet Tracing", "Dinosaur Coloring",
"Counting Farm Animals"), fills in a few options (letter, theme, age, style), and Kiwiz
generates a **print-ready A4 PDF**.

The download is **gated by email**: the user sees a watermarked preview of their worksheet,
but to actually download the PDF they must enter their email and subscribe to at least one
newsletter. Then the PDF is theirs — downloaded instantly **and** sent to their inbox.

Traffic comes from many small marketing pages called **bridge pages**
("Free Dinosaur Coloring", "Free Alphabet Tracing"). These are just doors.
All the real product lives inside Kiwiz.

### The two cardinal rules (never break these)

1. **Kiwiz is a preset template engine, not an open prompt box.**
   Every worksheet type is a preset with a few user-controlled options.
   Adding a new type = adding a new preset (config/CMS), **never new code**.
2. **Bridge pages are configs, not code.**
   A new bridge page = a new config entry (or a CMS form entry), **never new logic**.

---

## 2. The Full PRD (as shared by the owner)

### The core flow (order matters: generate first, gate second)

```
Bridge page (Pinterest ad, SEO, Meta, etc.)
   ▼
KIWIZ: pick a preset template
   ▼
Fill in options (letter, theme, age, style)
   ▼
AI generates the worksheet
   ▼
Preview shown on screen (watermarked, download locked)
   ▼
"Enter email to download"        ← email gate
   ▼
Newsletter recommendations       ← subscribe to at least one
   ▼
PDF unlocks: download + also sent by email
   ▼
Thank You page (more recommendations, next worksheet)
```

The user must **see** the printable they want before they'll give up an email for it.
That's the whole trick.

### Presets (the heart of the product)

Parents don't write AI prompts. Each preset is a prompt template with variables
(`{age}`, `{topic}`, `{style}`…) plus a small options form. Phase 1 presets:

1. **Alphabet Tracing** (capitals A–Z)
2. **Number Tracing** (0–9)
3. **Coloring Page** (theme + style + age + difficulty)
4. **Counting Worksheet** (subject + count up to N)

Phase 2 adds mazes, dot-to-dot, matching, lowercase, cursive, seasonal packs.

### The generation pipeline (same for every preset)

```
User's option values
  ▼ Prompt Builder (fills the preset template)
  ▼ AI Image (Gemini 2.5 Flash via OpenRouter)
  ▼ Safety Filter  ← MUST pass; otherwise retry silently or serve fallback
  ▼ PDF Builder (A4, print margins, worksheet header)
  ▼ Preview (download locked until email gate passed)
```

The safety filter is **non-negotiable**. No image reaches a parent's screen without a
kid-appropriateness check.

### The email gate (where the business happens)

On email submit: add to ESP (provider configurable), add to CRM with tags
(preset, topic, age, style, bridge ID, campaign, UTM), record consent.
Then show newsletter recommendations — **must join at least one** —
then the PDF unlocks and also arrives by email (transactional send, seconds,
separate from marketing).

**Credits:** 3 generations/day anonymous, 6/day logged in. Configurable.

### Bridge pages

Fast little pages that ask 0–2 questions max, pre-fill the preset form via URL params,
and pass bridge ID + UTM through. They **never** have an email field, **never** store
data, **never** generate anything. Templates: offer page, letter/number picker,
theme picker, age gate, mini quiz, seasonal, teacher.

URL handoff example:
`kiwiz.com/create?preset=coloring_page&topic=dinosaurs&style=cute&bridge=dino_02&utm_source=pinterest`
— never make the user re-answer what the bridge already collected.

### Thank You page

Same URL every time (`/thank-you`) = the single conversion event for ads.
Contents in order: confirmation, re-download link, tag-based preset recommendations
("You made Letter A → try Letter B"), more one-click newsletter joins,
placeholder slots for referral/premium (Phase 2).

### Tracking

The chain from Pinterest pin to newsletter subscription must never break.
Bridge ID + UTM + campaign travel with every event: bridge view/CTA, form viewed,
generate clicked, generation succeeded/failed/safety-blocked, credits used,
preview shown, email submitted, newsletter subscribed, PDF downloaded,
email sent/opened, return visit.

### The test of a correct build

A parent lands on a "Free Dinosaur Coloring" Pinterest bridge, hits Kiwiz with
"coloring + dinosaurs" pre-filled, picks a style and age, sees a cute worksheet,
enters their email, one-click joins the Weekly Printable Club, gets the PDF instantly
and in their inbox. Meanwhile a **non-developer** launches a new "Halloween Mazes"
bridge page in one afternoon by writing a config, and next year a "Matching" preset
is added without touching bridge or generation code.
**→ This exact scenario was implemented and verified. See §4.**

---

## 3. How it works technically (architecture)

**Stack:** Next.js 16 (App Router, Turbopack) · React 18 · Prisma 6 + Neon Postgres ·
Kinde (login) · OpenRouter → Gemini 2.5 Flash Image (AI art) · Resend (transactional
email) · pdf-lib (PDF) · Tailwind + shadcn/ui · deployable on Vercel.

### Key files, by responsibility

| Area | File(s) | What it does |
|---|---|---|
| Preset engine | `lib/presets.ts` | The 4 built-in presets: prompt templates + options + tags. `buildPrompt()` validates options & fills templates server-side |
| Preset store | `lib/preset-store.ts` | Merges built-ins with CMS-created presets from DB (same id overrides, disabled hides) |
| Bridge configs | `lib/bridges.ts` | 5 built-in bridge pages as pure config |
| Bridge store | `lib/bridge-store.ts` | Same DB layering for CMS-created bridges |
| Generation API | `app/api/generate/route.ts` | The single pipeline: credits check → prompt build → AI image → safety filter → fallback if needed → persist |
| Safety | `lib/safety.ts` | Topic blocklist (pre-gen) + vision check "is this safe for ages 2–5?" (post-gen). Fail → retry → pre-approved fallback (`public/fallback-worksheet.svg`) |
| Credits | `lib/credits.ts` + `DailyUsage` table | Server-enforced: 3/day anonymous (cookie `kiwiz_anon_id`), 6/day logged in. Env-overridable: `CREDITS_ANON_PER_DAY`, `CREDITS_USER_PER_DAY` |
| Email gate | `app/api/lead/route.ts` | Records lead + consent + funnel tags in DB (CRM of record), mirrors to ESP if configured |
| Newsletters | `app/api/newsletter/subscribe/route.ts` | Subscribes to named lists; enforces ≥1 list; merges lists on repeat |
| Delivery | `app/api/deliver/route.ts` + `lib/pdf.ts` + `lib/transactional-email.ts` | Server-verifies the gate was passed → builds A4 PDF → emails it via Resend → returns PDF for instant download |
| Create studio | `app/create/page.tsx` + `components/preset-studio.tsx` | Preset picker, options form, URL pre-fill, watermarked preview, the whole gate flow UI |
| Preset catalog | `app/api/presets/route.ts` | Public list of presets for the studio — **prompt templates are never sent to the browser** |
| Bridge pages | `app/free/[bridgeId]/page.tsx` | Renders any bridge config; links into /create with payload + bridge + UTM |
| Thank You | `app/thank-you/page.tsx` | Re-download, tag-based recommendations, one-click list joins |
| Tracking | `lib/funnel.ts` + `app/api/analytics/track/route.ts` + `TrackedEvent` table | Every funnel event carries bridge ID + UTM; captured in sessionStorage, persisted server-side |
| Admin CMS | `app/admin/cms/page.tsx` + `app/admin/cms/api/*` | Create/edit/disable bridge pages & presets from forms. Admin-only (`isAdmin` flag) |
| Auth middleware | `proxy.ts` | Kinde auth wrapper; defines public paths (/, /create, /free, /thank-you, public APIs) |

### Database models (Prisma, `prisma/schema.prisma`)

`User` (Kinde-linked, isAdmin flag) · `Lead` (email gate captures + consent + tags) ·
`NewsletterSubscriber` (with `lists[]`) · `Generation` (each AI worksheet) ·
`TrackedEvent` (funnel analytics) · `DailyUsage` (credits) ·
`CmsBridge` / `CmsPreset` (admin-created configs) · `Activity` (legacy per-user log).

### The admin CMS (free, built-in — no third-party service)

- URL: **`/admin/cms`** ("Content" in the admin sidebar). Requires a logged-in user
  whose DB row has `isAdmin = true`.
- **Bridge pages tab**: form (headline, subline, button, emoji, page type, target
  worksheet, pre-filled answers) → saves to `CmsBridge` → instantly live at
  `/free/<link-name>` with copy-link button for ads.
- **Presets tab**: form (title, description, AI instructions with `{placeholders}`,
  option buttons, tags) → saves to `CmsPreset` → instantly appears on `/create`.
- Built-ins can be "customized" (a DB copy with the same id overrides the built-in).
  Everything can be turned off or deleted. Bad configs are rejected with plain-English
  error messages.

---

## 4. Build status — what's done and verified

All of **PRD Phase 1 plus the Phase 2 admin panel** is built and was verified end-to-end
on localhost (real requests, real database, real AI):

| # | Piece | Status | Evidence |
|---|---|---|---|
| 1 | Preset engine, 4 presets | ✅ | `/api/presets` serves all 4; templates hidden from browser |
| 2 | Generation pipeline + safety + fallback | ✅ | Real dino coloring page generated (624 KB PNG, passed safety check); unsafe topic "gun violence" blocked with 422; dead-key scenario served fallback |
| 3 | Watermarked preview + locked download | ✅ | `/create` studio flow |
| 4 | Email gate: lead + consent + tags | ✅ | `/api/lead` 200, row in `Lead` table with bridge + UTM |
| 5 | Newsletter recommendations, ≥1 enforced | ✅ | 400 "pick_one" when empty; merge on repeat subscribe |
| 6 | PDF unlock + emailed copy | ✅ | 564 KB valid A4 PDF returned; real delivery email received in owner inbox |
| 7 | Gate enforcement server-side | ✅ | `/api/deliver` returns 403 for non-subscribed emails |
| 8 | 5 bridge pages, config-driven | ✅ | All render; links pre-fill /create; UTM passthrough |
| 9 | URL param pre-fill | ✅ | `?preset=…&topic=…&bridge=…` honored, never re-asked |
| 10 | Thank You page + tag recommendations | ✅ | Renders; re-download; one-click joins |
| 11 | Credits 3 anon / 6 logged-in | ✅ | Counted in DB, `remaining` returned, 403 at limit |
| 12 | Funnel tracking with bridge + UTM | ✅ | Events persisted in `TrackedEvent` |
| 13 | Admin CMS (bridges + presets from forms) | ✅ | Created "Halloween Mazes" bridge + "Halloween Maze" preset from config → both live instantly; disable → 404; anonymous access blocked |
| 14 | Payments removed | ✅ | All Stripe code, pages, schema fields, env vars deleted (per owner decision: no payment system) |
| 15 | Production build | ✅ | `pnpm build` passes clean |

**Removed by owner request:** the entire Stripe membership/premium system.
The product is 100% free + email-gated. Referral/premium remain Phase 2 placeholders.

---

## 5. API keys & services (what powers what)

> ⚠️ **Actual secret values are NOT in this file on purpose** — this file lives in a Git
> repo. All secrets live in the git-ignored **`.env`** file at the project root
> (verified ignored; never commit it). On Vercel they go into Project → Settings →
> Environment Variables.

| Env var | Service | What it's for | Status |
|---|---|---|---|
| `OPENROUTER_API_KEY` | openrouter.ai | AI worksheet images (Gemini 2.5 Flash Image) + safety checks | ✅ **Working.** ~$8.00 credits on account, ~$0.04/worksheet (~190+ worksheets left). Invoice GALLVM7Y-0001 ($9.58) appears settled — credits are live; confirm "Receipt" email at arup@thatha.org |
| `DATABASE_URL` | Neon Postgres | All data (users, leads, subscribers, generations, events, CMS) | ✅ Working, schema pushed |
| `KINDE_CLIENT_ID/SECRET`, `KINDE_ISSUER_URL` (aiprintables.kinde.com), `KINDE_SITE_URL`, redirect URLs | Kinde | Login (email/Google/etc.). Login page is hosted by Kinde, not us | ✅ Working locally. **Prod domain must be added to Kinde allowed callbacks at deploy time** |
| `RESEND_API_KEY`, `RESEND_FROM` (optional) | Resend | Transactional PDF-delivery email | ⚠️ **Sandbox mode**: only sends to the account owner's address (210106020@hbtu.ac.in) until a domain is verified at resend.com/domains. Downloads work for everyone regardless |
| `BEEHIIV_API_KEY` + `BEEHIIV_PUBLICATION_ID` | Beehiiv (optional) | Mirror subscribers to a real newsletter ESP | ➖ Not set. DB-only mode works fine; subscribers exportable at `/admin/newsletter` |
| `CREDITS_ANON_PER_DAY`, `CREDITS_USER_PER_DAY` | — (optional) | Override daily credit limits (defaults 3 / 6) | ➖ Optional |
| `NEXT_PUBLIC_APP_URL`, support/WhatsApp vars | — | Misc site config | ✅ Present |
| ~~STRIPE_*~~ | ~~Stripe~~ | ~~Payments~~ | 🗑️ Removed with the payment system |

---

## 6. Repo, environments, how to run

- **New repo (owner's):** `https://github.com/thathaorg/Ai_printables-.git`
  — added as git remote `thatha`. Accessible from GitHub account **Arupbiswas09**
  (not visible to Arup-atcon). *Push pending — see §7.*
- **Old repo (origin):** `https://github.com/timepass-developer/ai-coloring-and-tracing.git`
- **Branch:** `main`. All PRD work is committed locally
  (commit: *"Rebuild product per PRD: preset engine, email-gated PDF downloads, bridge pages, admin CMS"*).

**Run locally:**
```bash
pnpm install          # once
pnpm exec prisma db push   # only after schema changes
pnpm dev              # → http://localhost:3000
```
Useful local URLs: `/` home · `/create` studio · `/free/dino_coloring_01` sample bridge ·
`/thank-you` · `/admin/cms` CMS (needs admin login).

**Deploy (Vercel):** link project → copy `.env` vars to Vercel env → deploy →
update Kinde allowed callback/logout URLs with the prod domain.

---

## 7. Remaining work (the go-live checklist)

In order:

1. **Push code to GitHub** — everything is committed locally; the push to
   `thatha main` needs the owner to run it (or approve it):
   `git push thatha main`
2. **Pay/verify the OpenRouter invoice** — credits are live, but confirm invoice
   GALLVM7Y-0001 ($9.58, due Aug 25 2026) shows paid (check for Stripe "Receipt"
   email at arup@thatha.org, or openrouter.ai → Settings → Credits). If unpaid,
   pay it or credits get revoked and the app falls back to placeholder worksheets.
3. **Verify a domain in Resend** (resend.com/domains → add domain → 3 DNS records)
   and set `RESEND_FROM="Kiwiz <hello@yourdomain.com>"` — until then, emailed PDFs
   only reach the owner's own inbox.
4. **Deploy to Vercel** — push env vars, deploy, then add the production domain to
   Kinde's *Allowed callback URLs* (`https://<domain>/api/auth/kinde_callback`) and
   *Allowed logout redirect URLs*.
5. **Set the owner's admin flag** — `isAdmin = true` on the owner's `User` row
   (needed for `/admin/cms`). Tell the developer/assistant which login email to flag.
6. **Smoke-test the live funnel** — bridge → create → generate → gate → subscribe →
   PDF → thank-you, on the production URL.
7. **Start marketing** — create bridge pages in `/admin/cms`, copy links into
   Pinterest/Meta ads with `utm_source`/`utm_campaign` tags; watch events accumulate.

**Nice-to-have (not blocking):**
- Custom Kinde login domain (auth.yourdomain.com) so parents never see "kinde.com"
- Beehiiv (or Kit) keys for automatic ESP sync
- Terms & Privacy pages (the email gate references them)
- Occasional AI artifact: a faint garbled text sliver at the top edge of some
  generated pages — can be fixed by tightening prompt templates or auto-cropping 2%
- Email open tracking (PRD "email opened" event) — needs ESP webhooks
- Phase 2 backlog: upload-your-drawing feature, user dashboard/library, referral,
  premium tier, more presets (mazes, dot-to-dot, matching, cursive, lowercase,
  seasonal packs)

---

## 8. How a non-developer launches a new campaign (the PRD's litmus test)

1. Log in → `/admin/cms` → **Bridge pages** → *New bridge page*.
2. Fill the form: headline "Free Christmas Coloring Pages", type "Theme picker",
   choices "Santa, Reindeer, Snowman", target worksheet "Coloring Page",
   pre-fill age if you want. **Save & publish.**
3. Click **Copy link** → paste into your Pinterest pin with
   `?utm_source=pinterest&utm_campaign=xmas25`.
4. Done. Every visitor, generation, email, subscription, and download from that pin
   is tracked with that bridge ID + UTM in the database.

Want a new *worksheet type* too? **Presets tab** → *New worksheet preset* → write the
AI instructions once with `{placeholders}` → save → it's live on `/create` and can be
targeted by any bridge page. No code, no deploy.
