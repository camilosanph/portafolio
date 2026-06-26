'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LOCALES, type Locale } from '@/lib/i18n/config'

// Small EN / ES switch. Swaps the leading locale segment of the current path,
// preserving the rest (so you stay on the same discipline when switching).
export function LangSwitcher({ lang, className = '' }: { lang: Locale; className?: string }) {
  const pathname = usePathname() || `/${lang}`

  const swap = (l: Locale) => {
    const parts = pathname.split('/')
    if (parts.length > 1) parts[1] = l
    const joined = parts.join('/')
    return joined.startsWith('/') ? joined : `/${l}`
  }

  return (
    <div className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-nav ${className}`}>
      {LOCALES.map((l, i) => (
        <span key={l} className="flex items-center gap-2">
          {i > 0 && <span className="text-line">/</span>}
          <Link
            href={swap(l)}
            aria-current={l === lang ? 'true' : undefined}
            className={
              l === lang ? 'text-accent' : 'text-muted transition-colors hover:text-fg'
            }
          >
            {l.toUpperCase()}
          </Link>
        </span>
      ))}
    </div>
  )
}
