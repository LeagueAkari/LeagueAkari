import { describe, expect, it } from 'vitest'

import { resolveSgpRegionPathParam } from './http-client-controller'

describe('resolveSgpRegionPathParam', () => {
  it('prefers an explicit remote configuration value', () => {
    expect(resolveSgpRegionPathParam('PBE', 'PBE1')).toBe('PBE1')
  })

  it('uses the active Riot platform ID for the current server', () => {
    expect(
      resolveSgpRegionPathParam('EUW', undefined, {
        sgpServerId: 'EUW',
        rsoPlatformId: 'euw1'
      })
    ).toBe('EUW1')
  })

  it('uses known platform IDs for cross-region requests', () => {
    expect(resolveSgpRegionPathParam('EUW')).toBe('EUW1')
    expect(resolveSgpRegionPathParam('JP')).toBe('JP1')
  })

  it('preserves ordinary platform IDs and extracts Tencent sub IDs', () => {
    expect(resolveSgpRegionPathParam('NA1')).toBe('NA1')
    expect(resolveSgpRegionPathParam('TENCENT_HN10')).toBe('HN10')
  })
})
