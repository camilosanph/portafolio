import Link from 'next/link'

export type GridItem = {
  imageUrl: string | null
  title?: string | null
  meta?: string | null
  href?: string | null
}

// Responsive grid of work: image at the discipline's aspect ratio + a mono
// caption row (title left, meta right). 2px flush gutters. When an item has an
// `href` the whole cell links to that project page, with a quiet hover.
export function ProjectGrid({ items, ratio }: { items: GridItem[]; ratio: string }) {
  if (items.length === 0) return null
  return (
    <div className="mt-[clamp(24px,3vw,48px)] grid gap-[2px] [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
      {items.map((g, i) => {
        const inner = (
          <>
            <div className="w-full overflow-hidden bg-panel" style={{ aspectRatio: ratio }}>
              {g.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={g.imageUrl}
                  alt={g.title ?? ''}
                  loading="lazy"
                  className="h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-90"
                />
              )}
            </div>
            <figcaption className="flex justify-between px-1 py-3 font-mono text-[11px] tracking-[0.06em] text-muted">
              <span className="text-fg transition-colors group-hover:text-accent">{g.title}</span>
              <span>{g.meta}</span>
            </figcaption>
          </>
        )
        return (
          <figure key={i} className="relative m-0">
            {g.href ? (
              <Link href={g.href} className="group block">
                {inner}
              </Link>
            ) : (
              <div className="group">{inner}</div>
            )}
          </figure>
        )
      })}
    </div>
  )
}
