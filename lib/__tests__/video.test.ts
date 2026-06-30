import { describe, expect, it } from 'vitest'
import { getVimeoId, getVimeoHash, vimeoEmbed } from '../video'

describe('getVimeoId', () => {
  it('parses a plain vimeo.com link', () => {
    expect(getVimeoId('https://vimeo.com/824804225')).toBe('824804225')
  })
  it('parses a player.vimeo.com link', () => {
    expect(getVimeoId('https://player.vimeo.com/video/824804225')).toBe('824804225')
  })
  it('parses an unlisted link (id + privacy hash)', () => {
    expect(getVimeoId('https://vimeo.com/824804225/9e2c1f0abc')).toBe('824804225')
  })
  it('returns null for non-vimeo input', () => {
    expect(getVimeoId('https://youtube.com/watch?v=x')).toBeNull()
    expect(getVimeoId(null)).toBeNull()
  })
})

describe('getVimeoHash', () => {
  it('extracts the hash from the path form', () => {
    expect(getVimeoHash('https://vimeo.com/824804225/9e2c1f0abc')).toBe('9e2c1f0abc')
  })
  it('extracts the hash from the ?h= query form', () => {
    expect(getVimeoHash('https://player.vimeo.com/video/824804225?h=9e2c1f0abc')).toBe('9e2c1f0abc')
  })
  it('ignores unrelated trailing query params', () => {
    expect(getVimeoHash('https://vimeo.com/824804225/9e2c1f0abc?share=copy')).toBe('9e2c1f0abc')
  })
  it('returns null when there is no hash', () => {
    expect(getVimeoHash('https://vimeo.com/824804225')).toBeNull()
  })
})

describe('vimeoEmbed', () => {
  it('builds a player URL for a plain link', () => {
    expect(vimeoEmbed('https://vimeo.com/824804225')).toBe(
      'https://player.vimeo.com/video/824804225?autoplay=1',
    )
  })
  it('includes the privacy hash for unlisted videos (else the player errors)', () => {
    expect(vimeoEmbed('https://vimeo.com/824804225/9e2c1f0abc')).toBe(
      'https://player.vimeo.com/video/824804225?h=9e2c1f0abc&autoplay=1',
    )
  })
  it('returns null for non-vimeo input', () => {
    expect(vimeoEmbed('https://youtu.be/dQw4w9WgXcQ')).toBeNull()
    // Camilo's real YouTube showreel must NOT be mistaken for a Vimeo link —
    // the Showreel then falls through to the (unchanged) YouTube embed path.
    expect(vimeoEmbed('https://www.youtube.com/watch?v=JYQsVM5FXjU')).toBeNull()
  })
})
