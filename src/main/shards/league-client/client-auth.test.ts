import type { UxCommandLine } from '@shared/shards/league-client-ux'
import { describe, expect, it } from 'vitest'

import { classifyClientCredentialChange, getClientAuthLogMetadata } from './client-auth'

function createAuth(overrides: Partial<UxCommandLine> = {}): UxCommandLine {
  return {
    authToken: 'synthetic-lcu-token',
    certificate: 'synthetic-certificate',
    pid: 123,
    port: 456,
    region: 'EUW',
    riotClientAuthToken: 'synthetic-riot-token',
    riotClientPort: 789,
    rsoPlatformId: 'EUW1',
    ...overrides
  }
}

describe('client credential lifecycle', () => {
  it('distinguishes Riot restarts from League restarts', () => {
    const current = createAuth()

    expect(
      classifyClientCredentialChange(
        current,
        createAuth({ riotClientAuthToken: 'replacement-riot-token', riotClientPort: 790 })
      )
    ).toBe('riot-client')
    expect(
      classifyClientCredentialChange(
        current,
        createAuth({ authToken: 'replacement-lcu-token', port: 457 })
      )
    ).toBe('league-client')
    expect(classifyClientCredentialChange(current, createAuth())).toBe('none')
  })

  it('never includes credentials in log metadata', () => {
    const metadata = getClientAuthLogMetadata(createAuth())

    expect(metadata).not.toHaveProperty('authToken')
    expect(metadata).not.toHaveProperty('riotClientAuthToken')
    expect(metadata).not.toHaveProperty('certificate')
    expect(metadata).toMatchObject({ pid: 123, port: 456, riotClientPort: 789 })
  })
})
