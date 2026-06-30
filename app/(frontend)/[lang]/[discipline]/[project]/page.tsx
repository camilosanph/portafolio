import { connection } from 'next/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { resolveLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/getDictionary'
import { getPayloadClient } from '@/lib/payload'
import { mediaUrl } from '@/lib/media'
import { toGalleryItem, lexicalToPlainText } from '@/lib/projects'
import { pageMetadata } from '@/lib/seo'
import { SITE } from '@/lib/site'
import type { SocialLink } from '@/lib/socials'
import type { NavItem } from '@/components/chrome/Nav'
import { AreaHeader } from '@/components/chrome/AreaHeader'
import { ProjectMeta } from '@/components/project/ProjectMeta'
import { ProjectGallery } from '@/components/project/ProjectGallery'
import { SiteFooter } from '@/components/chrome/SiteFooter'

export const dynamic = 'force-dynamic'

// Resolve a project by its discipline + project slugs. Both must be published and
// the project must belong to that discipline (so /retouching/<color-slug> 404s).
async function findProject(disciplineSlug: string, projectSlug: string, lang: 'en' | 'es') {
  const payload = await getPayloadClient()
  const discRes = await payload.find({
    collection: 'disciplines',
    where: { slug: { equals: disciplineSlug }, published: { equals: true } },
    locale: lang,
    depth: 0,
    limit: 1,
  })
  const discipline = discRes.docs[0]
  if (!discipline) return null
  const projRes = await payload.find({
    collection: 'projects',
    where: {
      and: [
        { discipline: { equals: discipline.id } },
        { slug: { equals: projectSlug } },
        { published: { equals: true } },
      ],
    },
    locale: lang,
    depth: 2,
    limit: 1,
  })
  const project = projRes.docs[0]
  if (!project) return null
  return { discipline, project }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; discipline: string; project: string }>
}): Promise<Metadata> {
  const { lang: raw, discipline: dSlug, project: pSlug } = await params
  const lang = resolveLocale(raw)
  const found = await findProject(dSlug, pSlug, lang)
  if (!found) return {}
  const { discipline, project } = found
  const excerpt = lexicalToPlainText(project.description).slice(0, 160)
  return pageMetadata({
    lang,
    path: `/${dSlug}/${pSlug}`,
    title: `${project.title} — ${discipline.title} — ${SITE.name}`,
    description: excerpt || project.meta || discipline.pageBlurb || undefined,
    image: mediaUrl(project.cover, 'card'),
  })
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ lang: string; discipline: string; project: string }>
}) {
  await connection() // render per-request so Payload edits appear without a rebuild
  const { lang: raw, discipline: dSlug, project: pSlug } = await params
  const lang = resolveLocale(raw)
  const dict = getDictionary(lang)
  const payload = await getPayloadClient()

  const [found, settings, allDiscRes] = await Promise.all([
    findProject(dSlug, pSlug, lang),
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

  if (!found) notFound()
  const { discipline, project } = found

  const allDisciplines = allDiscRes.docs
  const email = settings.contactEmail || SITE.contactEmail
  const socials = (settings.socials ?? []) as SocialLink[]
  const navItems: NavItem[] = [
    ...allDisciplines.map((d) => ({ label: d.title, href: `/${lang}/${d.slug}` })),
    { label: dict.nav.contact, href: '#contact' },
  ]
  const projectTypes = allDisciplines.map((d) => d.title)

  const galleryItems = (project.gallery ?? []).map((g) => toGalleryItem(g))
  const year = project.date ? new Date(project.date).getFullYear() : null

  return (
    <main>
      <AreaHeader wordmark={settings.wordmark || SITE.wordmark} navItems={navItems} lang={lang} />
      <section className="px-[clamp(20px,5vw,72px)] pb-[clamp(48px,6vw,90px)] pt-[clamp(36px,5vw,72px)] md:flex md:gap-[clamp(32px,5vw,80px)]">
        <div className="md:sticky md:top-[88px] md:h-fit md:w-[36%] md:shrink-0">
          <ProjectMeta
            lang={lang}
            disciplineSlug={dSlug}
            disciplineTitle={discipline.title}
            title={project.title}
            meta={project.meta}
            year={year}
            description={project.description}
          />
        </div>
        <div className="mt-10 flex-1 md:mt-0">
          <ProjectGallery
            items={galleryItems}
            labels={{ before: dict.area.before, after: dict.area.after, playVideo: dict.area.playVideo }}
          />
        </div>
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
