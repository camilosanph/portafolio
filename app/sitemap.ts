import type { MetadataRoute } from 'next'
import { LOCALES } from '@/lib/i18n/config'
import { SITE } from '@/lib/site'
import { getPayloadClient } from '@/lib/payload'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let slugs: string[] = []
  try {
    const payload = await getPayloadClient()
    const res = await payload.find({
      collection: 'disciplines',
      where: { published: { equals: true } },
      limit: 50,
      depth: 0,
      sort: 'order',
    })
    slugs = res.docs.map((d) => d.slug).filter((s): s is string => Boolean(s))
  } catch {
    // DB may be unavailable during build; fall back to static paths only.
  }

  const paths = ['', ...slugs.map((s) => `/${s}`)]

  return paths.flatMap((path) => {
    const languages: Record<string, string> = {}
    for (const l of LOCALES) languages[l] = `${SITE.url}/${l}${path}`
    return LOCALES.map((lang) => ({
      url: `${SITE.url}/${lang}${path}`,
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.7,
      alternates: { languages },
    }))
  })
}
