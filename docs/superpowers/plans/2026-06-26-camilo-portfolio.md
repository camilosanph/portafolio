# Camilo Sanchez Portfolio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Camilo Sanchez's bilingual editorial photo/video-editor portfolio — a Payload-CMS-backed Next.js site where Camilo edits all content in `/admin`, faithfully recreating the handoff design.

**Architecture:** Next.js 15 App Router renders dynamic pages reading the Payload local API; content lives in Payload globals (SiteSettings, Home) + collections (Users, Media, Disciplines with embedded projects). Signature features (before/after slider, filter grid, showreel) are client components driven by each discipline's `feature` field. EN/ES via `/[lang]` routing + dictionaries (UI) + Payload localized fields (content). Contact form is mailto-only.

**Tech Stack:** Next.js 15.4 · React 19 · Payload 3.85 · Tailwind 3.4 · TypeScript 5.6 · Vitest 2 · SQLite(local)/Postgres(prod) · Vercel Blob.

**Reference app:** `/Users/simon/personal/wave0/apps/davidgartnerportfolio` — copy boilerplate/patterns from here (payload admin routes, `lib/payload.ts`, `lib/media.ts`, embed components, payload.config storage gating). Adapt names/content to this spec.

**Spec:** `docs/superpowers/specs/2026-06-26-camilo-portfolio-design.md` — single source of truth for content/tokens.

## Global Constraints
- Exact design tokens: `--bg #0b0b0c`, `--panel #16161a`, `--fg #f3efe7`, `--muted rgba(243,239,231,.55)`, `--line rgba(243,239,231,.16)`, `--accent #c9b69b`.
- Fonts: Cormorant Garamond (serif display) + IBM Plex Mono (mono labels). Mono always uppercase, wide tracking.
- Locales: `['en','es']`, default `en`, fallback true. Discipline slugs: `color-grading`, `retouching`, `video-editing`, `ai-video`.
- Square/flush, no border-radius except circles, hairline dividers, minimal motion, reduced-motion guard.
- Pages `force-dynamic` + `await connection()`. Media via plain `<img>` + `mediaUrl()`.
- Standalone repo; its own `node_modules`. Node 22.

---

## File structure

```
package.json tsconfig.json next.config.mjs tailwind.config.ts postcss.config.mjs .eslintrc.json vitest.config.ts .env.local.example
middleware.ts payload.config.ts
app/(frontend)/[lang]/layout.tsx page.tsx [discipline]/page.tsx
app/(frontend)/globals.css
app/(payload)/layout.tsx admin/[[...segments]]/{page,not-found}.tsx admin/importMap.js api/[...slug]/route.ts api/graphql/route.ts api/graphql-playground/route.ts
app/robots.ts app/sitemap.ts
payload/collections/{Users,Media,Disciplines}.ts
payload/globals/{SiteSettings,Home}.ts
lib/payload.ts media.ts site.ts fonts.ts video.ts youtube.ts mailto.ts seo.ts socials.ts disciplines.ts
lib/i18n/config.ts getDictionary.ts dictionaries/{types,en,es}.ts
components/chrome/{Wordmark,Nav,LangSwitcher,AreaHeader,SiteFooter}.tsx
components/home/{Hero,DisciplinesIndex,ProofStrip}.tsx
components/area/{TitleBlock,ProjectGrid,BeforeAfter,FilterGrid,Showreel}.tsx
components/embeds/{VideoEmbed,YouTubeEmbed,VimeoEmbed}.tsx
components/contact/ContactForm.tsx
scripts/seed.ts
README.md
```

---

## Task 1: Scaffold & tooling

**Files:** Create `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `.eslintrc.json`, `vitest.config.ts`, `.env.local.example`.

**Produces:** A buildable Next 15 + Payload 3 + Tailwind + Vitest project; `npm install` succeeds, `npm run typecheck` passes on an empty app.

- [ ] Copy `package.json` deps/scripts from reference (same versions). Rename `"name": "camilosan"`. Keep scripts: dev/build/start/lint/typecheck/test/payload/generate:types/generate:importmap/seed (`prebuild: payload generate:importmap`).
- [ ] Copy `tsconfig.json`, `postcss.config.mjs`, `.eslintrc.json`, `vitest.config.ts` from reference verbatim (paths `@/*`, `@payload-config`).
- [ ] `next.config.mjs`: `withPayload`, `outputFileTracingRoot: dirname`, `images.remotePatterns` for `i.ytimg.com`, `img.youtube.com`, `images.unsplash.com` (seed source).
- [ ] `tailwind.config.ts`: map tokens to colors (`bg/panel/fg/muted/line/accent`), `fontFamily.serif=['var(--font-cormorant)',...]`, `fontFamily.mono=['var(--font-plex-mono)',...]`; content globs `app/**`,`components/**`.
- [ ] `.env.local.example`: `DATABASE_URI=`, `PAYLOAD_SECRET=`, `BLOB_READ_WRITE_TOKEN=`, `NEXT_PUBLIC_SITE_URL=https://camilosanchez.studio`.
- [ ] `npm install` in this folder. Run `npm run typecheck` (will pass once tsconfig present; no app files yet → expect clean or "no inputs" — acceptable). Commit `chore: scaffold next+payload project`.

---

## Task 2: Payload config, collections, globals, admin

**Files:** Create `payload.config.ts`, `payload/collections/{Users,Media,Disciplines}.ts`, `payload/globals/{SiteSettings,Home}.ts`, `lib/payload.ts`, `lib/i18n/config.ts` (needed by config), and the `app/(payload)/**` boilerplate.

**Interfaces — Produces:**
- `getPayloadClient(): Promise<Payload>` (`lib/payload.ts`)
- Collections slugs: `users`, `media`, `disciplines`. Globals slugs: `site-settings`, `home`.
- `LOCALES = ['en','es'] as const`, `DEFAULT_LOCALE = 'en'`, `type Locale`, `isLocale()`, `resolveLocale()` (`lib/i18n/config.ts`).
- After `npm run generate:types`: `payload-types.ts` exporting `Discipline`, `Media`, `SiteSetting`, `Home`, `User`.

- [ ] `lib/i18n/config.ts`:
```ts
export const LOCALES = ['en', 'es'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'
export const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v)
export const resolveLocale = (v: string | undefined | null): Locale =>
  v && isLocale(v) ? v : DEFAULT_LOCALE
```
- [ ] `payload.config.ts`: copy reference structure — db auto-detect (sqlite/postgres), `storagePlugins` + `stripBlobClientUploadHandler` gated on `BLOB_READ_WRITE_TOKEN`, `lexicalEditor()`, `sharp`, `localization: { locales: [...LOCALES], defaultLocale: DEFAULT_LOCALE, fallback: true }`, `collections: [Users, Media, Disciplines]`, `globals: [SiteSettings, Home]`, `admin.meta.titleSuffix: '— Camilo Sanchez'`, typescript outputFile `payload-types.ts`.
- [ ] `payload/collections/Users.ts`: copy reference (auth collection + `name` text).
- [ ] `payload/collections/Media.ts`: `slug:'media'`, `access.read:()=>true`, `upload.imageSizes` thumb(600)/card(1000)/hero(2000), `mimeTypes:['image/*']`, field `{name:'alt',type:'text',localized:true}`.
- [ ] `payload/collections/Disciplines.ts`: per spec §3 — fields `title`(text,localized,required), `slug`(text,required,unique,index), `order`(number,default 0), `tool`(text), `homeBlurb`(textarea,localized), `pageBlurb`(textarea,localized), `feature`(select required: filter/beforeAfter/showreel), `gridRatio`(select: `4/5`/`16/10`/`16/9`), conditional `beforeImage`/`afterImage` uploads (`admin.condition:(d)=>d.feature==='beforeAfter'`), conditional `showreelUrl`(text)/`showreelPoster`(upload) (`feature==='showreel'`), `projects` array `{image:upload, title:text, meta:text localized, tag:select warm/teal/film/bw}`. `admin.useAsTitle:'title'`, `defaultSort:'order'`, `access.read:()=>true`.
- [ ] `payload/globals/SiteSettings.ts`: per spec §3 (wordmark default `CAMILO SANCHEZ`, tagline localized default `Color · Retouch · Motion`, contactEmail required default `hello@camilosanchez.studio`, availabilityNote localized, socials array {platform select instagram/behance/linkedin, url text}, ogImage upload).
- [ ] `payload/globals/Home.ts`: heroImage upload, valueStatement textarea localized, proofStrip array (max 3) `{image:upload}`.
- [ ] `lib/payload.ts`: copy reference verbatim (`getPayloadClient`).
- [ ] Copy `app/(payload)/**` boilerplate from reference verbatim (layout, admin page+not-found, importMap.js, api routes). These are Payload-generated and identical across apps.
- [ ] Create `.env.local` with `PAYLOAD_SECRET=dev-secret`. Run `npm run generate:types`. Run `npm run dev`, confirm `/admin` loads the create-first-user screen. Stop. Commit `feat: payload config, collections, globals, admin`.

---

## Task 3: i18n dictionaries (TDD on config)

**Files:** Create `lib/i18n/dictionaries/{types,en,es}.ts`, `lib/i18n/getDictionary.ts`, `lib/i18n/__tests__/config.test.ts`.

**Interfaces — Produces:** `getDictionary(locale): Promise<Dictionary>`; `Dictionary` type. Consumes `lib/i18n/config.ts`.

- [ ] Write `lib/i18n/__tests__/config.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { resolveLocale, isLocale, DEFAULT_LOCALE } from '../config'
describe('i18n config', () => {
  it('accepts valid locales', () => { expect(isLocale('en')).toBe(true); expect(isLocale('es')).toBe(true) })
  it('rejects invalid', () => { expect(isLocale('fr')).toBe(false) })
  it('resolves unknown to default', () => { expect(resolveLocale('fr')).toBe(DEFAULT_LOCALE); expect(resolveLocale(undefined)).toBe('en') })
  it('passes through valid', () => { expect(resolveLocale('es')).toBe('es') })
})
```
- [ ] Run `npx vitest run lib/i18n` → PASS (config from Task 2).
- [ ] `lib/i18n/dictionaries/types.ts`: `Dictionary` interface covering all UI strings (nav.contact, common.scroll, common.fourDisciplines, area.playShowreel, area.before, area.after, area.backHome `← Camilo Sanchez`, contact.label, contact.namePlaceholder, contact.emailPlaceholder, contact.projectType, contact.messagePlaceholder, contact.send, filters.{all,warm,teal,film,bw}).
- [ ] `en.ts` / `es.ts`: implement `Dictionary` (EN verbatim from brief; ES translations). `getDictionary.ts`: `const dicts = { en: () => import('./dictionaries/en'), es: ... }` returning `.default` (or static map). Typecheck. Commit `feat: i18n dictionaries (en/es)`.

---

## Task 4: Design tokens, fonts, base CSS

**Files:** Create `lib/fonts.ts`, `app/(frontend)/globals.css`.

**Interfaces — Produces:** `cormorant`, `plexMono` next/font objects exposing `.variable` (`--font-cormorant`, `--font-plex-mono`).

- [ ] `lib/fonts.ts`:
```ts
import { Cormorant_Garamond, IBM_Plex_Mono } from 'next/font/google'
export const cormorant = Cormorant_Garamond({ subsets:['latin'], weight:['300','400','500'], style:['normal','italic'], variable:'--font-cormorant', display:'swap' })
export const plexMono = IBM_Plex_Mono({ subsets:['latin'], weight:['400','500'], variable:'--font-plex-mono', display:'swap' })
```
- [ ] `globals.css`: `@tailwind` layers; `:root` tokens (spec §7) incl. `--fd: var(--font-cormorant), Georgia, serif; --fm: var(--font-plex-mono), monospace`; base `html/body` (bg/fg, serif body); `a{color:inherit;text-decoration:none}`; `::selection{background:var(--accent);color:#0b0b0c}`; form reset (`input/textarea/select/button{font-family:inherit}`, placeholder `--muted`); `.ba` range input chrome (transparent appearance, `::-webkit-slider-thumb`/`::-moz-range-thumb` invisible, `cursor:ew-resize`); `prefers-reduced-motion` guard. Commit `feat: design tokens, fonts, base css`.

---

## Task 5: Pure helpers (TDD)

**Files:** Create `lib/media.ts`, `lib/site.ts`, `lib/video.ts`, `lib/youtube.ts`, `lib/mailto.ts`, `lib/socials.ts`, `lib/disciplines.ts`, `lib/seo.ts` + tests `lib/__tests__/{mailto,youtube,disciplines,media}.test.ts`.

**Interfaces — Produces:**
- `mediaUrl(value, size?): string|null`, `asMedia(value): Media|null`, `mediaAlt(value): string` (copy reference `lib/media.ts`).
- `getYouTubeId(url): string|null`, `youTubeEmbed(id): string`, `youTubeThumb(id, q?): string` (copy reference `lib/youtube.ts`).
- `getVimeoId(url): string|null` (copy reference `lib/video.ts`).
- `buildMailto({ email, projectType, name, fromEmail, message }): string`.
- `disciplineNumber(order): string` ("01"), `disciplineMeta(order, total): string` ("( 01 / 04 )").
- `findSocial(socials, platform): string|null`, `SITE` constants, `pageMetadata(...)`.

- [ ] `lib/__tests__/mailto.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { buildMailto } from '../mailto'
describe('buildMailto', () => {
  it('builds subject+body, url-encoded', () => {
    const u = buildMailto({ email:'a@b.co', projectType:'Color Grading', name:'Jo', fromEmail:'jo@x.co', message:'Hi there' })
    expect(u.startsWith('mailto:a@b.co?')).toBe(true)
    expect(u).toContain('subject=Project%20enquiry%20%E2%80%94%20Color%20Grading')
    expect(u).toContain('Jo'); expect(u).toContain('Hi%20there')
  })
})
```
- [ ] `lib/mailto.ts`:
```ts
export function buildMailto(o: { email: string; projectType?: string; name?: string; fromEmail?: string; message?: string }): string {
  const subject = `Project enquiry${o.projectType ? ` — ${o.projectType}` : ''}`
  const body = [o.name && `Name: ${o.name}`, o.fromEmail && `Email: ${o.fromEmail}`, '', o.message || ''].filter((l) => l !== undefined).join('\n')
  return `mailto:${o.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
```
- [ ] `lib/disciplines.ts`:
```ts
export const disciplineNumber = (order: number): string => String(order + 1).padStart(2, '0')
export const disciplineMeta = (order: number, total: number): string => `( ${disciplineNumber(order)} / ${String(total).padStart(2, '0')} )`
```
- [ ] `lib/__tests__/disciplines.test.ts`: assert `disciplineNumber(0)==='01'`, `disciplineMeta(0,4)==='( 01 / 04 )'`.
- [ ] Copy `lib/media.ts`, `lib/youtube.ts`, `lib/video.ts` from reference; copy `lib/__tests__/youtube.test.ts`. `lib/site.ts`: `SITE = { url: process.env.NEXT_PUBLIC_SITE_URL || 'https://camilosanchez.studio', contactEmail: 'hello@camilosanchez.studio', wordmark: 'CAMILO SANCHEZ' }`. `lib/socials.ts`: `SocialLink` type + `findSocial`. `lib/seo.ts`: `pageMetadata({lang,path,title,description})` (adapt reference). Run `npx vitest run` → all PASS. Commit `feat: pure helpers + tests`.

---

## Task 6: Chrome — layout, middleware, footer, contact form

**Files:** Create `middleware.ts`, `app/(frontend)/[lang]/layout.tsx`, `components/chrome/{Wordmark,Nav,LangSwitcher,SiteFooter}.tsx`, `components/contact/ContactForm.tsx`.

**Interfaces — Produces:**
- `<SiteFooter dict email availabilityNote socials disciplines lang />` (renders `#contact`).
- `<ContactForm dict email projectTypes />` (client; mailto submit via `buildMailto`).
- `<Nav items active? variant='hero'|'header' />`, `<LangSwitcher lang path />`, `<Wordmark/>`.
- Layout sets `<html lang>`, font variables, base metadata; rejects invalid `lang` via `notFound()`.

- [ ] `middleware.ts`: adapt reference — redirect bare `/` and locale-less paths to `/${DEFAULT_LOCALE}` (Accept-Language: if starts with `es` → `/es`). Matcher excludes `/admin`, `/api`, `/_next`, static, files with extensions.
- [ ] `app/(frontend)/[lang]/layout.tsx`: adapt reference — `import { cormorant, plexMono }`, `import '../globals.css'`, `if(!isLocale(lang)) notFound()`, `<html lang={lang} className={...variables}><body>{children}</body></html>`, `metadataBase` + title template `'%s · Camilo Sanchez'`.
- [ ] `ContactForm.tsx` (`'use client'`): controlled name/email/projectType/message; `onSubmit` → `e.preventDefault(); window.location.href = buildMailto({email, projectType, name, fromEmail:email, message})`. Markup per brief (2-col name/email, select of `projectTypes`, textarea, "SEND MESSAGE →" button bg `--fg`/text `--bg`). Borderless fields, 1px bottom rule.
- [ ] `SiteFooter.tsx`: per brief footer — left: mono "CONTACT" label, large serif `mailto:` email, italic availabilityNote, socials row; right: `<ContactForm>`. 2-col `repeat(auto-fit,minmax(300px,1fr))`. `id="contact"`.
- [ ] `Nav.tsx`, `LangSwitcher.tsx`, `Wordmark.tsx`: per brief. Nav items = disciplines (link to `/${lang}/${slug}`) + Contact (`#contact`). LangSwitcher swaps lang segment preserving path. Typecheck. Commit `feat: chrome, layout, footer, contact form`.

---

## Task 7: Home page

**Files:** Create `app/(frontend)/[lang]/page.tsx`, `components/home/{Hero,DisciplinesIndex,ProofStrip}.tsx`.

**Interfaces — Consumes:** `getPayloadClient`, `getDictionary`, `mediaUrl`, `SiteFooter`, `disciplineNumber`. **Produces:** Home route.

- [ ] `page.tsx`: `force-dynamic`; `await connection()`; resolve lang; load in parallel `payload.findGlobal('home')`, `findGlobal('site-settings')`, `payload.find('disciplines', sort:'order', limit:10, depth:1)` with `locale`. Compose `<Hero><DisciplinesIndex><ProofStrip><SiteFooter>`. `generateMetadata` via `pageMetadata`.
- [ ] `Hero.tsx`: full-viewport (`100vh; min-height:660px`) bg `heroImage` (`mediaUrl(...,'hero')`) + dark vertical gradient scrim; centered column: eyebrow tagline (mono, `.5em`, accent), wordmark `CAMILO`/`SANCHEZ` (serif clamp(42,9vw,124), uppercase, two lines), inline nav row (serif 22px, disciplines + Contact), italic value statement (serif muted, max 560), bottom `SCROLL ↓` cue. Use `dict` + tagline/value from CMS.
- [ ] `DisciplinesIndex.tsx`: `id="disciplines"`, mono label `dict.common.fourDisciplines`, then rows (link → `/${lang}/${slug}`) grid `78px 1fr auto`, 1px top hairline, padding `32px 0`: number (`disciplineNumber(order)`, mono accent), name (serif clamp(30,6vw,72)), italic homeBlurb (muted, right, max 380). Closing hairline under last.
- [ ] `ProofStrip.tsx`: 3-col grid gap 2px, each `home.proofStrip[i].image` `aspect-ratio:4/5; object-fit:cover`. Run `npm run dev`; once seeded (Task 10) verify; for now typecheck + build. Commit `feat: home page`.

---

## Task 8: Area page + project grid

**Files:** Create `app/(frontend)/[lang]/[discipline]/page.tsx`, `components/chrome/AreaHeader.tsx`, `components/area/{TitleBlock,ProjectGrid}.tsx`.

**Interfaces — Consumes:** payload, dict, `mediaUrl`, `disciplineMeta`, signature components (Task 9), `SiteFooter`. **Produces:** Area route; `<ProjectGrid items ratio />`.

- [ ] `page.tsx`: `force-dynamic`; `await connection()`; resolve lang; `payload.find('disciplines', where:{slug:{equals:params.discipline}}, locale, depth:2, limit:1)`. If none → `notFound()`. Load site-settings + all disciplines (for nav/total). Render `<AreaHeader>`, `<TitleBlock>`, the signature feature by `discipline.feature` (`beforeAfter`→`<BeforeAfter>`, `filter`→`<FilterGrid items.../>`, `showreel`→`<Showreel url poster ratio>` + `<ProjectGrid>`), `<SiteFooter>`. `generateMetadata` from discipline title/blurb. `generateStaticParams` optional (return the 4 slugs × locales) but keep `force-dynamic`.
- [ ] `AreaHeader.tsx`: sticky `top:0` header, bg `--bg`, 1px bottom border. Left `← Camilo Sanchez` (mono) → `/${lang}`. Right `<Nav variant='header'>`.
- [ ] `TitleBlock.tsx`: mono meta `disciplineMeta(order,total) — tool`, huge serif uppercase title (clamp 48,10vw,140), italic pageBlurb (muted max 620).
- [ ] `ProjectGrid.tsx`: grid `repeat(auto-fill,minmax(300px,1fr))` gap 2px; each figure: image (`mediaUrl(...,'card')`, `aspect-ratio:{ratio}`, object cover) + mono caption row (title `--fg` left, meta `--muted` right). Typecheck. Commit `feat: area page + project grid`.

---

## Task 9: Signature features (client)

**Files:** Create `components/area/{BeforeAfter,FilterGrid,Showreel}.tsx`, `components/embeds/{VideoEmbed,YouTubeEmbed,VimeoEmbed}.tsx`.

**Interfaces — Consumes:** `mediaUrl`, `getYouTubeId/youTubeEmbed`, `getVimeoId`, `ProjectGrid`, dict. **Produces:** the three feature components used by Task 8.

- [ ] `embeds/*`: copy reference `VideoEmbed`, `YouTubeEmbed` (facade poster→iframe), `VimeoEmbed`; restyle play button to `--accent` circle (no A/B side coloring). Remove i18n-specific props; keep `title`.
- [ ] `BeforeAfter.tsx` (`'use client'`): props `beforeUrl, afterUrl, dict`. `useState(ba=50)`. Centered max 560, aspect 4/5: before layer (img cover), after layer (img cover) with `clipPath: inset(0 ${100-ba}% 0 0)`; 2px white divider + circular `↔` handle at `${ba}%`; corner BEFORE/AFTER labels (`dict.area.before/after`); full-size invisible `<input class="ba" type=range min=0 max=100 value={ba} onInput>`.
- [ ] `FilterGrid.tsx` (`'use client'`): props `items (with tag), ratio, dict`. `useState(filter='all')`. Chips All/Warm/Teal/Film/`B & W` (`dict.filters`); active chip inverts (`--fg` bg/`--bg` text), others 1px `--line` border. Filter items by tag; render `<ProjectGrid items={filtered} ratio={ratio}>`.
- [ ] `Showreel.tsx` (`'use client'`): props `url, posterUrl, title`. Frame always `max-width:1080px; aspect-ratio:16/9`. Off state: poster + circular ▶ (accent) + "PLAY SHOWREEL" (`dict.area.playShowreel`); on click → `<VideoEmbed url poster>` autoplay. Typecheck + `npm run build`. Commit `feat: signature features (before/after, filter, showreel)`.

---

## Task 10: Seed script

**Files:** Create `scripts/seed.ts`.

**Interfaces — Consumes:** payload config, all collections/globals. **Produces:** `npm run seed` populating the DB.

- [ ] Helper `uploadImage(payload, id)`: dedupe via `Map<id, mediaDocId>`; `fetch('https://images.unsplash.com/photo-'+id+'?w=1600&q=80&auto=format&fit=crop')` → `arrayBuffer` → `payload.create({collection:'media', data:{alt:''}, file:{ data:Buffer, mimetype:'image/jpeg', name:id+'.jpg', size }})`. On fetch error: log, return null.
- [ ] Admin user (idempotent, like reference). Clear `disciplines` collection. Upsert globals.
- [ ] Upload all unique ids from spec §8. Update `site-settings` (wordmark/tagline/email/availabilityNote/socials/ogImage), `home` (heroImage, valueStatement, proofStrip[3]).
- [ ] Create 4 `disciplines` (locale 'en') with exact copy/tool/feature/gridRatio + `projects[]` (each `image`→uploaded media, title/meta/tag). Retouching: `beforeImage`(`1534528741775-53994a69daeb`), `afterImage`(use a distinct id e.g. `1517841905240-472988babdf9` so wipe is visible). Showreels: `video-editing` poster `1469474968028-56623f02e42e` + `showreelUrl https://www.youtube.com/embed/aqz-KE-bpKQ`; `ai-video` poster `1542327897-d73f4005b533` + same showreelUrl.
- [ ] Run `PAYLOAD_SECRET=dev-secret npm run seed`. Then `npm run dev` → verify `/en` and each `/en/<slug>` render fully. Commit `feat: seed placeholders + admin user`.

---

## Task 11: SEO, README, final verification

**Files:** Create `app/robots.ts`, `app/sitemap.ts`, `README.md`.

- [ ] `robots.ts`/`sitemap.ts`: adapt reference (sitemap lists `/`,`/en`,`/es`, and discipline slugs × locales; disallow `/admin`,`/api`).
- [ ] `README.md`: project overview, stack, local dev (install, `.env.local`, `npm run dev`, seed + default admin creds), content guide for Camilo (admin globals/collections), deploy notes (Vercel/Neon/Blob, migrate), fonts/types notes — adapt reference README.
- [ ] Final: `npm run typecheck && npm run lint && npx vitest run && npm run build` all green. Manual: hero, disciplines index, each area page (before/after drag, filter chips, showreel play), footer mailto, EN/ES switch, `/admin` edit reflects on refresh. Commit `docs: README + SEO`.

---

## Self-review notes
- **Spec coverage:** §1 stack→T1/T2; §2 routes→T6/T7/T8; §3 model→T2; §4 features→T9; §5 mailto→T5/T6; §6 structure→all; §7 tokens/fonts→T4; §8 content→T10; §9 i18n→T2/T3/T6; §10 seed→T10; §11 tests→T3/T5; §12 deploy→T1/T11. ✓
- **TDD** on pure logic (config, mailto, disciplines, youtube, media). UI/config verified by typecheck+build+manual (matches reference's testing posture).
- **Type consistency:** `mediaUrl(value,size)`, `buildMailto({...})`, `disciplineNumber(order)`, `getDictionary(locale)`, slugs, `feature` enum consistent across tasks.
