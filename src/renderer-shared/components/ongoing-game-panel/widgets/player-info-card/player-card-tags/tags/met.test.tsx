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

function createContext(): PlayerCardTagContext {
  const savedInfo: SavedInfo = {
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
          updateAt: new Date(0)
        }
      ],
      page: 1,
      pageSize: 5,
      total: 1
    }
  }

  const cachedGame = {
    gameId: 1001,
    source: 'sgp',
    data: {
      json: {
        endOfGameResult: 'GameComplete',
        gameCreation: 0,
        gameDuration: 1200,
        gameEndTimestamp: 1200,
        gameId: 1001,
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
            summonerName: 'Opponent'
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

  return {
    puuid: 'opponent-puuid',
    selfPuuid: 'self-puuid',
    settings: createDefaultOngoingGamePanelPlayerCardTagSettings(),
    analysis: null,
    summoners: {},
    savedInfo,
    cachedGames: {
      1001: cachedGame
    },
    locale: 'zh-CN',
    t: ((key: string) => {
      if (key === 'ongoingGame.playerCard.metPopover.winResult.win') {
        return 'WIN'
      }

      if (key === 'ongoingGame.playerCard.metPopover.team.teammate') {
        return 'ALLY'
      }

      return key
    }) as PlayerCardTagContext['t'],
    masked: (text) => text,
    navigateToSummonerByPuuid: () => {},
    previewEncounteredGame: () => {}
  }
}

describe('MET_TAG', () => {
  it('does not render placement zero as a text node in normal matches', () => {
    const rendered = MET_TAG.render(createContext())

    expect(rendered).not.toBeNull()
    expect(collectText(rendered!.popover!.content)).not.toContain('WIN0ALLY')
  })
})
