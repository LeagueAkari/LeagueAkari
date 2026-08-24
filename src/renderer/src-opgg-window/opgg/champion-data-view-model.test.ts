import type { ChampionDataDetails, ChampionDataOverview } from '@shared/data-adapter/champion-data'
import { describe, expect, it } from 'vitest'

import {
  toOpggChampionDetailsViewModel,
  toOpggChampionOverviewViewModel,
  toOpggMayhemAugmentsViewModel
} from './champion-data-view-model'

const performance = {
  games: 100,
  wins: 55,
  winRate: 0.55,
  pickRate: 0.1,
  banRate: 0.02,
  kda: 3,
  rank: 4,
  rankChange: 2,
  strengthTier: 'T1',
  averagePlacement: null,
  firstPlaceRate: null
}

const recommendation = {
  games: 20,
  wins: 12,
  winRate: 0.6,
  pickRate: 0.2,
  rank: 1,
  averagePlacement: null,
  firstPlaceRate: null
}

describe('champion data legacy view model', () => {
  it('groups unified overview records into the existing champion table shape', () => {
    const overview: ChampionDataOverview = {
      metadata: {
        source: 'qq101',
        mode: 'ranked',
        patch: '16.16',
        dataDate: '20260820',
        updatedAt: null
      },
      sections: {
        champions: [
          {
            championId: 101,
            position: 'middle',
            performance,
            counterChampionIds: [55, 157]
          },
          {
            championId: 101,
            position: 'bottom',
            performance: { ...performance, rank: 9 },
            counterChampionIds: []
          }
        ]
      }
    }

    const result = toOpggChampionOverviewViewModel(overview)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].positions?.map((item) => item.name)).toEqual(['MID', 'ADC'])
    expect(result.data[0].positions?.[0].counters.map((item) => item.champion_id)).toEqual([
      55, 157
    ])
    expect(result.data[0].average_stats?.tier_data).toMatchObject({
      tier: 1,
      rank: 4,
      rank_prev: 6
    })
  })

  it('preserves build, rune, ability and relationship sections for the current UI', () => {
    const details: ChampionDataDetails = {
      metadata: {
        source: 'qq101',
        mode: 'ranked',
        patch: '16.16',
        dataDate: '20260820',
        updatedAt: null
      },
      championId: 101,
      summary: {
        championId: 101,
        position: 'middle',
        performance,
        counterChampionIds: []
      },
      sections: {
        matchups: [{ championId: 55, relationship: 'unfavorable', performance: recommendation }],
        synergies: [{ championIds: [101, 99], performance: recommendation }],
        summonerSpells: [{ spellIds: [4, 12], performance: recommendation }],
        abilityBuilds: [
          {
            abilityPriority: ['Q', 'W', 'E'],
            levelOrder: ['Q', 'W', 'E'],
            performance: recommendation
          }
        ],
        itemBuilds: [
          { slot: 'core', options: [{ itemIds: [6655, 3020], performance: recommendation }] },
          { slot: 'fourth', options: [{ itemIds: [3089], performance: recommendation }] }
        ],
        runePages: [
          {
            primaryStyleId: 8200,
            secondaryStyleId: 8300,
            primaryRuneIds: [8229],
            secondaryRuneIds: [8347],
            statShardIds: [5005],
            performance: recommendation
          }
        ]
      }
    }

    const result = toOpggChampionDetailsViewModel(details)
    expect(result.data.core_items[0]).toMatchObject({ ids: [6655, 3020], play: 20, win: 12 })
    expect(result.data.last_items[0]).toMatchObject({ ids: [3089], play: 20, win: 12 })
    expect(result.data.runes?.[0]).toMatchObject({ primary_rune_ids: [8229], play: 20 })
    expect(result.data.skill_masteries[0]).toMatchObject({ ids: ['Q', 'W', 'E'] })
    expect(result.data.counters?.[0]).toMatchObject({ champion_id: 55, play: 20, win: 12 })
    expect(result.data.synergies?.[0]).toMatchObject({ champion_id: 99, play: 20, win: 12 })
  })

  it('keeps a visible win rate when a source does not provide game counts', () => {
    const withoutCounts = { ...recommendation, games: null, wins: null, winRate: 0.58 }
    const details: ChampionDataDetails = {
      metadata: {
        source: 'qq101',
        mode: 'ranked',
        patch: '16.16',
        dataDate: null,
        updatedAt: null
      },
      championId: 101,
      summary: {
        championId: 101,
        position: 'middle',
        performance,
        counterChampionIds: []
      },
      sections: {
        summonerSpells: [{ spellIds: [4, 12], performance: withoutCounts }]
      }
    }

    expect(toOpggChampionDetailsViewModel(details).data.summoner_spells?.[0]).toMatchObject({
      play: 0,
      win: 0.58
    })
  })

  it('uses the dedicated Mayhem augment view without creating ordinary ARAM builds', () => {
    const details: ChampionDataDetails = {
      metadata: {
        source: 'opgg',
        mode: 'aram_mayhem',
        patch: null,
        dataDate: null,
        updatedAt: null
      },
      championId: 101,
      summary: {
        championId: 101,
        position: 'none',
        performance,
        counterChampionIds: []
      },
      sections: {
        augments: [
          {
            augmentId: 9001,
            tier: 2,
            rank: 3,
            rankChange: 1,
            performanceScore: 88,
            performance: recommendation,
            popularity: 72,
            bestChampionIds: []
          }
        ]
      }
    }

    expect(toOpggMayhemAugmentsViewModel(details, 'aram_mayhem')).toEqual({
      data: [{ id: 9001, tier: 2, performance: 88, popular: 72 }]
    })
    expect(toOpggChampionDetailsViewModel(details).data.core_items).toEqual([])
  })
})
