import {
  parseOpggAramBalance,
  parseOpggMayhemTiers,
  parseOpggRankedDetails,
  parseOpggWinRateDetails,
  parseOpggWinRateOverview
} from '@shared/data-adapter/opgg'
import { projectDetails } from '@shared/data-adapter/opgg/projection'
import { OpggHttpApiAxiosHelper } from '@shared/http-api-axios-helper/opgg'
import axios from 'axios'
import { assert, describe, expect, it } from 'vitest'

function apiFor(data: unknown) {
  const http = axios.create({
    adapter: async (config) => ({ data, status: 200, statusText: 'OK', headers: {}, config })
  })
  const api = new OpggHttpApiAxiosHelper(http)

  return { api }
}

const stats = { play: 100, win: 53, pick_rate: 0.2 }

describe('OP.GG response boundary', () => {
  it('keeps valid details, recovers individual statistics and strips unused fields before projection', async () => {
    const { api } = apiFor({
      data: {
        summary: { id: 103, average_stats: null },
        summoner_spells: [{ ...stats, ids: [4, 14], unused: 'drop' }],
        runes: [],
        skill_masteries: [],
        starter_items: [],
        boots: [],
        core_items: [
          { ...stats, ids: [3078], pick_rate: 'not-a-ratio', play: null, unused: 'drop' },
          { ...stats, ids: [3089] },
          { ...stats, ids: [0] }
        ],
        last_items: {},
        counters: [],
        trends: { unused: 'drop' }
      },
      meta: { unused: 'drop' }
    })
    const { data: response, issues } = parseOpggWinRateDetails(
      (await api.getAramChampion('global', 103)).data,
      103
    )
    expect(response.data.core_items).toEqual([
      { ...stats, ids: [3078], play: 0, pick_rate: 0 },
      { ...stats, ids: [3089] }
    ])
    expect(response).not.toHaveProperty('meta')
    expect(response.data).not.toHaveProperty('trends')
    expect(response.data.summoner_spells[0]).not.toHaveProperty('unused')
    const details = projectDetails({ mode: 'aram', response }, 'mid', {
      aramBalance: [],
      augmentRarity: () => null
    })
    assert(details.kind === 'aram')
    expect(details.summonerSpells[0].winRate).toBe(0.53)
    expect(details.lastItems).toEqual([])
    expect(issues.some((issue) => issue.path.includes('core_items.0'))).toBe(true)
  })

  it('never offers partially broken rune pages or spell pairs for application', async () => {
    const { api } = apiFor({
      data: {
        runes: [
          {
            ...stats,
            primary_page_id: 8000,
            secondary_page_id: 8100,
            primary_rune_ids: [8005, 9111],
            secondary_rune_ids: [8139, 8106],
            stat_mod_ids: [5005, 5008, 5001]
          }
        ],
        summoner_spells: [{ ...stats, ids: [4, '14'] }],
        core_items: [{ ...stats, ids: [3078] }]
      }
    })
    const { data: response } = parseOpggRankedDetails(
      (await api.getRankedChampion('global', 103, 'mid')).data,
      103
    )
    expect(response.data.summary.id).toBe(103)
    expect(response.data.runes).toEqual([])
    expect(response.data.summoner_spells).toEqual([])
    expect(response.data.core_items).toHaveLength(1)
  })

  it('preserves tier zero and healthy rows while invalid identities are dropped', async () => {
    const { api } = apiFor({
      data: [
        { champion_id: 103, rank: 1, tier: 0, id: 123 },
        { champion_id: 22, rank: 'bad', tier: 2 },
        { champion_id: -1, rank: 2, tier: 3 },
        null
      ]
    })
    expect(parseOpggMayhemTiers((await api.getAramMayhemTiers()).data).data).toEqual({
      data: [
        { champion_id: 103, rank: 1, tier: 0 },
        { champion_id: 22, rank: null, tier: 2 }
      ]
    })
  })

  it('uses neutral balance defaults and returns every affected field', async () => {
    const { api } = apiFor({
      data: Array.from({ length: 100 }, () => ({ champion_id: 103 }))
    })
    const { data: balance, issues } = parseOpggAramBalance((await api.getAramBalance()).data)
    expect(balance[0]).toMatchObject({
      damageDealt: 100,
      tenacity: 0,
      abilityHaste: 0
    })
    expect(balance[0]).not.toHaveProperty('default')
    expect(issues).toHaveLength(900)
    expect(issues.some((issue) => issue.path.includes('data.99.'))).toBe(true)
  })

  it('recovers a malformed root but keeps transport failures as request errors', async () => {
    const { api } = apiFor('upstream format changed')
    expect(parseOpggWinRateOverview((await api.getAramChampions('global')).data).data).toEqual({
      data: []
    })
    const http = axios.create({
      adapter: async () => {
        throw new Error('offline')
      }
    })
    await expect(new OpggHttpApiAxiosHelper(http).getAramChampions('global')).rejects.toThrow(
      'offline'
    )
  })
})
