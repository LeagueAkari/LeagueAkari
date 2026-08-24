import { describe, expect, it } from 'vitest'

import { getChampionDataCapability, supportsChampionDataFeature } from './capabilities'

describe('champion data capabilities', () => {
  it('exposes the filters actually supported by each source', () => {
    expect(getChampionDataCapability('opgg', 'ranked')?.filters).toEqual([
      'region',
      'patch',
      'tier',
      'position'
    ])
    expect(getChampionDataCapability('qq101', 'ranked')?.filters).toEqual([
      'patch',
      'tier',
      'position'
    ])
    expect(getChampionDataCapability('opgg', 'aram_mayhem')?.filters).toEqual([])
    expect(getChampionDataCapability('opgg', 'arena')?.filters).toEqual(['region', 'patch'])
    expect(getChampionDataCapability('qq101', 'aram_mayhem')?.filters).toEqual([])
  })

  it('does not advertise regular ARAM or ranked builds for QQ101 Mayhem', () => {
    expect(getChampionDataCapability('qq101', 'aram')).toBeNull()
    expect(supportsChampionDataFeature('qq101', 'aram_mayhem', 'champion-augments')).toBe(true)
    expect(supportsChampionDataFeature('qq101', 'aram_mayhem', 'item-builds')).toBe(false)
    expect(supportsChampionDataFeature('opgg', 'aram_mayhem', 'item-builds')).toBe(false)
  })
})
