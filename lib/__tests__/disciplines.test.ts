import { describe, it, expect } from 'vitest'
import { disciplineNumber, disciplineMeta } from '../disciplines'

describe('disciplineNumber', () => {
  it('formats order as a zero-padded 1-based number', () => {
    expect(disciplineNumber(0)).toBe('01')
    expect(disciplineNumber(3)).toBe('04')
  })
})

describe('disciplineMeta', () => {
  it('formats the area-page meta line', () => {
    expect(disciplineMeta(0, 4)).toBe('( 01 / 04 )')
    expect(disciplineMeta(2, 4)).toBe('( 03 / 04 )')
  })
})
