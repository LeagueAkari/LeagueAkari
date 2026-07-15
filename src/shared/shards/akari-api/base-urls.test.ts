import { describe, expect, it } from 'vitest'

import { parseAkariApiBootstrapDocument, resolveAkariStaticUrl } from './base-urls'
import {
  DEFAULT_AKARI_API_BASE_URL,
  DEFAULT_AKARI_SERVICE_BASE_URLS,
  DEFAULT_AKARI_STATIC_BASE_URL
} from './types'

describe('Akari API service discovery', () => {
  it('uses the yuru-yuri.com service origins by default', () => {
    expect(DEFAULT_AKARI_SERVICE_BASE_URLS).toEqual({
      api: DEFAULT_AKARI_API_BASE_URL,
      static: DEFAULT_AKARI_STATIC_BASE_URL
    })
    expect(DEFAULT_AKARI_API_BASE_URL).toBe('https://akari-api.yuru-yuri.com')
    expect(DEFAULT_AKARI_STATIC_BASE_URL).toBe('https://akari-static.yuru-yuri.com')
  })

  it('parses a valid bootstrap document', () => {
    expect(
      parseAkariApiBootstrapDocument({
        schemaVersion: 1,
        generation: 2,
        baseUrls: {
          api: 'https://akari-api.yuru-yuri.com',
          static: 'https://akari-static.yuru-yuri.com'
        }
      })
    ).toEqual({
      schemaVersion: 1,
      generation: 2,
      baseUrls: {
        api: 'https://akari-api.yuru-yuri.com',
        static: 'https://akari-static.yuru-yuri.com'
      }
    })
  })

  it('rejects an invalid bootstrap document', () => {
    expect(() => parseAkariApiBootstrapDocument({ schemaVersion: 2 })).toThrow()
  })

  it('resolves and encodes static object names', () => {
    expect(resolveAkariStaticUrl(DEFAULT_AKARI_STATIC_BASE_URL, 'League Akari-1.5.0-win.7z')).toBe(
      'https://akari-static.yuru-yuri.com/League%20Akari-1.5.0-win.7z'
    )
  })

  it('allows an authoritative absolute static URL', () => {
    expect(
      resolveAkariStaticUrl(DEFAULT_AKARI_STATIC_BASE_URL, 'https://cdn.example.com/file.7z')
    ).toBe('https://cdn.example.com/file.7z')
  })
})
