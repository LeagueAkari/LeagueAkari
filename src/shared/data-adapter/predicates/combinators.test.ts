import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  type GameScope,
  type ParticipantScope,
  damageDealtToChampionsBetween,
  dgrBetween,
  gameCreationInTimeRange,
  goldBetween,
  hasPerk,
  hasPerkStyle,
  isGameMode,
  isMap,
  killParticipationBetween,
  soloKillsBetween
} from './combinators'

const createScope = (gameCreation: number): GameScope => ({
  summary: { source: 'lcu', gameId: 1, data: {} as any },
  basicInfo: {
    dataSource: 'lcu',
    gameVersion: '',
    gameId: 1,
    isTwoTeam: true,
    isCherrySubteam: false,
    gameCreation,
    gameDuration: 0,
    gameType: 'MATCHED_GAME',
    queueId: 420,
    gameMode: 'CLASSIC',
    mapId: 11,
    gameModeMutators: null
  },
  participants: [],
  teams: {} as any
})

const createParticipant = (participant: Partial<ParticipantScope['participant']>) =>
  ({
    puuid: 'puuid',
    teamIdentifier: 'TEAM-100',
    killParticipation: 0,
    damageGoldEfficiency: 0,
    totalDamageDealtToChampions: 0,
    goldEarned: 0,
    soloKills: null,
    perks: {
      statPerks: null,
      styles: []
    },
    ...participant
  }) as ParticipantScope['participant']

const createParticipantScope = (
  participant: Partial<ParticipantScope['participant']>,
  participants: Partial<ParticipantScope['participant']>[] = []
) => {
  const fullParticipant = createParticipant(participant)

  return {
    context: {
      ...createScope(Date.now()),
      participants: participants.length
        ? [fullParticipant, ...participants.map(createParticipant)]
        : [fullParticipant]
    },
    participant: fullParticipant
  }
}

describe('gameCreationInTimeRange', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('matches the last 3 hours', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-20T15:30:00+08:00'))

    const predicate = gameCreationInTimeRange('last3Hours')

    expect(predicate(createScope(Date.now() - 3 * 60 * 60 * 1000))).toBe(true)
    expect(predicate(createScope(Date.now() - 3 * 60 * 60 * 1000 - 1))).toBe(false)
  })

  it('matches the last 12 hours', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-20T15:30:00+08:00'))

    const predicate = gameCreationInTimeRange('last12Hours')

    expect(predicate(createScope(Date.now() - 12 * 60 * 60 * 1000))).toBe(true)
    expect(predicate(createScope(Date.now() - 12 * 60 * 60 * 1000 - 1))).toBe(false)
  })

  it('matches the last 24 hours', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-20T15:30:00+08:00'))

    const predicate = gameCreationInTimeRange('last24Hours')

    expect(predicate(createScope(Date.now() - 24 * 60 * 60 * 1000))).toBe(true)
    expect(predicate(createScope(Date.now() - 24 * 60 * 60 * 1000 - 1))).toBe(false)
  })

  it('matches rolling recent-day ranges', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-20T15:30:00+08:00'))

    const predicate = gameCreationInTimeRange('last7Days')

    expect(predicate(createScope(Date.now() - 7 * 24 * 60 * 60 * 1000))).toBe(true)
    expect(predicate(createScope(Date.now() - 7 * 24 * 60 * 60 * 1000 - 1))).toBe(false)
  })
})

describe('game summary combinators', () => {
  it('matches game mode and map from basic info', () => {
    const scope = createScope(Date.now())

    expect(isGameMode('CLASSIC')(scope)).toBe(true)
    expect(isGameMode('ARAM')(scope)).toBe(false)
    expect(isMap(11)(scope)).toBe(true)
    expect(isMap(12)(scope)).toBe(false)
  })
})

describe('participant summary combinators', () => {
  it('uses percentage input for ratio-like stats', () => {
    const scope = createParticipantScope({
      killParticipation: 0.75,
      damageGoldEfficiency: 1.2
    })

    expect(killParticipationBetween(70, 80)(scope)).toBe(true)
    expect(killParticipationBetween(80, 100)(scope)).toBe(false)
    expect(dgrBetween(100, 130)(scope)).toBe(true)
    expect(dgrBetween(0, 100)(scope)).toBe(false)
  })

  it('supports team-share and team-high measure modes for additive stats', () => {
    const scope = createParticipantScope(
      {
        totalDamageDealtToChampions: 30000,
        goldEarned: 12000
      },
      [
        { totalDamageDealtToChampions: 15000, goldEarned: 10000 },
        { totalDamageDealtToChampions: 15000, goldEarned: 8000 }
      ]
    )

    expect(damageDealtToChampionsBetween('teamShare', 49, 51)(scope)).toBe(true)
    expect(damageDealtToChampionsBetween('teamMaxShare', 99, 100)(scope)).toBe(true)
    expect(goldBetween('teamShare', 39, 41)(scope)).toBe(true)
    expect(goldBetween('teamMaxShare', 99, 100)(scope)).toBe(true)
  })

  it('supports all-player share and game-high measure modes for additive stats', () => {
    const scope = createParticipantScope(
      {
        totalDamageDealtToChampions: 30000,
        goldEarned: 12000
      },
      [
        { teamIdentifier: 'TEAM-100', totalDamageDealtToChampions: 15000, goldEarned: 10000 },
        { teamIdentifier: 'TEAM-200', totalDamageDealtToChampions: 30000, goldEarned: 11000 },
        { teamIdentifier: 'TEAM-200', totalDamageDealtToChampions: 15000, goldEarned: 7000 }
      ]
    )

    expect(damageDealtToChampionsBetween('gameShare', 33, 34)(scope)).toBe(true)
    expect(damageDealtToChampionsBetween('gameMaxShare', 99, 100)(scope)).toBe(true)
    expect(goldBetween('gameShare', 29, 31)(scope)).toBe(true)
    expect(goldBetween('gameMaxShare', 99, 100)(scope)).toBe(true)
  })

  it('does not match nullable SGP-only stats when unavailable', () => {
    expect(soloKillsBetween(1, 3)(createParticipantScope({ soloKills: null }))).toBe(false)
    expect(soloKillsBetween(1, 3)(createParticipantScope({ soloKills: 2 }))).toBe(true)
  })

  it('matches rune selections and rune styles', () => {
    const scope = createParticipantScope({
      perks: {
        statPerks: null,
        styles: [
          {
            description: 'primaryStyle',
            style: 8000,
            selections: [
              { perk: 8005, var1: 0, var2: 0, var3: 0 },
              { perk: 9111, var1: 0, var2: 0, var3: 0 }
            ]
          },
          {
            description: 'subStyle',
            style: 8400,
            selections: [{ perk: 8473, var1: 0, var2: 0, var3: 0 }]
          }
        ]
      }
    })

    expect(hasPerk(9111)(scope)).toBe(true)
    expect(hasPerk(8473, 2)(scope)).toBe(true)
    expect(hasPerk(8473, 1)(scope)).toBe(false)
    expect(hasPerkStyle(8000, 0)(scope)).toBe(true)
    expect(hasPerkStyle(8400, 0)(scope)).toBe(false)
  })
})
