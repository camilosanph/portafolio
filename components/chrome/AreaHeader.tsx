import Link from 'next/link'
import { Nav, type NavItem } from '@/components/chrome/Nav'
import { LangSwitcher } from '@/components/chrome/LangSwitcher'
import type { Locale } from '@/lib/i18n/config'

// Sticky header on discipline pages: back-to-home wordmark + the nav + language
// switch. The full nav collapses on small screens (back arrow returns to the
// home index).
export function AreaHeader({
  wordmark,
  navItems,
  lang,
}: {
  wordmark: string
  navItems: NavItem[]
  lang: Locale
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-line bg-bg px-[clamp(20px,5vw,64px)] py-5">
      <Link
        href={`/${lang}`}
        className="whitespace-nowrap font-mono text-[12px] uppercase tracking-[0.14em] transition-opacity hover:opacity-70"
      >
        ← {wordmark}
      </Link>
      <div className="flex items-center gap-6">
        <Nav items={navItems} variant="header" className="hidden md:flex" />
        <LangSwitcher lang={lang} />
      </div>
    </header>
  )
}
