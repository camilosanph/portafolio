import type { Media } from '@/payload-types'

// Payload relations are `number | Media` depending on query depth. With depth>=1
// they're populated objects; these narrow safely.
export function asMedia(value: unknown): Media | null {
  if (value && typeof value === 'object' && 'url' in value) return value as Media
  return null
}

export function mediaUrl(value: unknown, size?: 'thumb' | 'card' | 'hero'): string | null {
  const m = asMedia(value)
  if (!m) return null
  if (size && m.sizes && m.sizes[size]?.url) return m.sizes[size]!.url as string
  return m.url ?? null
}

export function mediaAlt(value: unknown): string {
  return asMedia(value)?.alt ?? ''
}
