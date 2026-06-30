import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { slugify } from '../lib/slug'

// ⚠️ HAND-WRITTEN — VALIDATE AGAINST A POSTGRES COPY BEFORE DEPLOY.
// This environment has no Postgres, so the schema DDL below could not be
// generated/verified with `payload migrate:create`. It mirrors the conventions
// of 20260626_170609_initial.ts. Before deploying to production, run the change
// against a *copy* of the prod DB (or regenerate the schema portion with
// `DATABASE_URI=postgres://… npm run payload migrate:create projects_collection`
// and splice the backfill block back in), then confirm the data moved across.
//
// What it does, in order, so no data is lost:
//   1. create the `projects` collection tables + enums
//   2. backfill every existing embedded `disciplines_projects` row into `projects`
//      (cover, title, tag, order, localized meta preserved; slug derived from the
//      title, unique per discipline; gallery/description/date start empty)
//   3. drop the old `disciplines_projects` tables
// Local dev (SQLite) auto-syncs the schema and ignores migrations entirely.

// Inlined (the shared lib/projects helper pulls in path-aliased imports that may
// not resolve in the migration runtime; slug logic must match lib/projects.ts).
function uniqueSlug(desired: string, taken: string[]): string {
  if (!taken.includes(desired)) return desired
  let n = 2
  while (taken.includes(`${desired}-${n}`)) n++
  return `${desired}-${n}`
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // 1. Schema — the projects collection.
  await db.execute(sql`
  CREATE TYPE "public"."enum_projects_gallery_kind" AS ENUM('image', 'video', 'beforeAfter');
  CREATE TYPE "public"."enum_projects_tag" AS ENUM('warm', 'teal', 'film', 'bw');
  CREATE TABLE "projects_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_projects_gallery_kind" DEFAULT 'image' NOT NULL,
  	"image_id" integer,
  	"video_url" varchar,
  	"video_poster_id" integer,
  	"before_image_id" integer,
  	"after_image_id" integer
  );
  CREATE TABLE "projects_gallery_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  CREATE TABLE "projects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"published" boolean DEFAULT true,
  	"discipline_id" integer,
  	"order" numeric DEFAULT 0,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"cover_id" integer,
  	"tag" "enum_projects_tag",
  	"date" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE "projects_locales" (
  	"meta" varchar,
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "projects_id" integer;
  ALTER TABLE "projects_gallery" ADD CONSTRAINT "projects_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_gallery" ADD CONSTRAINT "projects_gallery_video_poster_id_media_id_fk" FOREIGN KEY ("video_poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_gallery" ADD CONSTRAINT "projects_gallery_before_image_id_media_id_fk" FOREIGN KEY ("before_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_gallery" ADD CONSTRAINT "projects_gallery_after_image_id_media_id_fk" FOREIGN KEY ("after_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_gallery" ADD CONSTRAINT "projects_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_gallery_locales" ADD CONSTRAINT "projects_gallery_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_discipline_id_disciplines_id_fk" FOREIGN KEY ("discipline_id") REFERENCES "public"."disciplines"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_locales" ADD CONSTRAINT "projects_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "projects_gallery_order_idx" ON "projects_gallery" USING btree ("_order");
  CREATE INDEX "projects_gallery_parent_id_idx" ON "projects_gallery" USING btree ("_parent_id");
  CREATE INDEX "projects_gallery_image_idx" ON "projects_gallery" USING btree ("image_id");
  CREATE INDEX "projects_gallery_video_poster_idx" ON "projects_gallery" USING btree ("video_poster_id");
  CREATE INDEX "projects_gallery_before_image_idx" ON "projects_gallery" USING btree ("before_image_id");
  CREATE INDEX "projects_gallery_after_image_idx" ON "projects_gallery" USING btree ("after_image_id");
  CREATE UNIQUE INDEX "projects_gallery_locales_locale_parent_id_unique" ON "projects_gallery_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_discipline_idx" ON "projects" USING btree ("discipline_id");
  CREATE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");
  CREATE INDEX "projects_cover_idx" ON "projects" USING btree ("cover_id");
  CREATE INDEX "projects_updated_at_idx" ON "projects" USING btree ("updated_at");
  CREATE INDEX "projects_created_at_idx" ON "projects" USING btree ("created_at");
  CREATE UNIQUE INDEX "projects_locales_locale_parent_id_unique" ON "projects_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");`)

  // 2. Backfill existing embedded projects → the new collection.
  const oldRes = await db.execute(sql`
    SELECT "_parent_id" AS discipline_id, "_order" AS ord, "image_id", "title", "tag", "id" AS old_id
    FROM "disciplines_projects"
    ORDER BY "_parent_id", "_order"
  `)
  const oldRows = ((oldRes as unknown as { rows?: Record<string, unknown>[] }).rows ?? []) as Array<{
    discipline_id: number
    ord: number
    image_id: number | null
    title: string | null
    tag: string | null
    old_id: string
  }>

  const takenByDiscipline = new Map<number, string[]>()
  for (const row of oldRows) {
    const taken = takenByDiscipline.get(row.discipline_id) ?? []
    const slug = uniqueSlug(slugify(row.title ?? 'project') || 'project', taken)
    taken.push(slug)
    takenByDiscipline.set(row.discipline_id, taken)

    const insertRes = await db.execute(sql`
      INSERT INTO "projects" ("published", "discipline_id", "order", "title", "slug", "cover_id", "tag")
      VALUES (true, ${row.discipline_id}, ${row.ord}, ${row.title ?? 'Untitled'}, ${slug}, ${row.image_id}, ${row.tag}::"enum_projects_tag")
      RETURNING "id"
    `)
    const newId = (insertRes as unknown as { rows: { id: number }[] }).rows[0].id

    // Copy the localized caption (`meta`) rows across to projects_locales.
    const locRes = await db.execute(sql`
      SELECT "_locale", "meta" FROM "disciplines_projects_locales" WHERE "_parent_id" = ${row.old_id}
    `)
    const locRows = ((locRes as unknown as { rows?: Record<string, unknown>[] }).rows ?? []) as Array<{
      _locale: string
      meta: string | null
    }>
    for (const loc of locRows) {
      await db.execute(sql`
        INSERT INTO "projects_locales" ("meta", "_locale", "_parent_id")
        VALUES (${loc.meta}, ${loc._locale}::"_locales", ${newId})
      `)
    }
  }

  // 3. Drop the old embedded array now that its data is migrated.
  await db.execute(sql`
  DROP TABLE "disciplines_projects" CASCADE;
  DROP TABLE "disciplines_projects_locales" CASCADE;
  DROP TYPE "public"."enum_disciplines_projects_tag";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Recreate the embedded array and copy the core fields back (gallery,
  // description and date have no home downstream and are dropped).
  await db.execute(sql`
  CREATE TYPE "public"."enum_disciplines_projects_tag" AS ENUM('warm', 'teal', 'film', 'bw');
  CREATE TABLE "disciplines_projects" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"title" varchar,
  	"tag" "enum_disciplines_projects_tag"
  );
  CREATE TABLE "disciplines_projects_locales" (
  	"meta" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  ALTER TABLE "disciplines_projects" ADD CONSTRAINT "disciplines_projects_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "disciplines_projects" ADD CONSTRAINT "disciplines_projects_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."disciplines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "disciplines_projects_locales" ADD CONSTRAINT "disciplines_projects_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."disciplines_projects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "disciplines_projects_order_idx" ON "disciplines_projects" USING btree ("_order");
  CREATE INDEX "disciplines_projects_parent_id_idx" ON "disciplines_projects" USING btree ("_parent_id");
  CREATE INDEX "disciplines_projects_image_idx" ON "disciplines_projects" USING btree ("image_id");
  CREATE UNIQUE INDEX "disciplines_projects_locales_locale_parent_id_unique" ON "disciplines_projects_locales" USING btree ("_locale","_parent_id");`)

  const projRes = await db.execute(sql`
    SELECT "id", "discipline_id", "order", "title", "cover_id", "tag" FROM "projects" ORDER BY "discipline_id", "order"
  `)
  const projRows = ((projRes as unknown as { rows?: Record<string, unknown>[] }).rows ?? []) as Array<{
    id: number
    discipline_id: number | null
    order: number | null
    title: string | null
    cover_id: number | null
    tag: string | null
  }>
  for (const p of projRows) {
    if (p.discipline_id == null) continue
    const arrayId = `${p.id}`
    await db.execute(sql`
      INSERT INTO "disciplines_projects" ("_order", "_parent_id", "id", "image_id", "title", "tag")
      VALUES (${p.order ?? 0}, ${p.discipline_id}, ${arrayId}, ${p.cover_id}, ${p.title}, ${p.tag}::"enum_disciplines_projects_tag")
    `)
    const locRes = await db.execute(sql`SELECT "_locale", "meta" FROM "projects_locales" WHERE "_parent_id" = ${p.id}`)
    const locRows = ((locRes as unknown as { rows?: Record<string, unknown>[] }).rows ?? []) as Array<{
      _locale: string
      meta: string | null
    }>
    for (const loc of locRows) {
      await db.execute(sql`
        INSERT INTO "disciplines_projects_locales" ("meta", "_locale", "_parent_id")
        VALUES (${loc.meta}, ${loc._locale}::"_locales", ${arrayId})
      `)
    }
  }

  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_projects_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_projects_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "projects_id";
  DROP TABLE "projects_gallery_locales" CASCADE;
  DROP TABLE "projects_gallery" CASCADE;
  DROP TABLE "projects_locales" CASCADE;
  DROP TABLE "projects" CASCADE;
  DROP TYPE "public"."enum_projects_gallery_kind";
  DROP TYPE "public"."enum_projects_tag";`)
}
