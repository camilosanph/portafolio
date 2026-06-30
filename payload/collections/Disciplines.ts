import type { CollectionConfig } from 'payload'
import { isValidSlug, slugify } from '../../lib/slug'

// The four editorial disciplines (Color Grading, Retouching, Video Editing, AI
// Video). Fixed in identity (seeded) but fully editable. `feature` selects each
// discipline's signature module; feature-specific fields show conditionally.
// Projects live in their own `projects` collection (related back to a discipline).
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
      // Slugs become URL segments (/es/<slug>). Reject anything that isn't
      // URL-safe — a value like "Video Reel" produces "/es/Video Reel", which
      // 404s when the page is opened. Suggest the corrected form in the message.
      validate: (value: string | null | undefined) => {
        if (typeof value !== 'string' || value.length === 0) return 'Add a URL slug.'
        if (!isValidSlug(value)) {
          const suggestion = slugify(value) || 'color-grading'
          return `Invalid slug "${value}". Use only lowercase letters, numbers and hyphens — no spaces, capitals or accents. Try: "${suggestion}".`
        }
        return true
      },
      admin: {
        description:
          'URL slug — lowercase words joined by hyphens, e.g. "color-grading". No spaces, capitals or accents. Avoid changing once live.',
      },
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
  ],
}
