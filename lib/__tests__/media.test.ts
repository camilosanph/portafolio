import { describe, it, expect } from 'vitest'
import { mediaUrl, mediaAlt } from '../media'

describe('mediaUrl', () => {
  it('returns null for non-media values', () => {
    expect(mediaUrl(null)).toBeNull()
    expect(mediaUrl('123')).toBeNull()
    expect(mediaUrl(42)).toBeNull()
  })
  it('returns the base url when no size requested', () => {
    expect(mediaUrl({ url: '/a.jpg' })).toBe('/a.jpg')
  })
  it('returns the size variant url when present', () => {
    expect(mediaUrl({ url: '/a.jpg', sizes: { card: { url: '/a-card.jpg' } } }, 'card')).toBe(
      '/a-card.jpg',
    )
  })
  it('falls back to the base url when the size is missing', () => {
    expect(mediaUrl({ url: '/a.jpg', sizes: {} }, 'hero')).toBe('/a.jpg')
  })
})

describe('mediaAlt', () => {
  it('returns the alt text or empty string', () => {
    expect(mediaAlt({ url: '/a.jpg', alt: 'a portrait' })).toBe('a portrait')
    expect(mediaAlt(null)).toBe('')
  })
})
