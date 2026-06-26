import { describe, it, expect } from 'vitest'
import { resolveLocale, isLocale, negotiateLocale, DEFAULT_LOCALE } from '../config'

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

describe('negotiateLocale', () => {
  it('prefers a valid cookie choice', () => {
    expect(negotiateLocale('en-US,en;q=0.9', 'es')).toBe('es')
  })
  it('falls back to Accept-Language', () => {
    expect(negotiateLocale('es-ES,es;q=0.9', null)).toBe('es')
    expect(negotiateLocale('en-GB,en;q=0.9', undefined)).toBe('en')
  })
  it('defaults when nothing matches', () => {
    expect(negotiateLocale('fr-FR,fr;q=0.9', null)).toBe(DEFAULT_LOCALE)
    expect(negotiateLocale(null, null)).toBe('en')
  })
})
