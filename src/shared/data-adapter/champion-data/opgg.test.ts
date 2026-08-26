import type { OpggChampionBuildResponse, OpggChampionsResponse } from '@shared/types/opgg'
import { describe, expect, it } from 'vitest'

import { adaptOpggChampionDetails, adaptOpggChampionOverview } from './opgg'

const tierData = { tier: 1, rank: 3, rank_prev: 5, rank_prev_patch: 6 }

describe('OP.GG champion data adapter', () => {
  it('maps a lane-specific overview to IDs and statistics', () => {
    const response = {
      data: [
        {
          id: 103,
          is_rotation: false,
          is_rip: false,
          average_stats: {
            play: 100,
            win_rate: 0.52,
            pick_rate: 0.1,
            ban_rate: 0.02,
            tier_data: tierData
          },
          positions: [
            {
              name: 'MID',
              stats: {
                play: 80,
                win_rate: 0.53,
                pick_rate: 0.08,
                role_rate: 0.8,
                ban_rate: 0.02,
                kda: 3.1,
                tier_data: tierData,
                total_place: undefined as never,
                first_place: undefined as never
              },
              roles: [],
              counters: [{ champion_id: 99, play: 10, win: 4 }]
            }
          ]
        }
      ],
      meta: { version: '16.16', cached_at: new Date('2026-08-20T00:00:00Z') }
    } as OpggChampionsResponse

    expect(adaptOpggChampionOverview(response, { mode: 'ranked', position: 'middle' })).toEqual({
      metadata: {
        source: 'opgg',
        mode: 'ranked',
        patch: '16.16',
        dataDate: null,
        updatedAt: '2026-08-20T00:00:00.000Z'
      },
      sections: {
        champions: [
          {
            championId: 103,
            position: 'middle',
            performance: {
              games: 80,
              wins: null,
              winRate: 0.53,
              pickRate: 0.08,
              banRate: 0.02,
              kda: 3.1,
              rank: 3,
              rankChange: 2,
              strengthTier: 1,
              averagePlacement: null,
              firstPlaceRate: null
            },
            counterChampionIds: [99]
          }
        ]
      }
    })
  })

  it('keeps champions whose current mode has no aggregate statistics', () => {
    const response = {
      data: [
        {
          id: 805,
          is_rotation: false,
          is_rip: false,
          average_stats: null,
          positions: null,
          roles: []
        }
      ],
      meta: { version: '13.23', cached_at: new Date('2026-08-20T00:00:00Z') }
    } satisfies OpggChampionsResponse

    expect(adaptOpggChampionOverview(response, { mode: 'nexus_blitz' })).toMatchObject({
      sections: {
        champions: [
          {
            championId: 805,
            performance: {
              games: null,
              wins: null,
              winRate: null,
              pickRate: null,
              banRate: null,
              rank: null,
              strengthTier: null
            }
          }
        ]
      }
    })
  })

  it('keeps supported empty sections present in details', () => {
    const response = {
      data: {
        summary: {
          id: 103,
          is_rotation: false,
          is_rip: false,
          average_stats: { play: 10, win: 6, pick_rate: 0.1, ban_rate: null, tier_data: tierData },
          positions: null,
          roles: []
        },
        core_items: [{ ids: [6655, 3020], play: 10, win: 6, pick_rate: 0.4 }],
        boots: [],
        starter_items: [],
        last_items: [],
        skill_masteries: [],
        skills: [],
        skill_evolves: []
      },
      meta: { version: '16.16', cached_at: new Date('2026-08-20T00:00:00Z') }
    } as OpggChampionBuildResponse

    const result = adaptOpggChampionDetails(response, { mode: 'ranked' })
    expect(result.sections.matchups).toEqual([])
    expect(result.sections.itemBuilds?.find((slot) => slot.slot === 'core')).toMatchObject({
      options: [{ itemIds: [6655, 3020], performance: { winRate: 0.6 } }]
    })
    expect(JSON.stringify(result)).not.toContain('icon')
    expect(JSON.stringify(result)).not.toContain('name')
  })

  it('omits ordinary build sections when adapting a Mayhem response', () => {
    const response = {
      data: {
        summary: {
          id: 103,
          is_rotation: false,
          is_rip: false,
          average_stats: {
            play: 10,
            win: 6,
            pick_rate: 0.1,
            ban_rate: null,
            tier_data: tierData
          },
          positions: null,
          roles: []
        },
        core_items: [{ ids: [6655], play: 10, win: 6, pick_rate: 0.4 }],
        boots: [],
        starter_items: [],
        last_items: [],
        skill_masteries: [],
        skills: [],
        skill_evolves: []
      },
      meta: { version: '16.16', cached_at: new Date('2026-08-20T00:00:00Z') }
    } as OpggChampionBuildResponse

    const result = adaptOpggChampionDetails(response, { mode: 'aram_mayhem' })
    expect(result.sections.itemBuilds).toBeUndefined()
    expect(result.sections.runePages).toBeUndefined()
    expect(result.sections.augments).toEqual([])
  })
})
