import { describe, expect, it } from 'vitest'
import { isValidSlug, slugify } from '../slug'

describe('isValidSlug', () => {
  it('accepts lowercase hyphenated slugs', () => {
    expect(isValidSlug('video-reel')).toBe(true)
    expect(isValidSlug('color-grading')).toBe(true)
    expect(isValidSlug('ai-video')).toBe(true)
    expect(isValidSlug('2026')).toBe(true)
  })
  it('rejects spaces and capitals (the bug: "Video Reel")', () => {
    expect(isValidSlug('Video Reel')).toBe(false)
    expect(isValidSlug('video reel')).toBe(false)
    expect(isValidSlug('Video-Reel')).toBe(false)
  })
  it('rejects leading/trailing/doubled hyphens and stray characters', () => {
    expect(isValidSlug('-video')).toBe(false)
    expect(isValidSlug('video-')).toBe(false)
    expect(isValidSlug('video--reel')).toBe(false)
    expect(isValidSlug('video/reel')).toBe(false)
    expect(isValidSlug('vi’deo')).toBe(false)
  })
  it('rejects empty and non-strings', () => {
    expect(isValidSlug('')).toBe(false)
    expect(isValidSlug(null)).toBe(false)
    expect(isValidSlug(undefined)).toBe(false)
    expect(isValidSlug(42)).toBe(false)
  })
})

describe('slugify', () => {
  it('turns free text into a valid slug', () => {
    expect(slugify('Video Reel')).toBe('video-reel')
    expect(slugify('  Color   Grading  ')).toBe('color-grading')
    expect(slugify('AI Video!!')).toBe('ai-video')
  })
  it('strips accents', () => {
    expect(slugify('Edición de Vídeo')).toBe('edicion-de-video')
  })
  it('always produces a valid slug (or empty)', () => {
    for (const input of ['Video Reel', 'Edición de Vídeo', '___', 'A', '2026 Reel']) {
      const out = slugify(input)
      expect(out === '' || isValidSlug(out)).toBe(true)
    }
  })
})
