import { describe, it, expect } from 'vitest'
import { resolveLocale, isLocale, DEFAULT_LOCALE } from '../config'

describe('i18n config', () => {
  it('accepts valid locales', () => {
    expect(isLocale('en')).toBe(true)
    expect(isLocale('es')).toBe(true)
  })
  it('rejects invalid locales', () => {
    expect(isLocale('fr')).toBe(false)
    expect(isLocale('')).toBe(false)
    expect(isLocale(undefined)).toBe(false)
  })
  it('resolves unknown/empty to the default', () => {
    expect(resolveLocale('fr')).toBe(DEFAULT_LOCALE)
    expect(resolveLocale(undefined)).toBe('en')
    expect(resolveLocale(null)).toBe('en')
  })
  it('passes through a valid locale', () => {
    expect(resolveLocale('es')).toBe('es')
  })
})
