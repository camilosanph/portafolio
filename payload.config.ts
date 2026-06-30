import path from 'path'
import { fileURLToPath } from 'url'

import { buildConfig } from 'payload'
import type { Plugin } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import sharp from 'sharp'

import { LOCALES, DEFAULT_LOCALE } from './lib/i18n/config'
import { migrations } from './migrations'
import { Users } from './payload/collections/Users'
import { Media } from './payload/collections/Media'
import { Disciplines } from './payload/collections/Disciplines'
import { Projects } from './payload/collections/Projects'
import { SiteSettings } from './payload/globals/SiteSettings'
import { Home } from './payload/globals/Home'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const databaseURI =
  process.env.DATABASE_URI ||
  process.env.POSTGRES_URL || // Vercel Postgres
  process.env.DATABASE_URL || // Neon integration
  'file:./payload-local.db'
const usePostgres = databaseURI.startsWith('postgres')

// Production uses Postgres — DATABASE_URI, or Vercel/Neon's POSTGRES_URL / DATABASE_URL.
// Local dev falls back to a file-based SQLite DB so the CMS runs with zero setup.
// Auto-run migrations on connect — EXCEPT on Vercel Preview/Development builds.
// Vercel builds every deployment (PR previews included) with NODE_ENV=production,
// so a preview build would otherwise run migrations against whatever DB it
// connects to. If Preview shares Production's DATABASE_URI, a PR's preview build
// would mutate the production schema before the PR ever merges (this happened —
// a preview dropped a table prod was still serving). VERCEL_ENV is
// 'production' | 'preview' | 'development'; only the latter two skip. Non-Vercel
// production (VERCEL_ENV unset) still auto-migrates.
const skipAutoMigrate =
  process.env.VERCEL_ENV === 'preview' || process.env.VERCEL_ENV === 'development'

const db = usePostgres
  ? postgresAdapter({
      pool: { connectionString: databaseURI },
      // Regenerate after schema changes: `DATABASE_URI=postgres://… payload migrate:create`.
      prodMigrations: skipAutoMigrate ? undefined : migrations,
    })
  : sqliteAdapter({ client: { url: databaseURI } })

// The Vercel Blob adapter ALWAYS registers a client-side upload handler
// (VercelBlobClientUploadHandler) as an admin provider + import-map dependency —
// even when clientUploads is off (our case; we use server uploads). That client
// component transitively imports Payload's server logger (pino → worker_threads),
// which can't be bundled for the browser. Leaving it in is lose-lose: missing
// from the import map → blank admin; present → client build fails. We don't do
// client uploads, so strip the handler from the admin config entirely.
const BLOB_CLIENT_HANDLER = '@payloadcms/storage-vercel-blob/client#VercelBlobClientUploadHandler'
const stripBlobClientUploadHandler: Plugin = (config) => {
  const admin = config.admin as unknown as
    | { dependencies?: Record<string, unknown>; components?: { providers?: unknown[] } }
    | undefined
  if (admin?.dependencies) delete admin.dependencies[BLOB_CLIENT_HANDLER]
  if (admin?.components?.providers) {
    admin.components.providers = admin.components.providers.filter((p) => {
      const componentPath = typeof p === 'string' ? p : (p as { path?: string })?.path
      return componentPath !== BLOB_CLIENT_HANDLER
    })
  }
  return config
}

// Media uploads go to a Vercel Blob store (served from Blob's public CDN) when a
// token is present, otherwise to local disk (dev). Gating on the token keeps
// local dev zero-setup, and on Vercel it survives the ephemeral filesystem.
const storagePlugins = process.env.BLOB_READ_WRITE_TOKEN
  ? [
      vercelBlobStorage({
        // disablePayloadAccessControl → media docs get the DIRECT public Blob CDN
        // URL instead of being proxied through the Next function (loads from the
        // edge CDN, dodges Vercel's 4.5MB function-response cap). Safe — media
        // read access is already public.
        collections: { media: { disablePayloadAccessControl: true } },
        token: process.env.BLOB_READ_WRITE_TOKEN,
      }),
      // Must run AFTER vercelBlobStorage so it can remove what that plugin added.
      stripBlobClientUploadHandler,
    ]
  : []

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: '— Camilo Sanchez' },
  },
  editor: lexicalEditor(),
  collections: [Users, Media, Disciplines, Projects],
  globals: [SiteSettings, Home],
  localization: {
    locales: [...LOCALES],
    defaultLocale: DEFAULT_LOCALE,
    fallback: true,
  },
  secret: process.env.PAYLOAD_SECRET || 'dev-only-insecure-secret',
  db,
  sharp,
  plugins: storagePlugins,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
})
