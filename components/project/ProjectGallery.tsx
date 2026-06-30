import { BeforeAfter } from '@/components/area/BeforeAfter'
import { VideoEmbed } from '@/components/area/VideoEmbed'
import type { GalleryRender } from '@/lib/projects'

// The project page's right column: the gallery rendered in order. Images show at
// their natural aspect; `video` items reuse the VideoEmbed facade; `beforeAfter`
// items reuse the BeforeAfter slider. Each may carry a mono caption.
export function ProjectGallery({
  items,
  labels,
}: {
  items: GalleryRender[]
  labels: { before: string; after: string; playVideo: string }
}) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-col gap-[clamp(28px,4vw,56px)]">
      {items.map((item, i) => (
        <figure key={i} className="m-0">
          {item.kind === 'video' ? (
            <VideoEmbed url={item.url} posterUrl={item.posterUrl} label={labels.playVideo} />
          ) : item.kind === 'beforeAfter' ? (
            <BeforeAfter
              beforeUrl={item.beforeUrl}
              afterUrl={item.afterUrl}
              beforeLabel={labels.before}
              afterLabel={labels.after}
            />
          ) : (
            item.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.url}
                alt={item.caption ?? ''}
                loading="lazy"
                className="block h-auto w-full bg-panel object-cover"
              />
            )
          )}
          {item.caption && (
            <figcaption className="mt-3 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
              {item.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  )
}
