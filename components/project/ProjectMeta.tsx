import Link from 'next/link'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { lexicalToPlainText } from '@/lib/projects'

// The project page's left column (sticky on desktop): back link to the
// discipline, the title, a mono meta line (caption + year) and the optional
// rich-text description.
export function ProjectMeta({
  lang,
  disciplineSlug,
  disciplineTitle,
  title,
  meta,
  year,
  description,
}: {
  lang: string
  disciplineSlug: string
  disciplineTitle: string
  title: string
  meta?: string | null
  year?: number | null
  // The raw Payload rich-text value (its generated type isn't structurally a
  // SerializedEditorState — root.type is `string`, not `'root'` — so it's typed
  // loosely here and narrowed at the RichText boundary below).
  description?: unknown
}) {
  const metaLine = [meta, year].filter(Boolean).join(' · ')
  const hasDescription = lexicalToPlainText(description).length > 0

  return (
    <div>
      <Link
        href={`/${lang}/${disciplineSlug}`}
        className="font-mono text-[11px] uppercase tracking-meta text-accent transition-opacity hover:opacity-70"
      >
        ‹ {disciplineTitle}
      </Link>
      <h1 className="mt-5 font-serif text-[clamp(36px,5vw,68px)] font-normal uppercase leading-[0.95] tracking-[0.01em]">
        {title}
      </h1>
      {metaLine && (
        <div className="mt-4 font-mono text-[11px] uppercase tracking-meta text-muted">{metaLine}</div>
      )}
      {hasDescription && (
        <div className="mt-6 max-w-[460px] font-serif text-[clamp(15px,1.5vw,18px)] leading-[1.6] text-muted [&_a]:text-accent [&_a]:underline [&_p]:mb-4 [&_p:last-child]:mb-0">
          <RichText data={description as SerializedEditorState} />
        </div>
      )}
    </div>
  )
}
