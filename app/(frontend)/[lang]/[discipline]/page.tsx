import { connection } from 'next/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { resolveLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/getDictionary'
import { getPayloadClient } from '@/lib/payload'
import { mediaUrl } from '@/lib/media'
import { pageMetadata } from '@/lib/seo'
import { SITE } from '@/lib/site'
import { disciplineMeta } from '@/lib/disciplines'
import { projectHref } from '@/lib/projects'
import type { SocialLink } from '@/lib/socials'
import type { NavItem } from '@/components/chrome/Nav'
import { AreaHeader } from '@/components/chrome/AreaHeader'
import { TitleBlock } from '@/components/area/TitleBlock'
import { ProjectGrid, type GridItem } from '@/components/area/ProjectGrid'
import { BeforeAfter } from '@/components/area/BeforeAfter'
import { FilterGrid } from '@/components/area/FilterGrid'
import { Showreel } from '@/components/area/Showreel'
import { SiteFooter } from '@/components/chrome/SiteFooter'

export const dynamic = 'force-dynamic'

async function findDiscipline(slug: string, lang: 'en' | 'es') {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'disciplines',
    // Only published disciplines are reachable; a hidden one's URL 404s.
    where: { slug: { equals: slug }, published: { equals: true } },
    locale: lang,
    depth: 2,
    limit: 1,
  })
  return res.docs[0] ?? null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; discipline: string }>
}): Promise<Metadata> {
  const { lang: raw, discipline: slug } = await params
  const lang = resolveLocale(raw)
  const discipline = await findDiscipline(slug, lang)
  if (!discipline) return {}
  // OG image: the first published project's cover, falling back to the
  // discipline's signature image.
  const payload = await getPayloadClient()
  const firstProj = await payload.find({
    collection: 'projects',
    where: { and: [{ discipline: { equals: discipline.id } }, { published: { equals: true } }] },
    locale: lang,
    sort: 'order',
    depth: 1,
    limit: 1,
  })
  const ogImage =
    mediaUrl(firstProj.docs[0]?.cover, 'card') ??
    mediaUrl(discipline.showreelPoster, 'card') ??
    mediaUrl(discipline.beforeImage, 'card')
  return pageMetadata({
    lang,
    path: `/${slug}`,
    title: `${discipline.title} — ${SITE.name}`,
    description: discipline.pageBlurb || discipline.homeBlurb || undefined,
    image: ogImage,
  })
}

export default async function AreaPage({
  params,
}: {
  params: Promise<{ lang: string; discipline: string }>
}) {
  await connection() // render per-request so Payload edits appear without a rebuild
  const { lang: raw, discipline: slug } = await params
  const lang = resolveLocale(raw)
  const dict = getDictionary(lang)
  const payload = await getPayloadClient()

  const [discipline, settings, allDiscRes] = await Promise.all([
    findDiscipline(slug, lang),
    payload.findGlobal({ slug: 'site-settings', locale: lang, depth: 1 }),
    payload.find({
      collection: 'disciplines',
      where: { published: { equals: true } },
      locale: lang,
      sort: 'order',
      limit: 10,
      depth: 0,
    }),
  ])

  if (!discipline) notFound()

  const projRes = await payload.find({
    collection: 'projects',
    where: { and: [{ discipline: { equals: discipline.id } }, { published: { equals: true } }] },
    locale: lang,
    sort: 'order',
    depth: 1,
    limit: 100,
  })
  const projects = projRes.docs

  const allDisciplines = allDiscRes.docs
  const total = allDisciplines.length || 4
  // Number by position among the visible disciplines (so hiding one re-sequences
  // 01–0N cleanly instead of leaving gaps).
  const idx = allDisciplines.findIndex((d) => d.id === discipline.id)
  const position = idx >= 0 ? idx : (discipline.order ?? 0)
  const email = settings.contactEmail || SITE.contactEmail
  const socials = (settings.socials ?? []) as SocialLink[]
  const navItems: NavItem[] = [
    ...allDisciplines.map((d) => ({ label: d.title, href: `/${lang}/${d.slug}` })),
    { label: dict.nav.contact, href: '#contact' },
  ]
  const projectTypes = allDisciplines.map((d) => d.title)

  const ratio = discipline.gridRatio || '4/5'
  const baseItems = projects.map((p) => ({
    imageUrl: mediaUrl(p.cover, 'card'),
    title: p.title,
    meta: p.meta,
    href: projectHref(lang, slug, p.slug),
  })) satisfies GridItem[]

  return (
    <main>
      <AreaHeader wordmark={settings.wordmark || SITE.wordmark} navItems={navItems} lang={lang} />
      <TitleBlock
        meta={`${disciplineMeta(position, total)}${discipline.tool ? ` — ${discipline.tool}` : ''}`}
        title={discipline.title}
        blurb={discipline.pageBlurb}
      />
      <section className="px-[clamp(20px,5vw,72px)] pb-[clamp(48px,6vw,90px)]">
        {discipline.feature === 'beforeAfter' && (
          <BeforeAfter
            beforeUrl={mediaUrl(discipline.beforeImage, 'hero')}
            afterUrl={mediaUrl(discipline.afterImage, 'hero')}
            beforeLabel={dict.area.before}
            afterLabel={dict.area.after}
          />
        )}
        {discipline.feature === 'showreel' && (
          <Showreel
            url={discipline.showreelUrl ?? null}
            posterUrl={mediaUrl(discipline.showreelPoster, 'hero')}
            label={dict.area.playShowreel}
          />
        )}
        {discipline.feature === 'filter' ? (
          <FilterGrid
            items={projects.map((p) => ({
              imageUrl: mediaUrl(p.cover, 'card'),
              title: p.title,
              meta: p.meta,
              tag: p.tag,
              href: projectHref(lang, slug, p.slug),
            }))}
            ratio={ratio}
            dict={dict}
          />
        ) : (
          <ProjectGrid items={baseItems} ratio={ratio} />
        )}
      </section>
      <SiteFooter
        dict={dict}
        email={email}
        availabilityNote={settings.availabilityNote}
        socials={socials}
        projectTypes={projectTypes}
      />
    </main>
  )
}
