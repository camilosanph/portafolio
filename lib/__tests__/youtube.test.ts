import { describe, expect, it } from 'vitest'
import { getYouTubeId, youTubeThumb } from '../youtube'

describe('getYouTubeId', () => {
  it('parses watch?v= URLs', () => {
    expect(getYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })
  it('parses youtu.be short links', () => {
    expect(getYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })
  it('parses /embed/ URLs', () => {
    expect(getYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })
  it('parses watch URLs with extra params', () => {
    expect(getYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s')).toBe('dQw4w9WgXcQ')
  })
  // Regression: Camilo's actual (unlisted) showreel. Unlisted videos use the
  // same watch?v= URL shape as public ones and embed fine — must keep working.
  it('parses the real unlisted showreel URL', () => {
    expect(getYouTubeId('https://www.youtube.com/watch?v=JYQsVM5FXjU')).toBe('JYQsVM5FXjU')
  })
  it('returns null for non-YouTube input', () => {
    expect(getYouTubeId('https://example.com/video')).toBeNull()
    expect(getYouTubeId('')).toBeNull()
    expect(getYouTubeId(null)).toBeNull()
  })
})

describe('youTubeThumb', () => {
  it('builds a thumbnail URL containing the id', () => {
    expect(youTubeThumb('dQw4w9WgXcQ')).toContain('dQw4w9WgXcQ')
  })
})
