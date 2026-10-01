import { describe, expect, it } from 'vitest'

import {
  parseQq101AramChampions,
  parseQq101Build,
  parseQq101ClassicLanes,
  parseQq101ClassicTierList,
  parseQq101JungleRoutes,
  parseQq101MayhemAugments,
  parseQq101MayhemChampions,
  parseQq101MayhemDetails,
  parseQq101MayhemPairSynergies,
  parseQq101Positions,
  parseQq101Runes,
  parseQq101TierList
} from './protocol'

function envelope(fieldId: string, payload: object) {
  return {
    code: 0,
    data: { _fieldValues: { [`R${fieldId}`]: JSON.stringify(payload) } }
  }
}

describe('QQ101 protocol adapter', () => {
  it('accepts official legacy position formats without confusing rank and lane share', () => {
    const result = parseQq101Positions(
      envelope('18122', {
        data_details: 'mid_10_52_3_T1_0_12_95#上单：2_48_3_T4_30_5'
      }),
      103
    )
    expect(result.positions).toMatchObject([
      { position: 'MIDDLE', rank: 12, share: 0.95 },
      { position: 'TOP', rank: 30, share: 0.05 }
    ])
  })

  it('keeps separate lanes for the same hero and preserves a one-place rank drop', () => {
    const result = parseQq101TierList(
      envelope('17960', {
        dtstatdate: '20260925',
        datadetails:
          '1_112_T1_BOTTOM_54.47_3.69_23.11_115,101,42_0_0_0#1_112_T1_MIDDLE_52.15_9.57_23.19_38,142,69_-1_0_0'
      }),
      '16.19'
    )

    expect(result.champions).toHaveLength(2)
    expect(result.champions.map((row) => [row.championId, row.position])).toEqual([
      [112, 'BOTTOM'],
      [112, 'MIDDLE']
    ])
    expect(result.champions[1]).toMatchObject({ rankChange: -1, winRate: 0.5215 })
  })

  it('reads the current augment field, signed changes and response date without inventing rarity', () => {
    const response = envelope('15381', {
      dtstatdate: '20260925',
      augmentlist: '1004_255_0.2774_45_-1_0.5767_20_-1_13,4,41,901,223,81'
    })
    response.data._fieldValues.R15332 = JSON.stringify({ augmentlist: '' })
    const result = parseQq101MayhemAugments(response, '20260926')

    expect(result.date).toBe('20260925')
    expect(result.augments).toEqual([
      {
        augmentId: 1004,
        augmentTier: null,
        pickRate: 0.2774,
        pickRank: 45,
        pickRankChange: -1,
        pickRankImprovement: 1,
        winRate: 0.5767,
        winRank: 20,
        winRankChange: -1,
        winRankImprovement: 1,
        bestChampions: [13, 4, 41, 901, 223, 81].map((championId) => ({ championId }))
      }
    ])
  })

  it('accepts an unambiguous legacy augment field', () => {
    const result = parseQq101MayhemAugments(
      envelope('15332', { augmentlist: '1001_255_0.1474_110_0_0.4765_189_1_223,36' }),
      '20260925'
    )

    expect(result.augments).toHaveLength(1)
    expect(result.date).toBe('')
  })

  it('parses ARAM ratios and partner stats without treating them as percentages', () => {
    const result = parseQq101AramChampions(
      envelope('6993', {
        listcollect:
          '22_1_未变化_0.5487_0.1413_25,0.0539,0.6097,1&11,0.0436,0.6119,2_231.0217_0.6673_0.2096_0.1639'
      }),
      '20260925'
    )

    expect(result.date).toBe('20260925')
    expect(result.champions).toHaveLength(1)
    expect(result.champions[0]).toMatchObject({
      championId: 22,
      rank: 1,
      rankChange: 0,
      winRate: 0.5487,
      pickRate: 0.1413,
      bestPartners: [
        { championId: 25, pickRate: 0.0539, winRate: 0.6097, rank: 1 },
        { championId: 11, pickRate: 0.0436, winRate: 0.6119, rank: 2 }
      ],
      averageDeathTimeSeconds: 231.0217,
      killParticipationRate: 0.6673,
      damageShare: 0.2096,
      damageTakenShare: 0.1639
    })
    expect(result.champions[0]).not.toHaveProperty('lowestRankAugmentIds')
  })

  it('retains Mayhem-specific augment recommendations and rank changes', () => {
    const result = parseQq101MayhemChampions(
      envelope('15380', {
        listcollect:
          '157_1_下降1_0.5723_0.1073_17,0.0588,0.6166,1_298.6129_0.6094_0.2049_0.1873_1077,1336,1058'
      }),
      '20260925'
    )

    expect(result.champions[0]).toMatchObject({
      championId: 157,
      rankChange: -1,
      winRate: 0.5723,
      lowestRankAugmentIds: [1077, 1336, 1058]
    })
  })

  it('distinguishes an empty ranking from a changed or ambiguous response schema', () => {
    expect(
      parseQq101AramChampions(envelope('6993', { listcollect: '' }), '20260925').champions
    ).toEqual([])
    expect(() => parseQq101AramChampions(envelope('6993', { renamed: '' }), '20260925')).toThrow(
      'record string'
    )
    const response = { code: 0, data: { _fieldValues: { R1: '{}', R2: '{}' } } }
    expect(() => parseQq101AramChampions(response, '20260925')).toThrow('unambiguous field')
    expect(() => parseQq101AramChampions({ code: 1 }, '20260925')).toThrow('upstream')
    expect(() => parseQq101AramChampions({ code: 0, data: 'not-json' }, '20260925')).toThrow(
      'embedded JSON'
    )
  })

  it('parses the live ranked record shape into ratios and numeric IDs', () => {
    const result = parseQq101TierList(
      envelope('17960', {
        dtstatdate: '20260820',
        datadetails: '1_75_T0_TOP_53.53_6.68_7.15_223,14,897_14_1'
      }),
      '16.16'
    )

    expect(result).toEqual({
      date: '20260820',
      patch: '16.16',
      champions: [
        {
          rank: 1,
          championId: 75,
          rowKey: '75:TOP',
          strengthTier: 'T0',
          position: 'TOP',
          winRate: 0.5353,
          pickRate: 0.0668,
          banRate: 0.0715,
          counterChampionIds: [223, 14, 897],
          rankChange: 14,
          dailyAverageSurge: 1,
          isHot: false
        }
      ]
    })
  })

  it('parses Mayhem pairs without carrying localized champion metadata', () => {
    const result = parseQq101MayhemPairSynergies(
      envelope('15323', {
        dtstatdate: '20260820',
        championid_data: '103;64|mage;fighter|0.58|0.1|1'
      })
    )

    expect(result).toEqual({
      date: '20260820',
      synergies: [
        {
          champions: [{ championId: 103 }, { championId: 64 }],
          winRate: 0.58,
          pickRate: 0.1,
          rank: 1
        }
      ]
    })
  })

  it('parses classic rankings and maps Jade IDs back to regular champion IDs', () => {
    const result = parseQq101ClassicTierList(
      envelope('18009', {
        dtstatdate: '20260823',
        tierscore_top_hero_list: '1|60081|52.77|57.98|3.35|T0|-1'
      }),
      'bottom'
    )

    expect(result).toEqual({
      date: '20260823',
      champions: [
        {
          rank: 1,
          championId: 81,
          classicChampionId: 60081,
          strengthTier: 'T0',
          position: 'BOTTOM',
          winRate: 0.5277,
          pickRate: 0.5798,
          banRate: 0.0335,
          counterChampionIds: [],
          rankChange: -1
        }
      ]
    })
  })

  it('accepts successful unpublished snapshots but rejects truncated records and renamed fields', () => {
    const response = { code: 0, data: { _fieldValues: { R17960: '' } } }
    expect(parseQq101TierList(response, '16.19').champions).toEqual([])
    expect(() => parseQq101TierList(envelope('17960', { datadetails: '1_103' }), '16.19')).toThrow(
      'truncated'
    )
    expect(() => parseQq101Build(envelope('18087', { renamed_details: '' }), 103)).toThrow(
      'record string'
    )
  })

  it('sorts rune pages and resolves catalog keystones outside numeric style ranges', () => {
    const result = parseQq101Runes(
      envelope('18119', {
        rune_top_details:
          '10_9923_ws_9923,8139,8140,8106,8210,8226,5008,5008,5001_1.08_54.34_219#2_8992_zj_8992,8226,8210,8237,8106,8139,5005,5008,5001_5.61_49.74_1134'
      }),
      103
    )
    expect(
      result.pages.map((page) => [page.rank, page.primaryStyleId, page.secondaryStyleId])
    ).toEqual([
      [2, 8200, 8100],
      [10, 8100, 8200]
    ])
  })

  it('preserves classic source identity and jungle route ordering', () => {
    expect(
      parseQq101ClassicLanes(envelope('18037', { hero_lane_list: '60117_support;jungle' }))
        .champions
    ).toEqual([{ classicChampionId: 60117, positions: ['support', 'jungle'] }])
    const routes = parseQq101JungleRoutes(
      envelope('18782', {
        data_details: '255*100:[10_BLUEGOLEM,GROMP_10_1.5_50#2_RAPTOR,REDLIZARD_20_3_60]'
      }),
      64
    )
    expect(routes.groups[0]).toMatchObject({ startingCamp: null, teamId: 100 })
    expect(routes.groups[0].routes.map((route) => [route.rank, route.winRate])).toEqual([
      [2, 0.6],
      [10, 0.5]
    ])
  })

  it('parses hero-specific augment and item units without substituting global statistics', () => {
    const result = parseQq101MayhemDetails(
      envelope('15318', {
        dtstatdate: '20260925',
        augment_json_irank: '255:1|103|2132|255|0.1658|S',
        itemone_json: JSON.stringify({ '1': { itemone: '228002', winrate: 5186, showrate: 7750 } }),
        itemout: '1056,2003,2003$0.4$0.52'
      }),
      103
    )!
    expect(result.augments[0]).toMatchObject({
      augmentId: 2132,
      pickRate: 0.1658,
      grade: 'S',
      quality: null
    })
    expect(result.items[0]).toMatchObject({ itemIds: [228002], winRate: 0.5186, pickRate: 0.775 })
    expect(result.starting[0].itemIds).toEqual([1056, 2003, 2003])
  })
})
