import { connection } from 'next/server'
import type { Metadata } from 'next'
import { resolveLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/getDictionary'
import { getPayloadClient } from '@/lib/payload'
import { mediaUrl } from '@/lib/media'
import { pageMetadata } from '@/lib/seo'
import { SITE } from '@/lib/site'
import type { SocialLink } from '@/lib/socials'
import type { NavItem } from '@/components/chrome/Nav'
import { Hero } from '@/components/home/Hero'
import { DisciplinesIndex } from '@/components/home/DisciplinesIndex'
import { ProofStrip } from '@/components/home/ProofStrip'
import { SiteFooter } from '@/components/chrome/SiteFooter'

// Content is read live from Payload, so Camilo's edits appear immediately.
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: raw } = await params
  const lang = resolveLocale(raw)
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({ slug: 'site-settings', locale: lang, depth: 1 })
  const wordmark = settings.wordmark || SITE.wordmark
  const tagline = settings.tagline || 'Color · Retouch · Motion'
  return pageMetadata({
    lang,
    path: '',
    title: `${wordmark} — ${tagline}`,
    description: settings.availabilityNote || tagline,
    image: mediaUrl(settings.ogImage, 'card'),
  })
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  await connection() // render per-request so Payload edits appear without a rebuild
  const { lang: raw } = await params
  const lang = resolveLocale(raw)
  const dict = getDictionary(lang)
  const payload = await getPayloadClient()

  const [home, settings, discRes] = await Promise.all([
    payload.findGlobal({ slug: 'home', locale: lang, depth: 1 }),
    payload.findGlobal({ slug: 'site-settings', locale: lang, depth: 1 }),
    payload.find({ collection: 'disciplines', locale: lang, sort: 'order', limit: 10, depth: 1 }),
  ])

  const disciplines = discRes.docs
  const email = settings.contactEmail || SITE.contactEmail
  const socials = (settings.socials ?? []) as SocialLink[]

  const navItems: NavItem[] = [
    ...disciplines.map((d) => ({ label: d.title, href: `/${lang}/${d.slug}` })),
    { label: dict.nav.contact, href: '#contact' },
  ]
  const projectTypes = disciplines.map((d) => d.title)
  const proofImages = (home.proofStrip ?? [])
    .map((p) => mediaUrl(p.image, 'card'))
    .filter((u): u is string => Boolean(u))

  return (
    <main>
      <Hero
        wordmark={settings.wordmark || SITE.wordmark}
        tagline={settings.tagline || 'Color · Retouch · Motion'}
        value={home.valueStatement || ''}
        heroUrl={mediaUrl(home.heroImage, 'hero')}
        navItems={navItems}
        dict={dict}
        lang={lang}
      />
      <DisciplinesIndex disciplines={disciplines} dict={dict} lang={lang} />
      <ProofStrip images={proofImages} />
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
