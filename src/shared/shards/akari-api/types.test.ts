import { describe, expect, it } from 'vitest'

import { toAkariApiLanguage } from './types'

describe('toAkariApiLanguage', () => {
  it('keeps Chinese and English', () => {
    expect(toAkariApiLanguage('zh-CN')).toBe('zh-CN')
    expect(toAkariApiLanguage('en')).toBe('en')
  })

  it('falls back to English for locales the API does not serve', () => {
    expect(toAkariApiLanguage('es-MX')).toBe('en')
  })
})
