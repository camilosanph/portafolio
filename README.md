# Camilo Sanchez — Editorial Portfolio

A quiet, image-forward portfolio for **Camilo Sanchez**, a photo & video editor working in
**color grading, retouching, video editing and AI-assisted video**. Bilingual (EN/ES), self-hosted CMS.

**Stack:** Next.js 15 (App Router) · React 19 · Payload 3 (self-hosted CMS, embedded admin) ·
Postgres (prod) / SQLite (local) · Tailwind · TypeScript. Deploys on Vercel.

```
/[lang]                         Home — hero, Four Disciplines index, proof strip  (dynamic)
/[lang]/[discipline]            Discipline page — feature + project grid          (dynamic)
                                slugs: color-grading · retouching · video-editing · ai-video
/[lang]/[discipline]/[project]  Project page — cover, gallery, description, date  (dynamic)
/admin                          Payload Studio — Camilo edits here
```

Each discipline surfaces a **signature feature**: Color Grading → a filterable grid; Retouching →
a before/after slider; Video Editing & AI Video → a showreel. A shared contact footer (`#contact`)
sits on every page.

---

## Local development

This app has its **own isolated `node_modules`** (it pins React 19 / Next 15 for Payload), so install
from this folder.

```bash
npm install
cp .env.local.example .env.local      # set PAYLOAD_SECRET to any random string
npm run dev                           # http://localhost:3000  (→ /en)

# optional: populate the site with the design's placeholder content + an admin user
PAYLOAD_SECRET=dev-secret npm run seed
```

With no `DATABASE_URI`, the CMS uses a local **SQLite** file (`payload-local.db`, git-ignored) — zero
setup. The seed downloads the brief's placeholder photography into Media and creates an admin:
`admin@camilosanchez.studio` / `changeme123` (override with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

Useful scripts: `npm run dev | build | start | lint | typecheck | test | seed | generate:types`.

---

## Content guide (for Camilo)

1. Go to **`/admin`** and log in.
2. **Globals** (one-offs):
   - **Site Settings** — wordmark, tagline, **contact email** (used by the footer + form), the
     availability note, and social links (Instagram / Behance / LinkedIn).
   - **Home Page** — the full-bleed **hero image**, the italic **value statement**, and the three
     **proof-strip** photos.
3. **Collections**:
   - **Disciplines** — the four pages. Each has a **Published** toggle in the sidebar: turn it off to
     hide a discipline from the site (its page 404s and it's pulled from the home index, nav and contact
     form) while you prepare its content; turn it on to publish. For each: title, slug, tools line, the
     home + page blurbs, the **signature feature** (filter grid / before-after / showreel) and the grid
     aspect ratio. Retouching shows **before/after** image fields; the showreel disciplines show a
     **showreel URL** (YouTube/Vimeo) + a **poster** image. These fields appear only when the matching
     feature is selected.
   - **Projects** — the individual works shown in each discipline's grid. A project belongs to one
     **discipline** and has its own **Published** toggle and order. Its **cover** is the grid tile;
     opening it (at `/[lang]/[discipline]/[slug]`) shows the **gallery** — any mix of photos, **video**
     embeds (YouTube/Vimeo) and **before/after** pairs — plus an optional **description** and **date**,
     the caption **meta**, and the colour **tag** (still used by the Color Grading filter). The slug must
     be unique within its discipline.
   - **Media** — every photo/poster you upload.
4. **Languages:** translatable fields (titles, blurbs, taglines, captions) show an **EN/ES** selector.
   Anything left blank in Spanish falls back to English.
5. **Publishing is instant** — pages render live, so a save shows on the site immediately (no rebuild).
6. The **contact form** is mailto-only: on send it opens the visitor's email client with the project
   type, name and message pre-filled to your contact email. Nothing is stored.

> The seed loads the design's placeholder photos and copy. Replace them with Camilo's real work in the admin.

---

## Production deployment (for the maintainer)

Self-hosted: **you own the database and media** (Postgres + a Vercel Blob store on your own account).

### 1. Database — Postgres
Create a Postgres DB (e.g. [Neon](https://neon.tech)) and set `DATABASE_URI=postgres://…` in Vercel (any
`postgres://` URI switches the adapter from SQLite to Postgres). The initial schema migration is committed
in `migrations/` and wired as `prodMigrations` in `payload.config.ts`, so **production auto-applies it on
first connect** — no migrate build step or build-command change needed.

After any future schema change (collections/fields), regenerate the migration against a Postgres DB and
commit it:
```bash
DATABASE_URI=postgres://… PAYLOAD_SECRET=… npx payload migrate:create <name>   # then commit migrations/
```
(Local dev uses SQLite and auto-syncs the schema; migrations only run in production.)

### 2. Media storage — Vercel Blob
Vercel's filesystem is ephemeral, so uploads go to a [Vercel Blob](https://vercel.com/docs/vercel-blob)
store. Create one, connect it to the project (injects `BLOB_READ_WRITE_TOKEN`), and Payload uses it
automatically; if unset, uploads fall back to local disk (dev only). Media renders via plain `<img>`.

### 3. Secrets
`PAYLOAD_SECRET` = a long random string (`openssl rand -base64 32`).
`NEXT_PUBLIC_SITE_URL=https://camilosanchez.studio`.

### 4. Vercel project
New Vercel project on this repo → **Root Directory** = this folder → add the env vars above → deploy.
Auto-deploys on merge to `main`. Visit `/admin` once to create the first user, or run `npm run seed`
against the prod `DATABASE_URI`.

---

## Notes
- **Fonts:** Cormorant Garamond (display serif) + IBM Plex Mono (labels) via `next/font/google`.
- **Why dynamic pages:** Home and discipline pages render per-request so Camilo's edits appear instantly.
- **Types:** after changing collections/globals, run `npm run generate:types` to refresh `payload-types.ts`.
- Design spec & plan live in `docs/superpowers/`.
```
