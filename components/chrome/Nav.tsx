import Link from 'next/link'

export type NavItem = { label: string; href: string }

// Inline nav used both in the hero (serif, large) and the sticky area header
// (mono, small). Internal links route via next/link; the Contact hash anchors
// to the footer present on every page.
export function Nav({
  items,
  variant,
  className = '',
}: {
  items: NavItem[]
  variant: 'hero' | 'header'
  className?: string
}) {
  const container =
    variant === 'hero' ? 'flex flex-wrap justify-center gap-9' : 'flex flex-wrap gap-6'
  const link =
    variant === 'hero'
      ? 'font-serif text-[22px] tracking-[0.02em] opacity-[0.85] hover:opacity-100 transition-opacity'
      : 'font-mono text-[11px] uppercase tracking-nav opacity-[0.72] hover:opacity-100 transition-opacity'

  return (
    <nav className={`${container} ${className}`}>
      {items.map((item) =>
        item.href.startsWith('#') ? (
          <a key={item.href} href={item.href} className={link}>
            {item.label}
          </a>
        ) : (
          <Link key={item.href} href={item.href} className={link}>
            {item.label}
          </Link>
        ),
      )}
    </nav>
  )
}
