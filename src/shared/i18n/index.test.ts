import { describe, expect, it } from 'vitest'

import { formatI18nOrdinal } from '.'

describe('formatI18nOrdinal', () => {
  it('uses Chinese ordinals for zh locales', () => {
    expect(formatI18nOrdinal(1, 'zh-CN')).toBe('第一名')
    expect(formatI18nOrdinal(2, 'zh-CN', true)).toBe('二')
  })

  it('uses Spanish ordinal indicators for es locales', () => {
    expect(formatI18nOrdinal(1, 'es-MX')).toBe('1.º')
    expect(formatI18nOrdinal(3, 'es-MX', true)).toBe('3.º')
    expect(formatI18nOrdinal(8, 'es-MX')).toBe('8.º')
  })

  it('uses English suffixes for other locales', () => {
    expect(formatI18nOrdinal(1, 'en')).toBe('1st')
    expect(formatI18nOrdinal(2, 'en')).toBe('2nd')
    expect(formatI18nOrdinal(3, 'en')).toBe('3rd')
    expect(formatI18nOrdinal(4, 'en')).toBe('4th')
  })
})
