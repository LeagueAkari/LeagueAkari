import type { AggregatedAnalysis } from '@shared/data-adapter/analysis/player'
import { describe, expect, it } from 'vitest'

import { toLanWebAnalysis, toLanWebDetailedAnalysis } from './dto'

describe('LAN Web DTO projection', () => {
  it('projects aggregate analysis without exposing per-game maps', () => {
    const internal = {
      count: 12,
      detailsCount: 4,
      map: { 123: { sensitiveInternalShape: true } },
      winLoss: {
        all: {
          count: 12,
          wins: 7,
          losses: 5,
          winRate: 7 / 12,
          activeSessionWins: 2,
          activeSessionLosses: 1,
          winningStreak: 2,
          losingStreak: 0
        }
      },
      teamSide: { blueSideCount: 8, redSideCount: 4 },
      champions: {
        103: {
          championId: 103,
          winLoss: { all: { count: 5, wins: 3, losses: 2, winRate: 0.6 } }
        }
      },
      summary: {
        kills: 60,
        deaths: 40,
        assists: 90,
        avgKda: 3.75,
        avgKillParticipation: 0.62,
        avgChampionDamagePercentageOfTeam: 0.27,
        avgDamageTakenPercentageOfTeam: 0.19,
        avgGoldPercentageOfTeam: 0.22,
        avgChampionDamagePerMinute: 712,
        avgCsPerMinute: 6.8,
        avgVisionScore: 24
      },
      akariScore: { total: 73, maxScore: 100 }
    } as unknown as AggregatedAnalysis

    const dto = toLanWebAnalysis(internal)
    expect(dto).toMatchObject({
      gameCount: 12,
      wins: 7,
      losses: 5,
      akariScore: 73,
      winningStreak: 2,
      blueSideCount: 8,
      champions: [{ championId: 103, gameCount: 5 }]
    })
    expect(dto).not.toHaveProperty('map')

    const detailedDto = toLanWebDetailedAnalysis(internal)
    expect(detailedDto).not.toHaveProperty('map')
    expect(detailedDto).toMatchObject({
      count: 12,
      detailsCount: 4,
      summary: { avgKda: 3.75 }
    })
  })
})
