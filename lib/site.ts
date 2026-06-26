// Site-wide constants and fallbacks. CMS values (SiteSettings) take precedence
// at render time; these are the defaults when a field is empty.
export const SITE = {
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://camilosanchez.studio',
  name: 'Camilo Sanchez',
  contactEmail: 'hello@camilosanchez.studio',
  wordmark: 'CAMILO SANCHEZ',
} as const
