# Projects: rich, openable work entries — Design Spec

**Date:** 2026-06-30
**Status:** Draft — awaiting user review

Today each discipline owns an embedded `projects` array where every "project" is a flat
tile (`image · title · meta · tag`) that isn't clickable. This spec replaces that with
**Projects**: first-class entries, each with a **main picture** (cover) shown in the
discipline grid, that **open onto their own page** revealing a gallery of more
photos/videos plus an optional description and date.

Builds on the original portfolio spec (`2026-06-26-camilo-portfolio-design.md`). The dark,
editorial, image-forward direction and all existing modules are unchanged.

---

## 1. Decisions (locked with the user)

1. **Open mechanism — dedicated page.** A project opens at its own URL
   `/[lang]/[discipline]/[projectSlug]` (e.g. `/en/color-grading/nomad`). Shareable, SEO-able,
   consistent with the site's existing per-page metadata + sitemap. (Not a modal.)
2. **Data model — a top-level `projects` collection** related to `disciplines` (not an
   embedded array). Clean admin list, real per-project slug, gallery lives naturally on the
   project.
3. **Gallery videos — YouTube/Vimeo embeds** (a pasted URL), exactly like the existing
   showreel. No video-file uploads; `media` stays images-only.
4. **Signature modules stay + per-project before/after.** Each discipline keeps its
   signature module above the grid (Color Grading filter chips, Retouching before/after
   slider, Video/AI showreel). **Additionally**, a project's gallery may contain a
   before/after item.
5. **Existing production data is real** → a **data migration** moves current embedded
   projects into the new collection without loss.
6. **Detail page layout — sticky sidebar.** Title / date / description pin to the left while
   the gallery (photos, video facades, before/after sliders) scrolls on the right. Single
   column on mobile (meta block above gallery).
7. **Field defaults:** `description` = Lexical rich text (localized); `date` rendered as the
   **year**; `title` non-localized; per-project `published` toggle; `slug` unique **per
   discipline**.

---

## 2. Routes

| Route | Type | Purpose |
|---|---|---|
| `/[lang]/[discipline]` | dynamic | Discipline page — title block, signature module, **grid of project covers (each links to its project)** |
| `/[lang]/[discipline]/[project]` | dynamic | **NEW** — project page: sticky meta sidebar + gallery, shared footer |

- `force-dynamic` + `await connection()` (instant edits), same as existing pages.
- Unknown `lang`, unpublished/unknown `discipline`, or unpublished/unknown `project` →
  `notFound()`. A project whose `discipline.published` is false also 404s (parent hidden).
- The project must belong to the discipline in its URL, else `notFound()` (prevents
  `/retouching/<a-color-grading-slug>` resolving).

---

## 3. Content model (Payload)

### 3.1 New collection — `Projects` (`payload/collections/Projects.ts`)

`access.read: () => true`, `admin.useAsTitle: 'title'`,
`admin.defaultColumns: ['title','discipline','published','order']`, `defaultSort: 'order'`.
`admin.group: 'Content'` (optional) to sit beside Disciplines.

| Field | Type | Notes |
|---|---|---|
| `published` | checkbox, default `true` | sidebar. Off → hidden from grid, URL 404s. |
| `discipline` | relationship → `disciplines`, required | sidebar. `hasMany: false`. |
| `order` | number, default 0 | grid order within the discipline. |
| `title` | text, required | **not** localized (proper name, e.g. "NOMAD"). |
| `slug` | text, required, indexed | URL-safe; **unique per discipline** (see §3.3). Same `isValidSlug`/`slugify` validation + message as `Disciplines.slug`. |
| `cover` | upload → media, required | the **main picture**: grid tile + OG image. |
| `meta` | text, localized | existing caption, e.g. "Short film · 2:14". |
| `tag` | select `warm\|teal\|film\|bw`, optional | Color-Grading filter tag. |
| `date` | date, optional | `admin.date.pickerAppearance: 'dayOnly'`; rendered as **year**. |
| `description` | richText (lexical), localized, optional | a paragraph or two. |
| `gallery` | array | extra media — see §3.2. |

### 3.2 `gallery` array item

A discriminated row: pick `kind`, then conditional fields appear (mirrors the
`Disciplines.feature` conditional pattern).

| Field | Type | Condition |
|---|---|---|
| `kind` | select `image\|video\|beforeAfter`, required, default `image` | always |
| `image` | upload → media | `kind === 'image'` |
| `videoUrl` | text (YouTube/Vimeo) | `kind === 'video'` |
| `videoPoster` | upload → media, optional | `kind === 'video'` |
| `beforeImage` | upload → media | `kind === 'beforeAfter'` |
| `afterImage` | upload → media | `kind === 'beforeAfter'` |
| `caption` | text, localized, optional | always |

### 3.3 Per-discipline slug uniqueness

Field-level `unique: true` is global, but two disciplines may each have a "nomad". Enforce
**(discipline, slug)** uniqueness with a `validate` fn on `slug` that queries `projects` for
the same `discipline` + `slug` excluding the current `id`; on collision return a message
suggesting a free slug. Helper extracted to `lib/projects.ts` and unit-tested.

### 3.4 `Disciplines` change

Remove the embedded `projects` array field entirely. Everything else (feature, gridRatio,
beforeImage/afterImage, showreelUrl/showreelPoster, blurbs) is unchanged. Projects now
reference disciplines.

### 3.5 Registration

`payload.config.ts`: add `Projects` to `collections: [Users, Media, Disciplines, Projects]`.
Run `npm run generate:types` to refresh `payload-types.ts`.

---

## 4. Frontend

### 4.1 Discipline page (`app/(frontend)/[lang]/[discipline]/page.tsx`)

- Replace reads of `discipline.projects` with a `payload.find({ collection: 'projects', where: { discipline: { equals: discipline.id }, published: { equals: true } }, sort: 'order', locale, depth: 1 })`.
- Map to grid items adding `href: /${lang}/${slug}/${project.slug}`.
- `generateMetadata` currently uses `discipline.projects?.[0]?.image` for the OG image →
  switch to the first published project's `cover` (fallback: `showreelPoster`/`beforeImage`).

### 4.2 Grid components

- `ProjectGrid` (`components/area/ProjectGrid.tsx`): `GridItem` gains `href`. Wrap each
  `figure` in a `next/link` to `href` when present (covers + caption become the click target);
  keep current styling. Add a subtle hover affordance (image opacity / caption color) in
  keeping with existing hovers.
- `FilterGrid` (`components/area/FilterGrid.tsx`): unchanged behavior — still filters by `tag`;
  tiles now link through `ProjectGrid`.

### 4.3 Project page (`app/(frontend)/[lang]/[discipline]/[project]/page.tsx`)

`force-dynamic` + `await connection()`. Loads the project (by discipline slug + project slug,
published, `depth: 2` to populate cover, gallery uploads), the discipline (for the back link
+ number), `site-settings`, and the published disciplines list (for nav). 404 rules per §2.

**Layout — sticky sidebar** (`components/project/ProjectLayout` + small pieces):
- `AreaHeader` (reused) → wordmark + nav + lang switch.
- Two-column section, `px` clamp matching the site. Left column ≈ 34–38%,
  `position: sticky; top: <header+gap>`, `self-start`. Right column = gallery, flex-1.
- **Left (ProjectMeta):** back link `‹ <Discipline title>` → `/[lang]/[discipline]` (mirrors
  `AreaHeader`'s wordless `← <wordmark>` pattern — the discipline title is the back affordance,
  no extra "Back" word/string needed); big serif `title`; a mono meta line = `project.meta`
  with the **year** (from `date`) appended when present, e.g. `SHORT FILM · 2025`; rich-text
  `description` rendered with the `RichText` component from `@payloadcms/richtext-lexical/react`,
  wrapped in a serif/`prose`-style container scoped to the site palette.
- **Right (ProjectGallery):** render `gallery` items in order:
  - `image` → full-width `<img>` (lazy) + optional mono caption beneath (reuse the
    `figcaption` style from ProjectGrid).
  - `video` → **reuse the showreel facade.** Extract the poster+play→iframe facade from
    `Showreel.tsx` into a shared `components/area/VideoEmbed.tsx` (props: `url`, `posterUrl`,
    `label`); `Showreel` becomes a thin wrapper so its behavior/markup is unchanged. Gallery
    videos use `VideoEmbed` directly.
  - `beforeAfter` → reuse `BeforeAfter` (`beforeUrl`, `afterUrl`, `before`/`after` labels).
- **Mobile:** below `md`, columns stack — meta block first (static, not sticky), then gallery.
- `SiteFooter` (reused) with the same contact props as discipline pages.

`generateMetadata`: title `"<project.title> — <Discipline> — <SITE.name>"`, description from
`description` (plain-text excerpt) or `meta`, OG image = `cover` (card size), via `pageMetadata`.

### 4.4 Home page

`DisciplinesIndex` doesn't use projects → unaffected. No change needed (home OG uses
`settings.ogImage`).

---

## 5. SEO — sitemap

`app/sitemap.ts`: after loading published disciplines, also `payload.find` published
`projects` (depth 0, with their discipline slug) and emit `/[lang]/[discipline]/[projectSlug]`
entries (priority ~0.6, weekly), with the same hreflang `alternates` block. Keep the existing
build-time try/catch fallback.

---

## 6. Data migration (production Postgres)

Existing embedded projects live in Postgres table `disciplines_projects` (array field:
`_parent_id`, `_order`, `image_id`, `title`, `meta`, `tag`, locale rows for `meta`). Generate
a new timestamped migration (`DATABASE_URI=postgres://… npm run payload migrate:create
projects_collection`) and hand-edit its `up`/`down` to:

**up:**
1. Create the `projects` collection tables (cover/discipline FKs, `projects_gallery`,
   localized `projects_locales`, etc.) — the schema diff Payload generates.
2. **Backfill:** read each `disciplines_projects` row; for each, insert a `projects` row with
   `discipline_id = _parent_id`, `order = _order`, `title`, `cover_id = image_id`, `tag`,
   `published = true`, and a `slug` = `slugify(title)` made unique within the discipline
   (append `-2`, `-3`, … on collision). Copy localized `meta` into `projects_locales` per
   locale. `description`/`date`/`gallery` start empty. Do this in JS inside the migration
   (loop rows, compute slugs) using the migration's `payload`/`db` so slug logic matches
   `lib/slug.ts`.
3. Drop `disciplines_projects` (and its locale table).

**down:** recreate `disciplines_projects`, copy `title/meta/tag/cover→image/order` back, drop
`projects` tables. (Best-effort; gallery/description/date are not represented downstream.)

Register the new migration in `migrations/index.ts`. Local dev (SQLite) auto-syncs the schema
and ignores migrations; the committed migration runs in prod on first connect (existing
`prodMigrations` wiring). **The migration must be reviewed against a Postgres copy before
deploy** since it mutates real data.

---

## 7. Seed (`scripts/seed.ts`)

Rewrite the discipline loop to also create `projects`:
- Keep the per-slot distinct-media pattern (`uploadSlot`) — each cover/gallery image gets its
  own media doc by stable name (`<discipline>-<projectSlug>-cover`, `-g1`, …).
- For each discipline, create published `projects` (cover, title, slug, order, meta, tag) and
  give 2–3 of them a showcase `gallery`: a couple of images, one `video` item
  (`SHOWREEL_URL`), and — on a Retouching project — a `beforeAfter` item; add a `description`
  and `date` to a few so the new fields are visible out of the box.
- Reset both collections idempotently: delete `projects` then `disciplines` before reseeding
  (FK-safe order). Continue to never clobber Camilo's own uploads (filename-keyed).

---

## 8. i18n

The back link shows the discipline title (no new string). Gallery before/after items reuse the
existing `area.before` / `area.after`. Only one new key is needed:
- Add `area.playVideo` to `Dictionary` (`lib/i18n/dictionaries/types.ts`) + `en` (`"Play video"`)
  / `es` (`"Reproducir video"`), used as the label for gallery `video` facades. Keep
  `area.playShowreel` as-is for the discipline-level showreel.

---

## 9. Testing (TDD)

Unit tests (Vitest) precede implementation where they add value:
- `lib/__tests__/projects.test.ts` — per-discipline slug uniqueness helper (collision →
  suffix; different disciplines may share a slug; invalid input messages).
- Gallery normalization helper (map a raw `gallery` item → a typed render model:
  image/video/beforeAfter with resolved media URLs) — covers each `kind` and missing media.
- Extend existing `lib/__tests__/video.test.ts`/`youtube` coverage only if the shared
  `VideoEmbed` adds parsing logic (it reuses existing `getYouTubeId`/`vimeoEmbed`).
- `npm run typecheck` + `npm run test` + `npm run lint` green before done.

---

## 10. File-by-file change list

**New**
- `payload/collections/Projects.ts`
- `app/(frontend)/[lang]/[discipline]/[project]/page.tsx`
- `components/project/ProjectMeta.tsx`, `components/project/ProjectGallery.tsx` (+ layout)
- `components/area/VideoEmbed.tsx` (extracted facade)
- `lib/projects.ts` (slug-uniqueness + gallery normalization helpers)
- `lib/__tests__/projects.test.ts`
- `migrations/<ts>_projects_collection.{ts,json}`

**Changed**
- `payload/collections/Disciplines.ts` (remove `projects` array)
- `payload.config.ts` (register `Projects`)
- `app/(frontend)/[lang]/[discipline]/page.tsx` (query projects; link grid; OG image)
- `components/area/ProjectGrid.tsx` (`href` + link wrapper)
- `components/area/Showreel.tsx` (delegate to `VideoEmbed`)
- `app/sitemap.ts` (project URLs)
- `scripts/seed.ts` (seed projects + galleries)
- `migrations/index.ts` (register migration)
- `lib/i18n/dictionaries/{types,en,es}.ts` (add `area.playVideo`)
- `payload-types.ts` (regenerated)
- `README.md` (content guide: Projects collection)

---

## 11. Out of scope (YAGNI)

- Uploading video **files** (embeds only).
- Per-project showreel/filter modules (signature modules stay discipline-level).
- Projects belonging to multiple disciplines, cross-discipline reuse, tags/taxonomy beyond the
  existing color filter.
- Pagination / lightbox within the gallery, related-projects, next/prev navigation.
- Drag-reordering UX beyond the numeric `order` field.
