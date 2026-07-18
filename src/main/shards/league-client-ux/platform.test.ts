import { describe, expect, test } from 'vitest'

import { getConnectedClientCommandLinePollInterval } from './platform'

describe('League Client UX platform behavior', () => {
  test('polls connected macOS clients often enough to observe restarted Riot credentials', () => {
    expect(getConnectedClientCommandLinePollInterval('darwin')).toBe(5_000)
  })

  test('preserves the existing Windows connected poll interval', () => {
    expect(getConnectedClientCommandLinePollInterval('win32')).toBe(60_000)
  })
})
