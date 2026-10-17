import { describe, expect, it } from 'vitest'

import {
  championDataSourcePreferencesSchema,
  createChampionDataSourcePreferences
} from './source-preferences'

describe('champion data source preferences', () => {
  it.each([
    { enabled: { opgg: true, qq101: true }, requested: 'qq101', expected: 'qq101' },
    { enabled: { opgg: false, qq101: true }, requested: 'opgg', expected: 'qq101' },
    { enabled: { opgg: true, qq101: false }, requested: 'qq101', expected: 'opgg' },
    { enabled: { opgg: false, qq101: false }, requested: 'opgg', expected: null },
    { enabled: { opgg: false, qq101: true }, requested: null, expected: 'qq101' }
  ])(
    'keeps the default enabled, or empty when both sources are off: $requested -> $expected',
    ({ enabled, requested, expected }) => {
      expect(
        championDataSourcePreferencesSchema.parse({ enabled, defaultSource: requested })
      ).toEqual({ enabled, defaultSource: expected })
    }
  )

  it('starts with both sources enabled and OP.GG as the default', () => {
    expect(
      championDataSourcePreferencesSchema.parse(createChampionDataSourcePreferences())
    ).toEqual({ enabled: { opgg: true, qq101: true }, defaultSource: 'opgg' })
  })
})
