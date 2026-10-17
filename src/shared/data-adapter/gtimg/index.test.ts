import { describe, expect, it } from 'vitest'

import { parseGtimgClassicHeroes, parseGtimgHeroList, parseGtimgKiwiAugments } from './index'

describe('GTIMG response boundary', () => {
  it('keeps valid records, drops invalid identities and defaults damaged fields with diagnostics', () => {
    const result = parseGtimgHeroList({
      hero: [
        {
          heroId: '1',
          name: 'Annie',
          title: 123,
          alias: 'Annie',
          roles: ['mage', 'unknown'],
          keywords: '',
          ignored: true
        },
        { heroId: 'broken' },
        null
      ]
    })
    expect(result.data?.hero).toEqual([
      { heroId: 1, name: 'Annie', title: '', alias: 'Annie', roles: ['mage'], keywords: '' }
    ])
    expect(result.issues.length).toBeGreaterThan(0)
  })

  it.each([null, 'HTML error', {}, { hero: {} }])(
    'returns null for an unusable envelope: %j',
    (input) => {
      const result = parseGtimgHeroList(input)
      expect(result.data).toBeNull()
      expect(result.issues.length).toBeGreaterThan(0)
    }
  )

  it('preserves classic IDs and degrades unknown augment rarity without inventing one', () => {
    expect(
      parseGtimgClassicHeroes({
        heroes: [
          {
            heroId: 60081,
            name: 'Ezreal',
            title: '',
            alias: 'Jade_Ezreal',
            baseAlias: 'Ezreal',
            roles: ['marksman'],
            portrait: ''
          }
        ]
      }).data?.[0].heroId
    ).toBe(60081)
    expect(
      parseGtimgKiwiAugments([{ augmentID: 1001, level: 'future' }]).data?.[0].level
    ).toBeNull()
    expect(parseGtimgClassicHeroes({ heroes: 'bad' }).data).toBeNull()
    expect(parseGtimgKiwiAugments({ augments: [] }).data).toBeNull()
  })
})
