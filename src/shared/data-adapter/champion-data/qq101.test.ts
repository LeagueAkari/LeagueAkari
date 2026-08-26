import { describe, expect, it } from 'vitest'

import {
  type Qq101MayhemInput,
  type Qq101RankedDetailsInput,
  adaptQq101ClassicOverview,
  adaptQq101MayhemDetails,
  adaptQq101MayhemOverview,
  adaptQq101Position,
  adaptQq101RankedDetails,
  adaptQq101RankedOverview
} from './qq101'

describe('QQ101 champion data adapter', () => {
  it('normalizes classic overview metadata without advertising details', () => {
    const result = adaptQq101ClassicOverview({
      date: '20260823',
      champions: [
        {
          championId: 81,
          rank: 1,
          rankChange: -1,
          strengthTier: 'T0',
          position: 'BOTTOM',
          winRate: 0.5277,
          pickRate: 0.5798,
          banRate: 0.0335,
          counterChampionIds: []
        }
      ]
    })

    expect(result.metadata).toEqual({
      source: 'qq101',
      mode: 'classic',
      patch: null,
      dataDate: '20260823',
      updatedAt: null
    })
    expect(result.sections.champions[0]).toMatchObject({ championId: 81, position: 'bottom' })
  })

  it('normalizes the positions returned by the live QQ101 API', () => {
    expect(adaptQq101Position('TOP')).toBe('top')
    expect(adaptQq101Position('MIDDLE')).toBe('middle')
    expect(adaptQq101Position('BOTTOM')).toBe('bottom')
    expect(adaptQq101Position('UTILITY')).toBe('utility')
    expect(adaptQq101Position('unknown')).toBe('none')

    const result = adaptQq101RankedOverview({
      date: '20260820',
      patch: '16.16',
      champions: [
        {
          championId: 75,
          championName: '内瑟斯',
          championTitle: '沙漠死神',
          championKey: 'Nasus',
          championIconUrl: 'https://example.com/Nasus.png',
          rank: 1,
          rankChange: 14,
          strengthTier: 'T0',
          position: 'TOP',
          winRate: 0.5353,
          pickRate: 0.0668,
          banRate: 0.0715,
          counterChampionIds: [223, 14, 897]
        }
      ]
    })

    expect(result.sections.champions[0].position).toBe('top')
    expect(JSON.stringify(result)).not.toContain('内瑟斯')
    expect(JSON.stringify(result)).not.toContain('Nasus.png')
  })

  it('maps all ranked detail sections without carrying display metadata', () => {
    const input: Qq101RankedDetailsInput = {
      date: '20260820',
      patch: '16.16',
      champion: {
        championId: 103,
        championName: 'should be removed',
        championIconUrl: 'https://example.com/icon.png',
        rank: 2,
        rankChange: 1,
        strengthTier: 'T1',
        position: 'MIDDLE',
        winRate: 0.52,
        pickRate: 0.08,
        banRate: 0.02,
        counterChampionIds: [99]
      },
      matchups: {
        favorable: [{ championId: 1, winRate: 0.56, championName: 'removed' }],
        unfavorable: [{ championId: 2, winRate: 0.44 }]
      },
      synergies: [{ championId: 64, winRate: 0.54, games: 300 }],
      summonerSpells: [{ summonerSpellIds: [4, 14], rank: 1, winRate: 0.51, pickRate: 0.7 }],
      abilityBuild: {
        abilityPriority: ['Q', 'W', 'E'],
        levelOrder: ['Q', 'W', 'E'],
        options: []
      },
      itemBuild: {
        slots: {
          starting: [{ itemIds: [1056, 2003], rank: 1, winRate: 0.51, pickRate: 0.6 }]
        }
      },
      runes: {
        pages: [
          {
            rank: 1,
            primaryStyleId: 8100,
            secondaryStyleId: 8200,
            primaryRuneIds: [8112],
            secondaryRuneIds: [8210],
            statShardIds: [5008],
            pickRate: 0.4,
            winRate: 0.53,
            games: 100
          }
        ]
      },
      positions: [
        {
          position: 'MIDDLE',
          pickRate: 0.08,
          winRate: 0.52,
          banRate: 0.02,
          strengthTier: 'T1',
          rank: 2,
          share: 0.9
        }
      ]
    }

    const result = adaptQq101RankedDetails(input)
    expect(result.metadata).toMatchObject({
      source: 'qq101',
      patch: '16.16',
      dataDate: '20260820'
    })
    expect(result.sections.matchups?.map((item) => item.relationship)).toEqual([
      'favorable',
      'unfavorable'
    ])
    expect(result.sections.itemBuilds?.[0].options[0].itemIds).toEqual([1056, 2003])
    expect(result.sections.runePages?.[0].primaryRuneIds).toEqual([8112])
    expect(result.summary.position).toBe('middle')
    expect(result.sections.positions?.[0].position).toBe('middle')
    expect(JSON.stringify(result)).not.toContain('should be removed')
    expect(JSON.stringify(result)).not.toContain('icon.png')
  })

  it('keeps Mayhem leaderboard, global augment and pair synergy data separate', () => {
    const input: Qq101MayhemInput = {
      date: '20260820',
      champions: [
        {
          championId: 103,
          rank: 1,
          rankChange: 2,
          winRate: 0.56,
          pickRate: 0.12,
          bestPartners: [{ championId: 64, pickRate: 0.1, winRate: 0.58, rank: 3 }],
          averageDeathTimeSeconds: 18,
          killParticipationRate: 0.72,
          damageShare: 0.25,
          damageTakenShare: 0.17,
          lowestRankAugmentIds: [9001]
        }
      ],
      augments: [
        {
          augmentId: 9001,
          augmentTier: 1,
          pickRate: 0.2,
          pickRank: 3,
          pickRankChange: 1,
          winRate: 0.57,
          winRank: 2,
          winRankChange: 0,
          bestChampions: [{ championId: 103, championName: 'removed' }]
        }
      ],
      synergies: [
        {
          champions: [{ championId: 103 }, { championId: 64 }],
          winRate: 0.58,
          pickRate: 0.1,
          rank: 1
        }
      ]
    }

    const overview = adaptQq101MayhemOverview(input)
    const details = adaptQq101MayhemDetails(input, 103)
    expect(overview.sections.augments?.[0].bestChampionIds).toEqual([103])
    expect(overview.sections.synergies?.[0].championIds).toEqual([103, 64])
    expect(details?.sections.augments?.map((item) => item.augmentId)).toEqual([9001])
    expect(details?.sections.itemBuilds).toBeUndefined()
  })
})
