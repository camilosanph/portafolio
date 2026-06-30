import { mediaUrl } from './media'

// Make `desired` unique against `taken` by appending -2, -3, … (skipping any
// suffix already in use). Used by the seed + migration to derive per-discipline
// project slugs from titles without collisions.
export function uniqueSlug(desired: string, taken: string[]): string {
  if (!taken.includes(desired)) return desired
  let n = 2
  while (taken.includes(`${desired}-${n}`)) n++
  return `${desired}-${n}`
}

// The canonical project URL: /[lang]/[discipline]/[project].
export function projectHref(lang: string, disciplineSlug: string, projectSlug: string): string {
  return `/${lang}/${disciplineSlug}/${projectSlug}`
}

type Size = 'thumb' | 'card' | 'hero'

// A raw gallery row as stored on a project (media relations may be ids or
// populated docs depending on query depth — `mediaUrl` narrows safely).
export type RawGalleryItem = {
  kind: 'image' | 'video' | 'beforeAfter'
  image?: unknown
  videoUrl?: string | null
  videoPoster?: unknown
  beforeImage?: unknown
  afterImage?: unknown
  caption?: string | null
}

// A render-ready gallery item with media resolved to URLs, discriminated by kind.
export type GalleryRender =
  | { kind: 'image'; url: string | null; caption: string | null }
  | { kind: 'video'; url: string | null; posterUrl: string | null; caption: string | null }
  | { kind: 'beforeAfter'; beforeUrl: string | null; afterUrl: string | null; caption: string | null }

// Normalize a stored gallery row into a render model. Before/after images use the
// `hero` variant (full-bleed slider); images/posters default to `card`.
export function toGalleryItem(raw: RawGalleryItem, size: Size = 'card'): GalleryRender {
  const caption = raw.caption ?? null
  if (raw.kind === 'video')
    return { kind: 'video', url: raw.videoUrl ?? null, posterUrl: mediaUrl(raw.videoPoster, size), caption }
  if (raw.kind === 'beforeAfter')
    return {
      kind: 'beforeAfter',
      beforeUrl: mediaUrl(raw.beforeImage, 'hero'),
      afterUrl: mediaUrl(raw.afterImage, 'hero'),
      caption,
    }
  return { kind: 'image', url: mediaUrl(raw.image, size), caption }
}
