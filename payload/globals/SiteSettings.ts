import type { GlobalConfig } from 'payload'

// Cross-site singletons: wordmark, tagline, contact email + availability note,
// social links, OG image. Present in the chrome/footer on every page.
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  access: { read: () => true },
  fields: [
    { name: 'wordmark', type: 'text', defaultValue: 'CAMILO SANCHEZ' },
    {
      name: 'tagline',
      type: 'text',
      localized: true,
      defaultValue: 'Color · Retouch · Motion',
      admin: { description: 'Hero eyebrow line.' },
    },
    {
      name: 'contactEmail',
      type: 'text',
      required: true,
      defaultValue: 'hello@camilosanchez.studio',
      admin: { description: 'Shown in the footer and used for the contact form mailto.' },
    },
    {
      name: 'availabilityNote',
      type: 'textarea',
      localized: true,
      defaultValue:
        'Available for commissions and full-time roles through 2026. Brands, agencies and creators welcome.',
    },
    {
      name: 'socials',
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'select',
          options: [
            { label: 'Instagram', value: 'instagram' },
            { label: 'Behance', value: 'behance' },
            { label: 'LinkedIn', value: 'linkedin' },
          ],
        },
        { name: 'url', type: 'text' },
      ],
    },
    { name: 'ogImage', type: 'upload', relationTo: 'media' },
  ],
}
