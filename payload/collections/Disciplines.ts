import type { CollectionConfig } from 'payload'

// The four editorial disciplines (Color Grading, Retouching, Video Editing, AI
// Video). Fixed in identity (seeded) but fully editable. `feature` selects each
// discipline's signature module; feature-specific fields show conditionally.
// `projects` is an embedded array — each discipline owns its own grid.
export const Disciplines: CollectionConfig = {
  slug: 'disciplines',
  access: { read: () => true },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'published', 'order', 'feature', 'tool'],
    description: 'The four discipline pages. Edit copy, images and the project grid for each.',
  },
  defaultSort: 'order',
  fields: [
    {
      name: 'published',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description:
          'When off, this discipline is hidden everywhere on the site — its page returns 404, and it is removed from the home index, the nav and the contact form. Turn off while preparing content; turn on to publish.',
      },
    },
    { name: 'title', type: 'text', required: true, localized: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'URL slug, e.g. "color-grading". Avoid changing once live.' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Controls 01–04 numbering and nav order.' },
    },
    {
      name: 'tool',
      type: 'text',
      admin: { description: 'Tools line, e.g. "DaVinci Resolve" or "Photoshop · Capture One".' },
    },
    {
      name: 'homeBlurb',
      type: 'textarea',
      localized: true,
      admin: { description: 'Short one-line blurb shown in the home Four Disciplines index.' },
    },
    {
      name: 'pageBlurb',
      type: 'textarea',
      localized: true,
      admin: { description: 'Longer italic blurb under the title on the discipline page.' },
    },
    {
      name: 'feature',
      type: 'select',
      required: true,
      defaultValue: 'filter',
      options: [
        { label: 'Filterable grid (chips)', value: 'filter' },
        { label: 'Before / After slider', value: 'beforeAfter' },
        { label: 'Showreel (video)', value: 'showreel' },
      ],
      admin: { description: 'The signature module shown above the project grid.' },
    },
    {
      name: 'gridRatio',
      type: 'select',
      defaultValue: '4/5',
      options: [
        { label: 'Portrait 4 : 5', value: '4/5' },
        { label: 'Landscape 16 : 10', value: '16/10' },
        { label: 'Widescreen 16 : 9', value: '16/9' },
      ],
      admin: { description: 'Aspect ratio for the project grid images.' },
    },
    // Before/After (Retouching)
    {
      name: 'beforeImage',
      type: 'upload',
      relationTo: 'media',
      admin: { condition: (data) => data.feature === 'beforeAfter' },
    },
    {
      name: 'afterImage',
      type: 'upload',
      relationTo: 'media',
      admin: { condition: (data) => data.feature === 'beforeAfter' },
    },
    // Showreel (Video Editing, AI Video)
    {
      name: 'showreelUrl',
      type: 'text',
      admin: {
        condition: (data) => data.feature === 'showreel',
        description: 'YouTube or Vimeo URL for the showreel.',
      },
    },
    {
      name: 'showreelPoster',
      type: 'upload',
      relationTo: 'media',
      admin: { condition: (data) => data.feature === 'showreel' },
    },
    // The project grid
    {
      name: 'projects',
      type: 'array',
      labels: { singular: 'Project', plural: 'Projects' },
      admin: { description: 'The grid of work below the signature module.' },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media' },
        { name: 'title', type: 'text' },
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
      ],
    },
  ],
}
