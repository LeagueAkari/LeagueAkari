import { describe, expect, it } from 'vitest'

import type { PreparedGame } from '../types/helpers'
import { computeAggregatedChampions } from './champions'

const baseSummary = {
  championDamageRatioToTeamMax: 1,
  championDamageRatioToMax: 1,
  championDamagePercentageOfTeam: 1,
  championDamagePerMinute: 1,
  damageTakenRatioToTeamMax: 1,
  damageTakenRatioToMax: 1,
  damageTakenPercentageOfTeam: 1,
  goldRatioToTeamMax: 1,
  goldRatioToMax: 1,
  goldPercentageOfTeam: 1,
  csRatioToTeamMax: 1,
  csRatioToMax: 1,
  csPercentageOfTeam: 1,
  csPerMinute: 1,
  towerDamageRatioToTeamMax: 1,
  towerDamageRatioToMax: 1,
  towerDamagePercentageOfTeam: 1,
  totalDamageShieldedOnTeammatesRatioToTeamMax: null,
  totalDamageShieldedOnTeammatesRatioToMax: null,
  totalDamageShieldedOnTeammatesPercentageOfTeam: null,
  killDamageEfficiency: 1,
  kda: 1,
  win: true,
  killParticipation: 1,
  damageGoldEfficiency: 1
}

function createPreparedGame(championId: number, position: string, gameId: number): PreparedGame {
  const participant = {
    championId,
    position,
    kills: 1,
    deaths: 1,
    assists: 1,
    kda: 2,
    winResult: 'win',
    subteamPlacement: 0,
    soloKills: null,
    pings: null
  }

  return {
    gameId,
    basic: {
      gameCreation: Date.now() - gameId * 60_000,
      gameDuration: 1800,
      gameMode: 'CLASSIC'
    },
    participant,
    participants: [participant],
    single: {
      gameId,
      summary: baseSummary,
      details: null,
      akariScore: {
        kdaScore: 0,
        winRateScore: 0,
        dmgScore: 0,
        dmgTakenScore: 0,
        csScore: 0,
        goldScore: 0,
        participationScore: 0,
        total: 0,
        outstanding: false,
        extraordinary: false
      }
    }
  } as PreparedGame
}

describe('computeAggregatedChampions', () => {
  it('aggregates positions for each champion separately', () => {
    const champions = computeAggregatedChampions([
      createPreparedGame(103, 'MIDDLE', 1),
      createPreparedGame(103, 'JUNGLE', 2),
      createPreparedGame(64, 'JUNGLE', 3)
    ])

    expect(champions[103].positions).toEqual({
      TOP: 0,
      JUNGLE: 1,
      MIDDLE: 1,
      BOTTOM: 0,
      UTILITY: 0
    })
    expect(champions[64].positions).toEqual({
      TOP: 0,
      JUNGLE: 1,
      MIDDLE: 0,
      BOTTOM: 0,
      UTILITY: 0
    })
  })
})
