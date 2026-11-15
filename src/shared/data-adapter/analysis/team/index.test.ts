import { describe, expect, it } from 'vitest'

import type { AggregatedAnalysis } from '../player'
import { analyzePlayers } from './index'

function createMockPlayerAnalysis(akariScoreTotal: number): AggregatedAnalysis {
  return {
    count: 10,
    summary: {
      kills: 50,
      deaths: 20,
      assists: 50
    } as any,
    details: null,
    akariScore: {
      total: akariScoreTotal,
      kdaScore: 1,
      winRateScore: 1,
      dmgScore: 1,
      dmgTakenScore: 1,
      healingScore: 0,
      csScore: 1,
      goldScore: 1,
      participationScore: 1,
      visionScore: 1,
      maxScore: 17,
      outstanding: false,
      extraordinary: false
    },
    map: {},
    teamSide: { redSideCount: 5, blueSideCount: 5 },
    winLoss: {
      all: {
        count: 10,
        wins: 6,
        losses: 4,
        winRate: 0.6,
        winningStreak: 1,
        losingStreak: 0,
        activeSessionWins: 0,
        activeSessionLosses: 0
      },
      normal: {
        count: 10,
        wins: 6,
        losses: 4,
        winRate: 0.6,
        winningStreak: 1,
        losingStreak: 0,
        activeSessionWins: 0,
        activeSessionLosses: 0
      },
      cherry: {} as any
    },
    spells: { flashOnD: 5, flashOnF: 5 },
    positions: null,
    champions: {},
    jungle: null,
    detailsCount: 0
  }
}

describe('analyzePlayers', () => {
  it('returns null when playerAnalyses is empty', () => {
    expect(analyzePlayers([])).toBeNull()
  })

  it('calculates average team akari score correctly for multiple players', () => {
    const p1 = createMockPlayerAnalysis(6.0)
    const p2 = createMockPlayerAnalysis(7.0)
    const p3 = createMockPlayerAnalysis(8.0)

    const teamAnalysis = analyzePlayers([p1, p2, p3])
    expect(teamAnalysis).not.toBeNull()
    expect(teamAnalysis!.avgAkariScore).toBeCloseTo(7.0, 5)
  })

  it('handles single player correctly', () => {
    const p1 = createMockPlayerAnalysis(5.5)

    const teamAnalysis = analyzePlayers([p1])
    expect(teamAnalysis).not.toBeNull()
    expect(teamAnalysis!.avgAkariScore).toBeCloseTo(5.5, 5)
  })
})
