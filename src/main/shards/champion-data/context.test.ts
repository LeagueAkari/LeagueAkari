import { describe, expect, it } from 'vitest'

import { resolveChampionDataSourceGateAvailability } from './context'

describe('champion data source feature gates', () => {
  it('keeps OP.GG backward-compatible before the new gates are published', () => {
    expect(
      resolveChampionDataSourceGateAvailability({
        opggConfigured: false,
        qq101Configured: false,
        opggEnabled: false,
        qq101Enabled: false,
        allowUnconfiguredQq101: false
      })
    ).toEqual({ opgg: true, qq101: false })
  })

  it('enables QQ101 in development before the new gates are published', () => {
    expect(
      resolveChampionDataSourceGateAvailability({
        opggConfigured: false,
        qq101Configured: false,
        opggEnabled: false,
        qq101Enabled: false,
        allowUnconfiguredQq101: true
      })
    ).toEqual({ opgg: true, qq101: true })
  })

  it('uses the remote evaluation after either source gate is published', () => {
    expect(
      resolveChampionDataSourceGateAvailability({
        opggConfigured: true,
        qq101Configured: true,
        opggEnabled: false,
        qq101Enabled: true,
        allowUnconfiguredQq101: true
      })
    ).toEqual({ opgg: false, qq101: true })
  })
})
