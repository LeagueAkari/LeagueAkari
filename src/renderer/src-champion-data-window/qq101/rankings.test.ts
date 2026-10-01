import type { AkariResourceProviderValue } from '@renderer-shared/providers/akari-resource'
import {
  parseQq101ClassicTierList,
  parseQq101MayhemAugments,
  parseQq101MayhemChampions,
  parseQq101TierList
} from '@shared/data-adapter/qq101/protocol'
import { describe, expect, it } from 'vitest'

import { projectRankings } from './rankings'

const response = (id: number, payload: object) => ({
  code: 0,
  data: { _fieldValues: { [`R${id}`]: JSON.stringify(payload) } }
})
const resources = {
  champions: { roles: (id: number) => (id <= 10 ? ['mage'] : ['tank']) },
  augments: { display: () => null }
} as unknown as AkariResourceProviderValue

describe('QQ101 rankings projection', () => {
  it('keeps each Rift lane and the original Classic resource identity', () => {
    const data = parseQq101TierList(
      response(17960, { datadetails: '1_103_T1_MIDDLE_52_10_1__0#2_103_T3_TOP_48_1_1__-1' }),
      '16.19'
    )
    const rows = projectRankings({ mode: 'ranked', data }, 'champions', 'all', resources)
    expect(new Set(rows.map((row) => row.key)).size).toBe(2)
    const classic = parseQq101ClassicTierList(
      response(18009, { tierscore_top_hero_list: '1|60103|52|10|1|T1|0' })
    )
    expect(
      projectRankings({ mode: 'classic', data: classic }, 'champions', 'all', resources)[0].ids
    ).toEqual([60103])
  })

  it('calculates profession tiers before filtering without rewriting upstream ranks', () => {
    const data = parseQq101MayhemChampions(
      response(15380, {
        listcollect: Array.from(
          { length: 20 },
          (_, i) => `${i + 1}_${i + 1}_持平_0.52_0.1__0_0_0_0_`
        ).join('#')
      }),
      '20260926'
    )
    const overview = {
      mode: 'aram_mayhem' as const,
      data: {
        ...data,
        augments: null,
        synergies: null,
        augmentDate: null,
        synergyDate: null,
        errors: {}
      }
    }
    const tanks = projectRankings(overview, 'champions', 'tank', resources)
    expect(tanks[0]).toMatchObject({ rank: 11, tier: 'T0' })
    expect(tanks.map((row) => row.tier)).toEqual([
      'T0',
      'T1',
      'T2',
      'T3',
      'T4',
      'T4',
      'T4',
      'T4',
      'T4',
      'T4'
    ])
  })

  it('retains missing augment resources and both ranking metrics', () => {
    const { augments } = parseQq101MayhemAugments(
      response(15381, { augmentlist: '1379_255_0.12_2_-3_0.55_1_2_' })
    )
    const rows = projectRankings(
      {
        mode: 'aram_mayhem',
        data: {
          date: '',
          champions: [],
          augments,
          synergies: [],
          augmentDate: null,
          synergyDate: null,
          errors: {}
        }
      },
      'augments',
      'all',
      resources
    )
    expect(rows[0]).toMatchObject({
      ids: [1379],
      rank: 2,
      change: 3,
      winRank: 1,
      winChange: -2,
      rarity: undefined
    })
  })
})
