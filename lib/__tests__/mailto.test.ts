import { describe, it, expect } from 'vitest'
import { buildMailto } from '../mailto'

describe('buildMailto', () => {
  it('builds subject + body, url-encoded', () => {
    const u = buildMailto({
      email: 'a@b.co',
      projectType: 'Color Grading',
      name: 'Jo',
      fromEmail: 'jo@x.co',
      message: 'Hi there',
    })
    expect(u.startsWith('mailto:a@b.co?')).toBe(true)
    // em dash (—) encodes to %E2%80%94
    expect(u).toContain('subject=Project%20enquiry%20%E2%80%94%20Color%20Grading')
    expect(u).toContain('Name%3A%20Jo')
    expect(u).toContain('Hi%20there')
  })

  it('omits the project type when absent', () => {
    const u = buildMailto({ email: 'a@b.co' })
    expect(u).toContain('subject=Project%20enquiry&')
  })

  it('still produces a valid mailto with only email', () => {
    const u = buildMailto({ email: 'hello@camilosanchez.studio' })
    expect(u.startsWith('mailto:hello@camilosanchez.studio?')).toBe(true)
  })
})
