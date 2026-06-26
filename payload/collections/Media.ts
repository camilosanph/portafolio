import type { CollectionConfig } from 'payload'

// All photography + posters. Rendered on the frontend via plain <img> using the
// generated size variants (thumb/card/hero). Public read; alt is localized.
export const Media: CollectionConfig = {
  slug: 'media',
  access: { read: () => true },
  upload: {
    imageSizes: [
      { name: 'thumb', width: 600 },
      { name: 'card', width: 1000 },
      { name: 'hero', width: 2000 },
    ],
    mimeTypes: ['image/*'],
  },
  fields: [{ name: 'alt', type: 'text', localized: true }],
}
