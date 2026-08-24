import { describe, expect, it } from 'vitest'

import {
  parseQq101MayhemPairSynergies,
  parseQq101TierList,
  toQq101Position,
  toQq101Tier
} from './qq101-protocol'

function envelope(fieldId: string, payload: object) {
  return {
    code: 0,
    data: { _fieldValues: { [`R${fieldId}`]: JSON.stringify(payload) } }
  }
}

describe('QQ101 protocol adapter', () => {
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
          strengthTier: 'T0',
          position: 'TOP',
          winRate: 0.5353,
          pickRate: 0.0668,
          banRate: 0.0715,
          counterChampionIds: [223, 14, 897],
          rankChange: 14
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

  it('maps shared filters to QQ101 request values', () => {
    expect(toQq101Position('utility')).toBe('SUPPORT')
    expect(toQq101Position('middle')).toBe('MIDDLE')
    expect(toQq101Tier('emerald_plus')).toBe(26)
    expect(toQq101Tier('all')).toBe(255)
  })
})
