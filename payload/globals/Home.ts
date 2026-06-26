import type { GlobalConfig } from 'payload'

// Home-page content: the full-bleed hero image, the italic value statement, and
// the three-photo proof strip at the bottom.
export const Home: GlobalConfig = {
  slug: 'home',
  label: 'Home Page',
  access: { read: () => true },
  fields: [
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    {
      name: 'valueStatement',
      type: 'textarea',
      localized: true,
      defaultValue:
        'Camilo Sanchez is a colorist and retoucher building images and films that feel effortless — restrained, tactile, made to last.',
    },
    {
      name: 'proofStrip',
      type: 'array',
      maxRows: 3,
      labels: { singular: 'Proof image', plural: 'Proof images' },
      admin: { description: 'Three photos shown as the bottom strip on the home page.' },
      fields: [{ name: 'image', type: 'upload', relationTo: 'media' }],
    },
  ],
}
