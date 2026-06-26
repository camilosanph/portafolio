import type { Metadata } from 'next'
import { LOCALES, type Locale } from '@/lib/i18n/config'
import { SITE } from '@/lib/site'

// Build per-page metadata with canonical + hreflang alternates for all locales.
export function pageMetadata({
  lang,
  path,
  title,
  description,
  image,
}: {
  lang: Locale
  path: string
  title: string
  description?: string
  image?: string | null
}): Metadata {
  const url = `${SITE.url}/${lang}${path}`
  const languages: Record<string, string> = {}
  for (const l of LOCALES) languages[l] = `${SITE.url}/${l}${path}`
  languages['x-default'] = `${SITE.url}/en${path}`

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url, languages },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE.name,
      type: 'website',
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}
