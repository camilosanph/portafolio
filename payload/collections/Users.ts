import type { CollectionConfig } from 'payload'

// Admin/editor accounts for the Studio. Camilo logs in here to edit content.
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: { useAsTitle: 'email' },
  fields: [{ name: 'name', type: 'text' }],
}
