import type { CollectionConfig } from 'payload'
import { isValidSlug, slugify } from '../../lib/slug'

// A piece of work inside a discipline. The `cover` is the grid tile + social
// preview; opening a project (its own /[lang]/[discipline]/[slug] page) reveals
// the `gallery` (photos, video embeds, before/after) plus an optional
// description + date. Replaces the old embedded `projects` array on Disciplines.
export const Projects: CollectionConfig = {
  slug: 'projects',
  access: { read: () => true },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'discipline', 'published', 'order'],
    description: 'Individual projects shown in each discipline grid. Each opens its own page.',
  },
  defaultSort: 'order',
  fields: [
    {
      name: 'published',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'When off, this project is hidden from its discipline grid and its URL 404s.',
      },
    },
    {
      name: 'discipline',
      type: 'relationship',
      relationTo: 'disciplines',
      required: true,
      admin: { position: 'sidebar', description: 'Which discipline this project belongs to.' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Grid order within the discipline.' },
    },
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      index: true,
      // URL segment (/[lang]/[discipline]/<slug>). Must be URL-safe AND unique
      // *within its discipline* — two disciplines may each have a "nomad", but one
      // discipline can't. Field-level `unique` is global, so the per-discipline
      // check is an async lookup here. (Payload's validate options generics are
      // unwieldy; typing them as `any` keeps this readable.)
      validate: async (value: string | null | undefined, { req, data, id }: any) => {
        if (typeof value !== 'string' || value.length === 0) return 'Add a URL slug.'
        if (!isValidSlug(value)) {
          const suggestion = slugify(value) || 'project'
          return `Invalid slug "${value}". Use only lowercase letters, numbers and hyphens — no spaces, capitals or accents. Try: "${suggestion}".`
        }
        const disciplineId =
          data?.discipline && typeof data.discipline === 'object' ? data.discipline.id : data?.discipline
        if (disciplineId && req?.payload) {
          const and: Record<string, unknown>[] = [
            { discipline: { equals: disciplineId } },
            { slug: { equals: value } },
          ]
          // On create there is no id yet; only exclude self when updating —
          // passing `not_equals: undefined` crashes the query driver.
          if (id != null) and.push({ id: { not_equals: id } })
          const dup = await req.payload.find({ collection: 'projects', where: { and }, limit: 1, depth: 0 })
          if (dup.docs.length > 0)
            return `Another project in this discipline already uses "${value}". Pick a different slug.`
        }
        return true
      },
      admin: {
        description:
          'URL slug — lowercase words joined by hyphens, e.g. "nomad". Unique within the discipline.',
      },
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: { description: 'Main picture — the grid tile and social preview.' },
    },
    {
      name: 'meta',
      type: 'text',
      localized: true,
      admin: { description: 'Caption meta, e.g. "Short film" or "Brand film · 2:14".' },
    },
    {
      name: 'tag',
      type: 'select',
      options: [
        { label: 'Warm', value: 'warm' },
        { label: 'Teal', value: 'teal' },
        { label: 'Film', value: 'film' },
        { label: 'B & W', value: 'bw' },
      ],
      admin: { description: 'Used by the Color Grading filter chips. Optional otherwise.' },
    },
    {
      name: 'date',
      type: 'date',
      admin: {
        description: 'Project date — shown as the year on the page.',
        date: { pickerAppearance: 'dayOnly' },
      },
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
      admin: { description: 'Optional write-up shown beside the gallery on the project page.' },
    },
    {
      name: 'gallery',
      type: 'array',
      labels: { singular: 'Gallery item', plural: 'Gallery' },
      admin: { description: 'More photos/videos shown on the project page, in order.' },
      fields: [
        {
          name: 'kind',
          type: 'select',
          required: true,
          defaultValue: 'image',
          options: [
            { label: 'Image', value: 'image' },
            { label: 'Video (YouTube/Vimeo)', value: 'video' },
            { label: 'Before / After', value: 'beforeAfter' },
          ],
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          admin: { condition: (_, sibling) => sibling?.kind === 'image' },
        },
        {
          name: 'videoUrl',
          type: 'text',
          admin: {
            condition: (_, sibling) => sibling?.kind === 'video',
            description: 'YouTube or Vimeo URL.',
          },
        },
        {
          name: 'videoPoster',
          type: 'upload',
          relationTo: 'media',
          admin: { condition: (_, sibling) => sibling?.kind === 'video' },
        },
        {
          name: 'beforeImage',
          type: 'upload',
          relationTo: 'media',
          admin: { condition: (_, sibling) => sibling?.kind === 'beforeAfter' },
        },
        {
          name: 'afterImage',
          type: 'upload',
          relationTo: 'media',
          admin: { condition: (_, sibling) => sibling?.kind === 'beforeAfter' },
        },
        { name: 'caption', type: 'text', localized: true },
      ],
    },
  ],
}
