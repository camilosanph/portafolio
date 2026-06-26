import { Wordmark } from '@/components/chrome/Wordmark'
import { Nav, type NavItem } from '@/components/chrome/Nav'
import { LangSwitcher } from '@/components/chrome/LangSwitcher'
import type { Dictionary } from '@/lib/i18n/dictionaries/types'
import type { Locale } from '@/lib/i18n/config'

// Full-viewport cinematic hero: a single full-bleed photo with a dark vertical
// scrim, with all content centered over it.
export function Hero({
  wordmark,
  tagline,
  value,
  heroUrl,
  navItems,
  dict,
  lang,
}: {
  wordmark: string
  tagline: string
  value: string
  heroUrl: string | null
  navItems: NavItem[]
  dict: Dictionary
  lang: Locale
}) {
  return (
    <section className="relative h-screen min-h-[660px] overflow-hidden">
      <div
        className="absolute inset-0 bg-panel bg-cover bg-no-repeat"
        style={{
          backgroundImage: heroUrl ? `url("${heroUrl}")` : undefined,
          backgroundPosition: '50% 35%',
          filter: 'saturate(.92) contrast(1.02)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg,rgba(8,8,9,.5) 0%,rgba(8,8,9,.2) 38%,rgba(8,8,9,.72) 100%)',
        }}
      />

      <LangSwitcher lang={lang} className="absolute right-[clamp(20px,5vw,64px)] top-6 z-10" />

      <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="mb-[30px] font-mono text-[11px] uppercase tracking-eyebrow text-accent">
          {tagline}
        </div>
        <Wordmark text={wordmark} />
        <Nav items={navItems} variant="hero" className="mt-[42px]" />
        {value && (
          <p className="mt-[46px] max-w-[560px] font-serif text-[clamp(16px,2vw,22px)] italic leading-[1.5] text-muted">
            {value}
          </p>
        )}
      </div>

      <a
        href="#disciplines"
        className="absolute bottom-[26px] left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.32em] text-muted"
      >
        {dict.hero.scroll}
      </a>
    </section>
  )
}
