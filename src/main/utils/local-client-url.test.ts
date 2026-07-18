import { describe, expect, it } from 'vitest'

import { assertLocalClientRequestUrl } from './local-client-url'

describe('local client request URL constraints', () => {
  it.each([
    'https://example.test/path',
    'HTTP://example.test/path',
    '//example.test/path',
    '\\\\example.test\\path',
    'file:///private/tmp/example'
  ])('rejects non-local URL %s', (url) => {
    expect(() => assertLocalClientRequestUrl(url)).toThrow(
      'Local client requests require a relative URL'
    )
  })

  it.each(['/lol-summoner/v1/current-summoner', 'riotclient/auth-token', '?query=value'])(
    'allows relative local endpoint %s',
    (url) => {
      expect(() => assertLocalClientRequestUrl(url)).not.toThrow()
    }
  )
})
