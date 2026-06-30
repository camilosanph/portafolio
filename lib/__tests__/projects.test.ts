import { describe, it, expect } from 'vitest'
import { uniqueSlug, projectHref, toGalleryItem } from '../projects'

describe('uniqueSlug', () => {
  it('returns the desired slug when free', () => {
    expect(uniqueSlug('nomad', [])).toBe('nomad')
    expect(uniqueSlug('nomad', ['other'])).toBe('nomad')
  })
  it('appends an incrementing suffix on collision', () => {
    expect(uniqueSlug('nomad', ['nomad'])).toBe('nomad-2')
    expect(uniqueSlug('nomad', ['nomad', 'nomad-2'])).toBe('nomad-3')
  })
  it('skips suffixes that are themselves taken', () => {
    expect(uniqueSlug('nomad', ['nomad', 'nomad-3'])).toBe('nomad-2')
    expect(uniqueSlug('nomad', ['nomad', 'nomad-2', 'nomad-3'])).toBe('nomad-4')
  })
})

describe('projectHref', () => {
  it('builds the localized project path', () => {
    expect(projectHref('en', 'color-grading', 'nomad')).toBe('/en/color-grading/nomad')
    expect(projectHref('es', 'retouching', 'blush')).toBe('/es/retouching/blush')
  })
})

describe('toGalleryItem', () => {
  it('maps an image item to a resolved url', () => {
    const r = toGalleryItem({ kind: 'image', image: { url: '/a.jpg' }, caption: 'one' })
    expect(r).toEqual({ kind: 'image', url: '/a.jpg', caption: 'one' })
  })
  it('maps a video item with poster', () => {
    const r = toGalleryItem({ kind: 'video', videoUrl: 'https://youtu.be/x', videoPoster: { url: '/p.jpg' } })
    expect(r).toEqual({ kind: 'video', url: 'https://youtu.be/x', posterUrl: '/p.jpg', caption: null })
  })
  it('maps a beforeAfter item', () => {
    const r = toGalleryItem({ kind: 'beforeAfter', beforeImage: { url: '/b.jpg' }, afterImage: { url: '/a.jpg' } })
    expect(r).toEqual({ kind: 'beforeAfter', beforeUrl: '/b.jpg', afterUrl: '/a.jpg', caption: null })
  })
  it('tolerates missing media', () => {
    const r = toGalleryItem({ kind: 'image', caption: null })
    expect(r).toEqual({ kind: 'image', url: null, caption: null })
  })
})
