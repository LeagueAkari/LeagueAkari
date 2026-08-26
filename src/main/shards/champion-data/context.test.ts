import { describe, expect, it } from 'vitest'

import { resolveChampionDataSourceGateAvailability } from './context'

describe('champion data source feature gates', () => {
  it('enables both sources before the new gates are published', () => {
    expect(
      resolveChampionDataSourceGateAvailability({
        opggConfigured: false,
        qq101Configured: false,
        opggEnabled: false,
        qq101Enabled: false
      })
    ).toEqual({ opgg: true, qq101: true })
  })

  it('can disable QQ101 after the source gates are published', () => {
    expect(
      resolveChampionDataSourceGateAvailability({
        opggConfigured: true,
        qq101Configured: false,
        opggEnabled: true,
        qq101Enabled: false
      })
    ).toEqual({ opgg: true, qq101: false })
  })

  it('uses the remote evaluation after either source gate is published', () => {
    expect(
      resolveChampionDataSourceGateAvailability({
        opggConfigured: true,
        qq101Configured: true,
        opggEnabled: false,
        qq101Enabled: true
      })
    ).toEqual({ opgg: false, qq101: true })
  })
})
