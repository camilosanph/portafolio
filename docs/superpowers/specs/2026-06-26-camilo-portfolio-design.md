# Camilo Sanchez — Editorial Portfolio: Design Spec

**Date:** 2026-06-26
**Status:** Approved — proceed to implementation

A portfolio for **Camilo Sanchez**, a photo & video editor (color grading, retouching,
video editing, AI-assisted video). Dark, editorial, magazine-like. Image-forward, restrained,
premium. The work speaks; an easy path to get in touch. Camilo edits all content in an admin panel.

Design direction and exact values come from the handoff brief (`Portfolio_website_design_brief.zip`).
Fidelity is **high** — colors, type, spacing, interactions are final. Only photos + showreel are placeholders.

---

## 1. Stack & project shape

Standalone git repo at `/Users/simon/personal/camilosan`. Same stack as the reference app
(`/Users/simon/personal/wave0/apps/davidgartnerportfolio`):

- **Next.js 15 (App Router) · React 19 · Payload 3 (self-hosted, embedded admin at `/admin`) · Tailwind 3 · TypeScript**
- **DB:** SQLite file locally (zero setup) → Postgres in prod, auto-detected from `DATABASE_URI` / `POSTGRES_URL` / `DATABASE_URL`
- **Media:** local disk in dev → Vercel Blob in prod when `BLOB_READ_WRITE_TOKEN` is set (same gating + `stripBlobClientUploadHandler` workaround as reference)
- **Vitest** unit tests; deployable to Vercel + Neon + Blob

Decisions locked with the user:
- **Languages:** EN (default) + ES bilingual.
- **Contact form:** mailto only (no backend).
- **Disciplines:** fixed 4, content fully editable (seeded collection).
- **Initial content:** seed the brief's placeholders (incl. uploading Unsplash images into Media).

---

## 2. Routes

| Route | Type | Purpose |
|---|---|---|
| `/[lang]` | dynamic | Home — hero, Four Disciplines index, proof strip, footer |
| `/[lang]/[discipline]` | dynamic | Area page — title block, signature feature, project grid, footer |
| `/admin` | Payload | Studio — Camilo edits here |
| `#contact` | anchor | Shared contact footer on every page |

- `lang` ∈ `en` | `es`; default `en`. `middleware.ts` redirects `/` → `/en` (Accept-Language aware, falls back to en).
- Discipline slugs: `color-grading`, `retouching`, `video-editing`, `ai-video`.
- Pages use `export const dynamic = 'force-dynamic'` + `await connection()` so edits appear instantly.
- Invalid `lang` or unknown `discipline` slug → `notFound()`.

---

## 3. Content model (Payload)

### Globals
**SiteSettings** (`site-settings`)
- `wordmark` text, default `CAMILO SANCHEZ`
- `tagline` text, localized, default `Color · Retouch · Motion`
- `contactEmail` text, required, default `hello@camilosanchez.studio`
- `availabilityNote` textarea, localized, default = footer note (see §8)
- `socials` array: `{ platform: select(instagram|behance|linkedin), url: text }`
- `ogImage` upload → media

**Home** (`home`)
- `heroImage` upload → media
- `valueStatement` textarea, localized (see §8)
- `proofStrip` array (max 3): `{ image: upload → media }`

### Collections
**Users** (`users`) — Payload auth boilerplate; `name` text.

**Media** (`media`) — `upload` with `imageSizes` `thumb`(600) / `card`(1000) / `hero`(2000), `mimeTypes: ['image/*']`, field `alt` text localized. `access.read: () => true`.

**Disciplines** (`disciplines`) — the 4 fixed entries. `access.read: () => true`, `useAsTitle: title`, `defaultSort: order`.
- `title` text, **localized**, required (e.g. "Color Grading")
- `slug` text, required, unique, index (e.g. "color-grading")
- `order` number, default 0 — drives 01–04 numbering and nav order
- `tool` text (e.g. "DaVinci Resolve") — not localized
- `homeBlurb` textarea, **localized** — short blurb in the home index row
- `pageBlurb` textarea, **localized** — longer italic blurb on the area page
- `feature` select, required: `filter` | `beforeAfter` | `showreel`
- `gridRatio` select: `4/5` | `16/10` | `16/9` (per-discipline grid aspect)
- `beforeImage` upload → media — `admin.condition: feature === 'beforeAfter'`
- `afterImage` upload → media — same condition
- `showreelUrl` text — `admin.condition: feature === 'showreel'`
- `showreelPoster` upload → media — same condition
- `projects` array:
  - `image` upload → media
  - `title` text
  - `meta` text, **localized** (e.g. "Short film", "Brand film · 2:14")
  - `tag` select: `warm` | `teal` | `film` | `bw` — used only by the `filter` feature

**Modeling note:** projects are an **array inside Discipline** (not a separate collection) — mirrors the
brief's `items` structure, keeps each grid self-contained, simplest admin UX for lightweight image+caption rows.

---

## 4. Signature features

Selected per-discipline by `feature`. All faithful to the brief.

- **`beforeAfter` (Retouching)** — client component. Centered `max-width:560px`, `aspect-ratio:4/5`.
  Two real images stacked (`beforeImage` under, `afterImage` over). A full-size invisible `range`
  (0–100) drives a vertical wipe via `clip-path: inset(0 <100-v>% 0 0)` on the after layer. 2px white
  divider + circular `↔` handle at `<v>%`. Corner labels BEFORE / AFTER. Resets to 50 per visit.
- **`filter` (Color Grading)** — client component. Chips All / Warm / Teal / Film / B & W; active chip
  inverts (`--fg` bg, `--bg` text). Filters the project grid by `tag` (`all` shows everything).
- **`showreel` (Video Editing, AI Video)** — client facade embed (reference pattern). Reel frame is
  **always** centered `max-width:1080px`, `aspect-ratio:16/9` (per the brief's prototype, regardless of
  discipline); poster + circular ▶ + "PLAY SHOWREEL"; click swaps to autoplay `<iframe>` (YouTube/Vimeo
  via `showreelUrl`). `gridRatio` applies only to the project grid below, not the reel frame.

**Project grid** — `repeat(auto-fill, minmax(300px,1fr))`, `gap:2px`. Each cell: image at `gridRatio` +
mono caption row (`title` in `--fg` left, `meta` in `--muted` right).

---

## 5. Contact form — mailto only

The footer form renders exactly as designed (Name + Email row, Project type `<select>`, message
`<textarea>`, "SEND MESSAGE →"). Project-type options derive from the disciplines list. **On submit**
(client), build a `mailto:${contactEmail}` URL with `subject = "Project enquiry — <type>"` and
`body = "Name: <name>\nEmail: <email>\n\n<message>"`, then `window.location.href = mailto`. The large
footer email is a plain `mailto:` link. No network, no storage.

---

## 6. Code structure (mirrors reference)

```
app/(frontend)/[lang]/page.tsx                 # Home
app/(frontend)/[lang]/[discipline]/page.tsx    # Area page
app/(frontend)/[lang]/layout.tsx               # <html lang>, fonts, metadata
app/(frontend)/globals.css                     # tokens + base + .ba slider + reduced-motion
app/(payload)/...                              # admin + api (generated boilerplate)
app/robots.ts · app/sitemap.ts
payload/collections/{Users,Media,Disciplines}.ts
payload/globals/{SiteSettings,Home}.ts
components/chrome/{AreaHeader,SiteFooter,Wordmark,Nav,LangSwitcher}.tsx
components/home/{Hero,DisciplinesIndex,ProofStrip}.tsx
components/area/{TitleBlock,ProjectGrid,BeforeAfter,FilterGrid,Showreel}.tsx
components/embeds/{VideoEmbed,YouTubeEmbed,VimeoEmbed}.tsx
components/contact/ContactForm.tsx
lib/{payload,media,fonts,site,video,youtube,seo,socials,disciplines}.ts
lib/i18n/{config,getDictionary}.ts · lib/i18n/dictionaries/{en,es,types}.ts
scripts/seed.ts
payload.config.ts · next.config.mjs · tailwind.config.ts · middleware.ts
```

---

## 7. Styling, fonts, tokens

**Tokens** (`globals.css` `:root`):
| Token | Value |
|---|---|
| `--bg` | `#0b0b0c` |
| `--panel` | `#16161a` |
| `--fg` | `#f3efe7` |
| `--muted` | `rgba(243,239,231,.55)` |
| `--line` | `rgba(243,239,231,.16)` |
| `--accent` | `#c9b69b` |
| `--fd` | `'Cormorant Garamond', Georgia, serif` (via `--font-cormorant`) |
| `--fm` | `'IBM Plex Mono', monospace` (via `--font-plex-mono`) |

**Fonts** via `next/font/google`: Cormorant Garamond (300/400/500 + 400 italic), IBM Plex Mono (400/500).
**Tailwind** maps tokens → colors + `fontFamily.serif/mono`; exact `clamp()` scale from the brief recreated
with arbitrary values / CSS. Square/flush, no border-radius except circles, hairline dividers, minimal motion.
`::selection` accent bg. `prefers-reduced-motion` guard. `.ba` range input chrome (transparent thumb).
Images render via plain `<img>` using `mediaUrl(value, size)`.

**Key type sizes (fluid):** wordmark `clamp(42px,9vw,124px)`; area title `clamp(48px,10vw,140px)`;
discipline row name `clamp(30px,6vw,72px)`; email `clamp(26px,4.4vw,54px)`; mono labels 10–12px,
uppercase, letter-spacing `.12em`–`.5em`. Line-heights: titles ~`.92`; body/blurbs ~`1.5–1.6`.

---

## 8. Exact content (seed source of truth)

**Tagline:** `Color · Retouch · Motion`
**Value statement:** "Camilo Sanchez is a colorist and retoucher building images and films that feel effortless — restrained, tactile, made to last."
**Availability note (footer):** "Available for commissions and full-time roles through 2026. Brands, agencies and creators welcome."
**Contact email (placeholder):** `hello@camilosanchez.studio`
**Socials:** Instagram, Behance, LinkedIn (placeholder `#` URLs).

**Disciplines** (`order` · slug · title · tool · feature · gridRatio):
- `0` `color-grading` · Color Grading · DaVinci Resolve · **filter** · 16/10
  - home: "Look development and final grades for film, fashion and commercial work."
  - page: "Look development, shot-matching and final grades. From muted film stocks to clean commercial color — each project built around a single, deliberate palette."
- `1` `retouching` · Retouching · Photoshop · Capture One · **beforeAfter** · 4/5 (before/after img id `1534528741775-53994a69daeb` placeholder; use two distinct ids for visible wipe)
  - home: "High-end beauty and skin work that keeps texture honest."
  - page: "High-end beauty, skin and product retouching. Drag the handle to compare a raw capture with the finished frame — clean, but never plastic."
- `2` `video-editing` · Video Editing · Premiere Pro · After Effects · **showreel** · 16/9 (reel poster id `1469474968028-56623f02e42e`; showreelUrl `https://www.youtube.com/embed/aqz-KE-bpKQ`)
  - home: "Story-first edits and rhythm for brand films and music videos."
  - page: "Story-first edits, pacing and sound for brand films, fashion films and music videos. Below: the 2026 showreel and selected cuts."
- `3` `ai-video` · AI Video · Runway · Topaz · After Effects · **showreel** · 4/5 (reel poster id `1542327897-d73f4005b533`)
  - home: "Generative plates, upscales and motion extensions woven into live footage."
  - page: "Generative plates, set extensions, relighting and upscales — composited invisibly into live footage. A look at the assisted pipeline."

**Home hero image:** Unsplash id `1542327897-d73f4005b533`.
**Proof strip (3):** `1496345875659-11f7dd282d1d`, `1534528741775-53994a69daeb`, `1470071459604-3b5ec3a7fe05`.

**Projects per discipline** (image id · title · meta · tag) — lifted verbatim from the brief's `areasData`:

*Color Grading* (tags used by filter):
`1496345875659-11f7dd282d1d` NOMAD / Short film / teal · `1470071459604-3b5ec3a7fe05` HIGHLANDS / Travel / film ·
`1539109136881-3be0616acf4b` SUNROOM / Editorial / warm · `1426604966848-d7adac402bff` GRANITE / Commercial / teal ·
`1502823403499-6ccfcf4fb453` ATELIER / Fashion / warm · `1469474968028-56623f02e42e` DRIFT / Music video / film ·
`1534528741775-53994a69daeb` STILLS / Portrait / bw · `1518837695005-2083093ee35b` TIDE / Documentary / teal ·
`1485518882345-15568b007407` GOLDEN / Lookbook / warm

*Retouching:* `1494790108377-be9c29b29330` BLUSH / Beauty · `1438761681033-6461ffad8d80` LINEN / Editorial ·
`1531746020798-e6953c6e8e04` CORAL / Campaign · `1517841905240-472988babdf9` INDIGO / Portrait ·
`1529626455594-4ff0802cfb7e` EMBER / Beauty · `1485125639709-a60c3a500bf1` SLATE / Studio ·
`1524250502761-1ac6f2e30d43` IVORY / Lookbook · `1513379733131-47fc74b45fc7` NOIR / Cover

*Video Editing:* `1496345875659-11f7dd282d1d` NOMAD / Brand film · 2:14 · `1470071459604-3b5ec3a7fe05` HIGHLANDS / Travel · 1:48 ·
`1469474968028-56623f02e42e` DRIFT / Music video · 3:22 · `1518837695005-2083093ee35b` TIDE / Documentary · 4:05 ·
`1426604966848-d7adac402bff` GRANITE / Commercial · 0:45 · `1441974231531-c6227db76b6e` CANOPY / Spot · 0:30

*AI Video:* `1542327897-d73f4005b533` SYNTH / Gen plate · `1487412720507-e7ab37603c6f` EXTEND / Set extension ·
`1519699047748-de8e457a634e` RELIGHT / AI relight · `1496345875659-11f7dd282d1d` INPAINT / Cleanup ·
`1502823403499-6ccfcf4fb453` STYLE / Style transfer · `1524863479829-916d8e77f114` UPRES / Upscale 8K

Unsplash URL form: `https://images.unsplash.com/photo-<id>?w=<w>&q=80&auto=format&fit=crop`.

---

## 9. i18n

- **Static chrome strings** → `lib/i18n/dictionaries/{en,es}.ts` (typed by `types.ts`): nav "Contact",
  "Four Disciplines", "Scroll ↓", "Play showreel", "Before"/"After", "Contact", form placeholders
  (Name, Email, "Project type", "Tell me about the project"), "Send message →", filter chips
  (All/Warm/Teal/Film/"B & W"), "← Camilo Sanchez".
- **Editable content** → Payload `localized` fields (admin language selector); `fallback: true` so blank ES falls back to EN.
- Small EN/ES `LangSwitcher` in chrome (swaps the `lang` segment, preserves path).
- `lib/i18n/config.ts`: `LOCALES = ['en','es'] as const`, `DEFAULT_LOCALE='en'`, `resolveLocale`, `isLocale`.

---

## 10. Seeding (`npm run seed`)

Idempotent (clears + re-creates disciplines; upserts globals; creates admin if absent):
1. Admin user (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`, defaults documented in README).
2. **Upload placeholder images into Media** — fetch each *unique* Unsplash id once (≈30), create one
   Media doc per id (with alt), reuse by id. Resilient: on fetch failure, log + leave image unset.
3. SiteSettings + Home globals (EN), wiring hero/proof/og to seeded Media.
4. 4 Disciplines (EN) with exact copy/tool/feature/ratio + projects array (each project's `image` → seeded Media; tags set).
   Retouching before/after + showreel posters wired to seeded Media; `showreelUrl` set.

---

## 11. Testing

Vitest on pure helpers (UI components excluded):
- `lib/mailto.ts` `buildMailto()` — subject/body encoding.
- `lib/youtube.ts` / `lib/video.ts` — id parsing + embed URL.
- `lib/i18n/config.ts` — `resolveLocale` / `isLocale`.
- `lib/media.ts` — `mediaUrl` size selection / null-narrowing.
- `lib/disciplines.ts` — number formatting (`order` → "01", "( 0X / 04 )").

---

## 12. Deploy (built deployable; user runs it later)

Same path as reference: Vercel project rooted at this repo, Postgres (Neon) via `DATABASE_URI`/`POSTGRES_URL`,
Vercel Blob via `BLOB_READ_WRITE_TOKEN`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SITE_URL`. Postgres needs
`payload migrate` (build command `payload migrate && next build`) or `push:true` for this small schema.
`.env.local.example` + README document it.

---

## Out of scope
Real photography/showreel/copy (placeholders seeded), analytics, blog, CMS add/remove disciplines,
contact-form storage/email, third-person auth. All deferrable without architectural change.
