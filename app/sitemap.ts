import type { MetadataRoute } from 'next'
import { LOCALES } from '@/lib/i18n/config'
import { SITE } from '@/lib/site'
import { getPayloadClient } from '@/lib/payload'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let disciplineSlugs: string[] = []
  let projectPaths: string[] = []
  try {
    const payload = await getPayloadClient()
    const [discRes, projRes] = await Promise.all([
      payload.find({
        collection: 'disciplines',
        where: { published: { equals: true } },
        limit: 50,
        depth: 0,
        sort: 'order',
      }),
      payload.find({
        collection: 'projects',
        where: { published: { equals: true } },
        limit: 1000,
        depth: 1,
        sort: 'order',
      }),
    ])
    disciplineSlugs = discRes.docs.map((d) => d.slug).filter((s): s is string => Boolean(s))
    const published = new Set(disciplineSlugs)
    // Only projects under a published discipline are reachable (the detail page
    // 404s otherwise). The discipline is populated at depth 1.
    projectPaths = projRes.docs
      .map((p) => {
        const disc = p.discipline
        const dSlug = disc && typeof disc === 'object' ? disc.slug : null
        return dSlug && p.slug && published.has(dSlug) ? `/${dSlug}/${p.slug}` : null
      })
      .filter((s): s is string => Boolean(s))
  } catch {
    // DB may be unavailable during build; fall back to static paths only.
  }

  const entries: { path: string; priority: number }[] = [
    { path: '', priority: 1 },
    ...disciplineSlugs.map((s) => ({ path: `/${s}`, priority: 0.7 })),
    ...projectPaths.map((p) => ({ path: p, priority: 0.6 })),
  ]

  return entries.flatMap(({ path, priority }) => {
    const languages: Record<string, string> = {}
    for (const l of LOCALES) languages[l] = `${SITE.url}/${l}${path}`
    return LOCALES.map((lang) => ({
      url: `${SITE.url}/${lang}${path}`,
      changeFrequency: 'weekly' as const,
      priority,
      alternates: { languages },
    }))
  })
}
