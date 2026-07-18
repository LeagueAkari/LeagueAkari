import { describe, expect, test } from 'vitest'

import { getDeepLinkArgument, isDeepLinkUrl, shouldQuitWhenAllWindowsClosed } from './app-lifecycle'

describe('macOS application lifecycle', () => {
  test('keeps the application alive when its last window closes on macOS', () => {
    expect(shouldQuitWhenAllWindowsClosed('darwin')).toBe(false)
    expect(shouldQuitWhenAllWindowsClosed('win32')).toBe(true)
  })

  test('accepts only the configured deep-link protocol', () => {
    expect(
      isDeepLinkUrl('league-akari://shards/client-installation-main/launch', 'league-akari')
    ).toBe(true)
    expect(
      isDeepLinkUrl('league-akari-dev://shards/client-installation-main/launch', 'league-akari')
    ).toBe(false)
    expect(isDeepLinkUrl('not a URL', 'league-akari')).toBe(false)
  })

  test('extracts a deep link without depending on its argument position', () => {
    expect(
      getDeepLinkArgument(
        [
          '/Applications/League Akari.app/Contents/MacOS/League Akari',
          '--flag',
          'league-akari://shards/client-installation-main/launch-riot-client-lol'
        ],
        'league-akari'
      )
    ).toBe('league-akari://shards/client-installation-main/launch-riot-client-lol')
  })
})
