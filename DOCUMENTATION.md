# KIWIZ – AI Printables — Complete Project Handbook

> Everything in one file: the full PRD, how the product works, what has been built and
> verified, every account/key/token and where it lives, the admin login, and what remains.
> Last updated: **2026-08-14** — the product is **LIVE at https://ai-printables.vercel.app**.
> Written in simple language on purpose.
>
> ⚠️ **No secret values are written in this file** — the GitHub repo is public, so any
> token or password committed here would be instantly compromised. Every secret lives in
> the git-ignored **`.env`** file at the project root (and in Vercel → Project → Settings →
> Environment Variables for production). This file tells you *which* secret is *where*.

---

## 1. The Full PRD (verbatim, as provided by the owner)

### The Idea in 30 Seconds
KIWIZ helps parents and teachers make printable worksheets for toddlers using preset templates.
The user picks a template ("Alphabet Tracing", "Dinosaur Coloring", "Counting Farm Animals"), fills in a few options (letter, theme, age, style), and KIWIZ generates a print-ready PDF worksheet.
The download is gated by email. The user sees a preview of their worksheet, but to actually download the PDF they must enter their email, see recommended newsletters, and subscribe. Then the PDF is theirs.
To bring people to KIWIZ, we run many small marketing pages called bridge pages ("Free Dinosaur Coloring", "Free Alphabet Tracing"). These are just doors. All the real product lives inside KIWIZ.

Two rules to remember before anything else:
1. KIWIZ is a **preset template engine, not an open prompt box**. Every worksheet type is a preset with a few user-controlled options. Adding a new type = adding a new preset, never new code.
2. **Bridge pages are configs, not code.** A new bridge page = a new config entry, never new logic.

### The Core Flow
```
Bridge page (Pinterest ad, SEO, Meta, etc.)
   ▼
KIWIZ: pick a preset template
   ▼
Fill in options (letter, theme, age, style)
   ▼
AI generates the worksheet
   ▼
Preview shown on screen  (blurred/watermarked download button)
   ▼
"Enter email to download"      ← email gate
   ▼
Newsletter recommendations     ← subscribe to at least one
   ▼
PDF unlocks: download + also sent by email
   ▼
Thank You page (more recommendations, next worksheet)
```
The order matters: **generate first, gate second**. The user must see the printable they
want before they'll give up an email for it. That's the whole trick.

### The Product: Preset Templates, Not Open Prompts
Parents don't want to write AI prompts. They want to click a couple of buttons and get a
nice worksheet. So we do the prompting for them behind the scenes.

What the user sees — example "Coloring Page" preset:
- Topic: [ Dinosaurs ▾ ] (or type your own)
- Style: [ Cute ▾ ] (Cute / Simple / Realistic)
- Age: [ 4–5 ▾ ] (2–3 / 4–5)
- Difficulty: [ Easy ▾ ]
Hit Generate. Done. No prompt writing.

What KIWIZ builds behind the scenes — each preset is a prompt template with variables:
```yaml
name: coloring_page
title: Coloring Page
prompt: >
  Black and white coloring page for a {age}-year-old.
  Subject: {topic}. Style: {style}. Difficulty: {difficulty}.
  Thick clean outlines, large white regions, no small details,
  no text on the page, kid-friendly, safe for children.
options:
  - topic: [Animals, Dinosaurs, Space, Farm, Ocean, Vehicles, Custom]
  - style: [Cute, Simple, Realistic]
  - age: [2-3, 4-5]
  - difficulty: [Easy, Medium]
```
Adding a new worksheet type next year (mazes, dot-to-dot, matching, cursive) = adding one
preset file. No new UI logic, no new pipeline code, no new bridge page work.
**This is the single most important design decision in the project.**

Presets to ship in Phase 1: Alphabet Tracing (capitals A–Z) · Number Tracing (0–9) ·
Coloring Page (theme + style) · Counting Worksheet (subject + up to N).
Phase 2 adds: mazes, dot-to-dot, matching, lowercase, cursive, seasonal packs, etc.

### The generation pipeline (every preset flows through the same pipeline)
```
User's option values
  ▼ Prompt Builder (fills the preset template)
  ▼ AI Image (Gemini 2.5 Flash via OpenRouter)
  ▼ Safety Filter  ← MUST pass; otherwise retry or fall back
  ▼ Post-processing (line cleanup, B&W, layout)
  ▼ PDF Builder (print margins, tracing guides, worksheet header)
  ▼ Preview (on-screen, download disabled until email gate passed)
```
The safety filter is **non-negotiable**. No image reaches a parent's screen without
passing a kid-appropriateness check. On failure: retry silently or serve a pre-approved
fallback.

### The Email Gate (Where the Business Happens)
After generation the worksheet shows on screen — but the download button is locked:
"Your worksheet is ready! [watermarked preview] Enter your email to download the PDF."

When they submit their email:
1. Add to ESP (Beehiiv/Kit — keep provider configurable)
2. Add to CRM with tags: preset used, topic, age, style, bridge ID, campaign, UTM
3. Record consent (free printable by email + TOS/Privacy accepted)

Then show newsletter recommendations before unlocking — pick **at least one** to join:
☐ Weekly Printable Club · ☐ Alphabet & Numbers Practice ·
☐ Seasonal & Holiday Printables · ☐ Teacher Resource Pack → [Subscribe & Download]

One click subscribes them and unlocks the download. The PDF also arrives by email.
Why this order matters: generate → preview → email (they've seen it, they'll give the
email) → recommendations at peak intent → then download.
The delivery email is **transactional** (arrives in seconds), separate from marketing.

**Credits:** 3 generations/day without login, 6/day with login
(email, Google, Facebook, Apple). Keep limits configurable.

### Bridge Pages: The Marketing Doors
A bridge page is a fast little page like "Free Dinosaur Coloring Pages" run on Pinterest,
Google, Meta, TikTok, SEO. Its job: ask 1–2 quick questions max (or none), send the user
into KIWIZ with those answers pre-filled.

✅ Loads fast · ✅ Pre-fills preset options · ✅ Passes everything via URL (answers + UTM + bridge ID)
❌ Never has an email field · ❌ Never stores user data · ❌ Never generates anything itself.
The email gate is always on KIWIZ, never on the bridge.

Build 5–8 reusable templates, then configure: Offer page · Letter/number picker ·
Theme picker · Age gate · Mini quiz · Seasonal · Teacher.

Each new bridge page is a config:
```json
{
  "bridge_id": "dino_coloring_02",
  "template": "theme_picker",
  "headline": "Free Dinosaur Coloring Pages",
  "options": ["Cute", "Easy", "Realistic"],
  "payload": { "preset": "coloring_page", "topic": "dinosaurs" }
}
```
Design the config so a non-developer can eventually publish bridge pages from an admin
form. Phase 2, but don't block it.

### Skip What's Already Answered
The bridge passes data through the URL:
`kiwiz.com/create?preset=coloring_page&topic=dinosaurs&style=cute&bridge=dino_02&utm_source=pinterest`
KIWIZ reads the URL, pre-fills those options, and the user only fills what's missing.
**Never make the user re-answer something the bridge already collected.**

### The Thank You Page: Same URL Every Time
After download, land on the same URL (`/thank-you`) — the single conversion event for ads.
Content in order: "Your printable is downloaded and also sent to your inbox." →
re-download link → recommended presets based on tags ("You made Letter A → try Letter B,
the full Alphabet Pack, Animal Coloring") → more one-click newsletter joins →
placeholder slots for referral and premium (Phase 2).
Recommendations are tag-based; the same tags drive email segmentation later.

### Tracking
The chain from Pinterest pin to newsletter subscription must never break.
Bridge ID + UTM + campaign travel with every event. Minimum events:
Bridge view / option selected / CTA click · Preset form viewed / option changed /
generate clicked · Generation started / succeeded / failed / safety-blocked / credits
used · Preview shown / email submitted / recommendation shown / newsletter subscribed ·
PDF downloaded / email sent / opened · Return visit / second generation.

### Phase 1 (Build This First)
Preset engine with 4 presets · pipeline (prompt builder → AI → safety → PDF) ·
locked preview · email gate (ESP + CRM + consent) · newsletter step with ≥1 subscribe ·
PDF unlocks + emailed · 3–5 config-driven bridge templates · URL param pre-fill ·
Thank You page with tag recommendations · credits (3 anon / 6 logged-in) · core tracking.

### Phase 2
"Upload your child's drawing" AI illustration · user dashboard/library · admin panel to
create bridge pages and presets from a form · referral, premium tier · more presets
(mazes, dot-to-dot, matching, cursive, lowercase, extended numbers, seasonal packs).

### The Test of a Correct Build
A parent lands on a "Free Dinosaur Coloring" Pinterest bridge, hits KIWIZ with
"coloring + dinosaurs" pre-filled, picks a style and age, sees a cute worksheet on
screen, enters their email to download, subscribes to the Weekly Printable Club with one
click, gets the PDF instantly and in their inbox. Meanwhile, a non-developer launches a
new "Halloween Mazes" bridge page in one afternoon by writing a config, and next year we
add a "Matching" preset without touching bridge page code or generation code.

---

## 2. How it works technically (architecture)

**Stack:** Next.js 16.3 (App Router, Turbopack) · React 18 · Prisma 6 + Neon Postgres ·
OpenRouter → Gemini 2.5 Flash Image (AI art) · Resend (transactional email) · pdf-lib
(PDF) · Tailwind + shadcn/ui · Vercel (hosting, git-connected). No end-user auth —
anonymous daily credits + email gate for download; admin = password cookie.

| Area | File(s) | What it does |
|---|---|---|
| Preset engine | `lib/presets.ts` | 4 built-in presets: prompt templates + options + tags; `buildPrompt()` validates & fills server-side |
| Preset store | `lib/preset-store.ts` | Merges built-ins with CMS presets from DB (same id overrides, disabled hides) |
| Bridge configs | `lib/bridges.ts` + `lib/bridge-store.ts` | 5 built-in bridge pages + same DB layering |
| Generation API | `app/api/generate/route.ts` | Credits check → prompt build → AI image → safety filter → fallback → persist |
| Safety | `lib/safety.ts` | Topic blocklist + AI vision check ("safe for ages 2–5?"); retry → `public/fallback-worksheet.svg` |
| Credits | `lib/credits.ts` + `DailyUsage` | 3/day anonymous (cookie `kiwiz_anon_id`); env-overridable via `CREDITS_ANON` |
| Email gate | `app/api/lead/route.ts` | Lead + consent + funnel tags to DB (CRM of record); mirrors to ESP if configured |
| Newsletters | `app/api/newsletter/subscribe/route.ts` | Named lists; ≥1 enforced server-side |
| Delivery | `app/api/deliver/route.ts` + `lib/pdf.ts` + `lib/transactional-email.ts` | Verifies gate passed → A4 PDF → Resend email → returns PDF for download |
| Create studio | `app/create/` + `components/preset-studio.tsx` | Preset picker, options form, URL pre-fill, watermarked preview, gate UI |
| Preset catalog | `app/api/presets/route.ts` | Public preset list — **prompt templates never reach the browser** |
| Bridge pages | `app/free/[bridgeId]/page.tsx` | Renders any bridge config; UTM passthrough |
| Thank You | `app/thank-you/page.tsx` | Re-download, tag-based recommendations, one-click joins |
| Tracking | `lib/funnel.ts` + `app/api/analytics/track` + `TrackedEvent` | Every event carries bridge ID + UTM |
| Admin CMS | `app/admin/cms/` | Create/edit/disable bridges & presets from forms (admin-only) |
| Admin gate | `proxy.ts` + `lib/admin-auth.ts` | Password cookie for `/admin*`; public product open |

**DB models:** User (isAdmin flag) · Lead · NewsletterSubscriber (lists[]) · Generation ·
TrackedEvent · DailyUsage · CmsBridge · CmsPreset · Activity (legacy).

---

## 3. Build status — PRD compliance (~95%)

Everything in Phase 1 is built, deployed, and was verified end-to-end **on the live
site** (real AI image → safety check → watermarked preview → gate → subscribe → real
564 KB A4 PDF → real delivery email received). The Phase 2 **admin panel** was built
early as a bonus. Payments/Stripe were removed entirely by owner decision.

Known small gaps (the ~5%):
1. Post-processing (line cleanup / B&W) is enforced via prompt constraints, not an explicit image-processing stage.
2. Tracing guides are drawn by the AI, not by the PDF builder (same output, different mechanism).
3. Tracking: bridge "option selected"/"CTA click" are inferable but not separate events; "email opened" needs ESP webhooks; "return visit" not explicit.
4. Thank-you referral/premium placeholder slots not visually present (Phase 2 anyway).
5. Mini-quiz and teacher bridge templates not built (5 of the 7 template types exist; PRD required 3–5 ✅).
6. End-user login removed (Kinde deleted) — PRD allows anonymous credits only.

PRD-compliance cleanup already done: removed the legacy global newsletter popup (email
must only be asked at the gate) and all end-user login/Kinde code.

---

## 4. Accounts, keys, tokens & admin logins (WHO and WHERE)

> Values live in `.env` (git-ignored) locally and in Vercel env vars for production.
> **Never commit secret values to this public repo.**

| What | Identity / location | Notes |
|---|---|---|
| **Live site** | https://ai-printables.vercel.app | Production, auto-deploys from GitHub `main` |
| **GitHub repo** | github.com/thathaorg/Ai_printables- (**PUBLIC** — recommend making it private) | Accessible from GitHub account **Arupbiswas09** (not Arup-atcon). Local remote name: `thatha` |
| **Vercel** | Project `ai-printables`, team `arup-8240s-projects` (projectId `prj_Y892tQw3OP5CZ9IV6BE1cG6dcNaY`) | Personal access token stored as `VERCEL_TOKEN` in `.env` (used for env-var management + deploy checks). Rotate it at vercel.com → Settings → Tokens if ever exposed |
| **Admin login (app)** | `/admin-login` | Set `ADMIN_PASSWORD` (or `ADMIN_SECRET`) in `.env` and Vercel. Cookie `kiwiz_admin` is day-scoped HMAC. No Kinde / no user accounts for CMS. |
| **OpenRouter (AI)** | Billing email: arup@thatha.org · key in `.env` as `OPENROUTER_API_KEY` | ✅ Working. ~$8 credits (~$0.04/worksheet). Invoice GALLVM7Y-0001 ($9.58, due Aug 25 2026) — confirm paid or credits get revoked |
| **Neon (database)** | Connection string in `.env` as `DATABASE_URL` | Shared by local + production |
| **Resend (email)** | Account owner: 210106020@hbtu.ac.in · key in `.env` as `RESEND_API_KEY` | ⚠️ Sandbox: only emails the owner address until a domain is verified at resend.com/domains; then set `RESEND_FROM` |
| **Beehiiv (ESP)** | Not configured yet | Optional: `BEEHIIV_API_KEY` + `BEEHIIV_PUBLICATION_ID` to mirror subscribers |

---

## 5. Running & deploying

```bash
pnpm install                 # once
pnpm exec prisma db push     # only after schema changes
pnpm dev                     # → http://localhost:3000
```

**Deploying = pushing.** The Vercel project is git-connected: every push to `main` on
GitHub auto-builds and deploys. All env vars are already set in Vercel (with production
env vars). Note: Vercel blocks Next.js versions with known CVEs —
that's why the project is on Next 16.3.0; keep it updated.

Useful URLs: `/` home · `/create` studio · `/free/dino_coloring_01` sample bridge ·
`/thank-you` · `/admin/cms` CMS (admin login required) · `/api/presets` catalog.

---

## 6. Remaining work

**Blocking real-world usage:**
1. **Set `ADMIN_PASSWORD`** in Vercel + local `.env` so `/admin-login` → `/admin/cms` works.
2. **Resend domain verification** — so delivery emails reach everyone, not just the owner.
3. **Pay/confirm the OpenRouter invoice** before Aug 25 2026.
4. **Remove stale `KINDE_*` env vars** from Vercel when convenient (no longer used).

**Recommended:**
- Make the GitHub repo **private**.
- Rotate the Vercel token (it was shared in a chat once).
- Terms & Privacy pages (the email gate references them).

**Nice-to-have / Phase 2 backlog:** mini-quiz + teacher bridge templates · explicit
B&W post-processing · ESP open-tracking webhooks · Beehiiv sync · referral + premium
placeholders · upload-your-drawing · optional user accounts if needed later · more
presets (mazes, dot-to-dot, matching, cursive, seasonal) · remove leftover legacy pages
(`/dashboard`, i18n scaffolding) if desired.

---

## 7. How a non-developer launches a new campaign

1. Open **`/admin-login`**, enter `ADMIN_PASSWORD` → **`/admin/cms`** → *Bridge pages* → **New bridge page**.
2. Fill the form: headline "Free Christmas Coloring Pages", type "Theme picker",
   choices "Santa, Reindeer, Snowman", target worksheet "Coloring Page". **Save & publish.**
3. **Copy link** → paste into the Pinterest pin with `?utm_source=pinterest&utm_campaign=xmas25`.
4. Every visitor, generation, email, subscription and download from that pin is tracked
   with that bridge ID + UTM.

New *worksheet type*? *Presets tab* → **New worksheet preset** → write the AI
instructions once with `{placeholders}` → save → live on `/create` immediately.
No code, no deploy.
