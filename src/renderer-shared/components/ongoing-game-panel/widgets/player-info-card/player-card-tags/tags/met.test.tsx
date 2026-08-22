import type { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { createDefaultOngoingGamePanelPlayerCardTagSettings } from '@shared/shards/ongoing-game/settings'
import type { SavedInfo } from '@shared/shards/saved-player'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { describe, expect, it } from 'vitest'
import { isVNode } from 'vue'

import type { PlayerCardTagContext } from '../types'
import { MET_TAG } from './met'

dayjs.extend(relativeTime)

function collectText(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(collectText).join('')
  }

  if (isVNode(value)) {
    return collectText(value.children)
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }

  return ''
}

function createParticipant(overrides: Record<string, unknown> = {}) {
  return {
    assists: 8,
    champLevel: 18,
    championId: 1,
    deaths: 2,
    doubleKills: 0,
    gameEndedInEarlySurrender: false,
    gameEndedInSurrender: false,
    goldEarned: 12000,
    goldSpent: 11000,
    individualPosition: 'MIDDLE',
    item0: 0,
    item1: 0,
    item2: 0,
    item3: 0,
    item4: 0,
    item5: 0,
    item6: 0,
    kills: 4,
    magicDamageDealtToChampions: 0,
    magicDamageTaken: 0,
    neutralMinionsKilled: 0,
    participantId: 1,
    pentaKills: 0,
    physicalDamageDealtToChampions: 0,
    physicalDamageTaken: 0,
    playerAugment1: 0,
    playerAugment2: 0,
    playerAugment3: 0,
    playerAugment4: 0,
    playerAugment5: 0,
    playerAugment6: 0,
    playerSubteamId: 0,
    profileIcon: 1,
    puuid: 'self-puuid',
    quadraKills: 0,
    riotIdGameName: 'Self',
    riotIdTagline: 'NA1',
    roleBoundItem: 0,
    spell1Id: 4,
    spell2Id: 14,
    subteamPlacement: 0,
    summonerName: 'Self',
    teamEarlySurrendered: false,
    teamId: 100,
    teamPosition: 'MIDDLE',
    timeCCingOthers: 0,
    totalDamageDealtToChampions: 10000,
    totalDamageShieldedOnTeammates: 0,
    totalDamageTaken: 9000,
    totalHeal: 0,
    totalMinionsKilled: 120,
    tripleKills: 0,
    trueDamageDealtToChampions: 0,
    trueDamageTaken: 0,
    visionScore: 10,
    win: true,
    ...overrides
  }
}

function createSavedInfo(overrides: Partial<SavedInfo> = {}): SavedInfo {
  return {
    puuid: 'opponent-puuid',
    selfPuuid: 'self-puuid',
    region: 'NA',
    rsoPlatformId: 'NA1',
    tag: null,
    updateAt: new Date(0),
    lastMetAt: new Date(0),
    tags: [],
    encounteredGames: {
      data: [
        {
          id: 1,
          gameId: 1001,
          puuid: 'opponent-puuid',
          selfPuuid: 'self-puuid',
          region: 'NA',
          rsoPlatformId: 'NA1',
          queueType: 'RANKED_SOLO_5x5',
          updateAt: new Date(0),
          championId: 1
        }
      ],
      page: 1,
      pageSize: 5,
      total: 1
    },
    ...overrides
  }
}

function createSgpGame(
  gameId: number,
  gameCreation = 0,
  opponentOverrides: Record<string, unknown> = {}
) {
  return {
    gameId,
    source: 'sgp',
    data: {
      json: {
        endOfGameResult: 'GameComplete',
        gameCreation,
        gameDuration: 1200,
        gameEndTimestamp: 1200,
        gameId,
        gameMode: 'CLASSIC',
        gameName: 'game',
        gameStartTimestamp: 0,
        gameType: 'MATCHED_GAME',
        gameVersion: '1.0.0',
        mapId: 11,
        participants: [
          createParticipant(),
          createParticipant({
            assists: 5,
            championId: 2,
            deaths: 3,
            kills: 6,
            participantId: 2,
            puuid: 'opponent-puuid',
            riotIdGameName: 'Opponent',
            summonerName: 'Opponent',
            ...opponentOverrides
          })
        ],
        platformId: 'NA1',
        queueId: 420,
        seasonId: 1,
        teams: [],
        tournamentCode: ''
      },
      metadata: {}
    }
  } as unknown as LcuOrSgpGameSummary
}

function createContext(
  overrides: Partial<PlayerCardTagContext> & { matchHistory?: Record<string, unknown> } = {}
): PlayerCardTagContext {
  const savedInfo = createSavedInfo()
  const cachedGame = createSgpGame(1001)

  return {
    puuid: 'opponent-puuid',
    selfPuuid: 'self-puuid',
    settings: createDefaultOngoingGamePanelPlayerCardTagSettings(),
    analysis: null,
    summoners: {},
    savedInfo,
    matchHistory: {},
    cachedGames: {
      1001: cachedGame
    },
    locale: 'zh-CN',
    t: ((key: string, options?: { gameId?: string | number }) => {
      if (key === 'ongoingGame.playerCard.metPopover.winResult.win') {
        return 'WIN'
      }

      if (key === 'ongoingGame.playerCard.metPopover.team.teammate') {
        return 'ALLY'
      }

      if (key === 'ongoingGame.playerCard.metPopover.inspectByGameId') {
        return `GAME:${options?.gameId ?? ''};`
      }

      if (key === 'ongoingGame.playerCard.met') {
        return 'MET'
      }

      if (key === 'ongoingGame.playerCard.metLastGameTeammate') {
        return 'LAST_ALLY'
      }

      if (key === 'ongoingGame.playerCard.metLastGameOpponent') {
        return 'LAST_OPPONENT'
      }

      return key
    }) as PlayerCardTagContext['t'],
    masked: (text) => text,
    navigateToSummonerByPuuid: () => {},
    previewEncounteredGame: () => {},
    ...overrides
  } as PlayerCardTagContext
}

describe('MET_TAG', () => {
  it('does not render placement zero as a text node in normal matches', () => {
    const rendered = MET_TAG.render(createContext())

    expect(rendered).not.toBeNull()
    expect(collectText(rendered!.popover!.content)).not.toContain('WIN0ALLY')
  })

  it('renders spaces around slashes in encountered game kda values', () => {
    const rendered = MET_TAG.render(createContext())

    expect(rendered).not.toBeNull()
    const text = collectText(rendered!.popover!.content)
    expect(text).toContain('4 / 2 / 8')
    expect(text).toContain('6 / 3 / 5')
    expect(text).not.toContain('4/2/8')
    expect(text).not.toContain('6/3/5')
  })

  it('renders met tag from recent match history when saved info is absent', () => {
    const recentGame = createSgpGame(2001, 1000)
    const rendered = MET_TAG.render(
      createContext({
        savedInfo: null,
        matchHistory: {
          'opponent-puuid': {
            data: [recentGame]
          }
        },
        cachedGames: {
          2001: recentGame
        }
      })
    )

    expect(rendered).not.toBeNull()
    expect(collectText(rendered!.popover!.content)).toContain('GAME:2001;')
  })

  it('keeps only forty merged encountered games', () => {
    const games = Array.from({ length: 45 }, (_, index) => createSgpGame(2000 + index, index))
    const cachedGames = Object.fromEntries(games.map((game) => [game.gameId, game]))
    const rendered = MET_TAG.render(
      createContext({
        savedInfo: null,
        matchHistory: {
          'opponent-puuid': {
            data: games
          }
        },
        cachedGames
      })
    )

    expect(rendered).not.toBeNull()
    const text = collectText(rendered!.popover!.content)
    expect(text.match(/GAME:/g)).toHaveLength(40)
    expect(text).toContain('GAME:2044;')
    expect(text).not.toContain('GAME:2000;')
  })

  it('renders last-game teammate when both players latest match is the encountered same-team match', () => {
    const lastGame = createSgpGame(3001, 3000)
    const rendered = MET_TAG.render(
      createContext({
        savedInfo: null,
        matchHistory: {
          'self-puuid': {
            data: [lastGame]
          },
          'opponent-puuid': {
            data: [lastGame]
          }
        },
        cachedGames: {
          3001: lastGame
        }
      })
    )

    expect(rendered).not.toBeNull()
    expect(collectText(rendered!.label)).toBe('LAST_ALLY')
  })

  it('renders last-game opponent when both players latest match is the encountered opposite-team match', () => {
    const lastGame = createSgpGame(3001, 3000, { teamId: 200 })
    const rendered = MET_TAG.render(
      createContext({
        savedInfo: null,
        matchHistory: {
          'self-puuid': {
            data: [lastGame]
          },
          'opponent-puuid': {
            data: [lastGame]
          }
        },
        cachedGames: {
          3001: lastGame
        }
      })
    )

    expect(rendered).not.toBeNull()
    expect(collectText(rendered!.label)).toBe('LAST_OPPONENT')
  })

  it('keeps met label when self has played a newer game after the encounter', () => {
    const encounterGame = createSgpGame(3001, 3000, { teamId: 200 })
    const newerSelfGame = createSgpGame(3002, 4000, { puuid: 'other-puuid' })
    const rendered = MET_TAG.render(
      createContext({
        savedInfo: null,
        matchHistory: {
          'self-puuid': {
            data: [newerSelfGame, encounterGame]
          },
          'opponent-puuid': {
            data: [encounterGame]
          }
        },
        cachedGames: {
          3001: encounterGame,
          3002: newerSelfGame
        }
      })
    )

    expect(rendered).not.toBeNull()
    expect(collectText(rendered!.label)).toBe('MET')
  })
})
