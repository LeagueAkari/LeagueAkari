import { analyzeGames } from '@shared/data-adapter/analysis/player'
import type { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import type {
  OngoingGameAnalysis,
  OngoingGamePanelPlayerCardTagSettings,
  OngoingGamePanelSettings,
  QueryStage
} from '@shared/shards/ongoing-game'
import { createDefaultOngoingGamePanelPlayerCardTagSettings } from '@shared/shards/ongoing-game/settings'
import currentRankedGameRaw from '@shared/test-fixtures/api/snapshots/2026-05-16-tencent-hn10/lcu/match-history/games/q_420.json?raw'
import sgpQ420Raw from '@shared/test-fixtures/api/snapshots/2026-05-16-tencent-hn10/sgp/match-history-query/q_420.json?raw'
import sgpQ440Raw from '@shared/test-fixtures/api/snapshots/2026-05-16-tencent-hn10/sgp/match-history-query/q_440.json?raw'
import sgpQ2400Raw from '@shared/test-fixtures/api/snapshots/2026-05-16-tencent-hn10/sgp/match-history-query/q_2400.json?raw'
import type { Game, ParticipantIdentity } from '@shared/types/league-client/match-history'
import type { SummonerInfo } from '@shared/types/league-client/summoner'
import type { SgpGameSummaryLol, SgpMatchHistoryLol } from '@shared/types/sgp/match-history'

import type { OngoingGameProviderValue } from './types'

type StoryOngoingGameProviderVariant = 'active' | 'disconnected' | 'disabled' | 'no-game'

function readFixture<T>(raw: string): T {
  return JSON.parse(raw) as T
}

function lcuSummary(game: Game): LcuOrSgpGameSummary {
  return {
    gameId: game.gameId,
    source: 'lcu',
    data: game
  }
}

function sgpSummary(game: SgpGameSummaryLol): LcuOrSgpGameSummary {
  return {
    gameId: game.json.gameId,
    source: 'sgp',
    data: game
  }
}

const currentRankedGame = readFixture<Game>(currentRankedGameRaw)
const sgpFullMatchHistories = [sgpQ2400Raw, sgpQ420Raw, sgpQ440Raw].map((raw) =>
  readFixture<SgpMatchHistoryLol>(raw)
)
const fullSgpHistorySummaries = sgpFullMatchHistories
  .flatMap((history) => history.games)
  .filter(
    (game, index, games) =>
      games.findIndex((item) => item.json.gameId === game.json.gameId) === index
  )
  .map(sgpSummary)
const currentRankedGameSummary = lcuSummary(currentRankedGame)
const currentSummonerIdentity =
  currentRankedGame.participantIdentities.find(
    (identity) => identity.player.gameName === 'Konata' && identity.player.tagLine === '31459'
  ) ?? currentRankedGame.participantIdentities[0]
const currentSummonerPuuid = currentSummonerIdentity?.player.puuid ?? ''
const currentGamePuuidByParticipantId = new Map(
  currentRankedGame.participantIdentities.map((identity) => [
    identity.participantId,
    identity.player.puuid
  ])
)
const currentGameIdentityByPuuid = new Map(
  currentRankedGame.participantIdentities.map((identity) => [identity.player.puuid, identity])
)

const storyCurrentPlayerAnalysis = analyzeGames(
  fullSgpHistorySummaries.map((summary) => ({
    gameId: summary.gameId,
    summary
  })),
  currentSummonerPuuid
)

const activeQueryStage: QueryStage = {
  phase: 'in-game',
  gameInfo: {
    gameId: currentRankedGame.gameId,
    gameMode: currentRankedGame.gameMode,
    queueId: currentRankedGame.queueId,
    queueType: 'RANKED_SOLO_5x5'
  }
}

const unavailableQueryStage: QueryStage = {
  phase: 'unavailable',
  gameInfo: null
}

const positionsByTeam: Record<number, string[]> = {
  100: ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'],
  200: ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY']
}

function createTeams() {
  return currentRankedGame.participants.reduce(
    (teams, participant) => {
      const puuid = currentGamePuuidByParticipantId.get(participant.participantId)

      if (!puuid) {
        return teams
      }

      const team = `TEAM-${participant.teamId}`
      teams[team] ??= []
      teams[team].push(puuid)
      return teams
    },
    {} as Record<string, string[]>
  )
}

function createChampionSelections() {
  return currentRankedGame.participants.reduce(
    (selections, participant) => {
      const puuid = currentGamePuuidByParticipantId.get(participant.participantId)

      if (puuid) {
        selections[puuid] = participant.championId
      }

      return selections
    },
    {} as Record<string, number>
  )
}

function createPositionAssignments() {
  const teamIndex: Record<number, number> = {}

  return currentRankedGame.participants.reduce(
    (assignments, participant) => {
      const puuid = currentGamePuuidByParticipantId.get(participant.participantId)

      if (!puuid) {
        return assignments
      }

      const index = teamIndex[participant.teamId] ?? 0
      teamIndex[participant.teamId] = index + 1
      assignments[puuid] = {
        position: positionsByTeam[participant.teamId]?.[index] ?? 'NONE',
        role: null
      }

      return assignments
    },
    {} as OngoingGameProviderValue['positionAssignments']
  )
}

function createSpellSelections() {
  return currentRankedGame.participants.reduce(
    (spells, participant) => {
      const puuid = currentGamePuuidByParticipantId.get(participant.participantId)

      if (puuid) {
        spells[puuid] = {
          spell1Id: participant.spell1Id,
          spell2Id: participant.spell2Id
        }
      }

      return spells
    },
    {} as OngoingGameProviderValue['spells']
  )
}

function toSummonerInfo(identity: ParticipantIdentity, index: number): SummonerInfo {
  const { player } = identity
  const gameName = player.gameName || player.summonerName || `Player ${index + 1}`

  return {
    accountId: player.currentAccountId || player.accountId,
    displayName: gameName,
    gameName,
    internalName: gameName.toLowerCase(),
    nameChangeFlag: false,
    percentCompleteForNextLevel: 0,
    privacy: 'PUBLIC',
    profileIconId: player.profileIcon,
    puuid: player.puuid,
    rerollPoints: {
      currentPoints: 0,
      maxRolls: 2,
      numberOfRolls: 0,
      pointsCostToRoll: 250,
      pointsToReroll: 250
    },
    tagLine: player.tagLine,
    summonerId: player.summonerId,
    summonerLevel: player.puuid === currentSummonerPuuid ? 356 : 120 + index,
    unnamed: false,
    xpSinceLastLevel: 0,
    xpUntilNextLevel: 0
  }
}

function createSummoners() {
  return Object.fromEntries(
    currentRankedGame.participantIdentities.map((identity, index) => [
      identity.player.puuid,
      toSummonerInfo(identity, index)
    ])
  )
}

function createAnalysis(): OngoingGameAnalysis {
  return {
    players: storyCurrentPlayerAnalysis
      ? {
          [currentSummonerPuuid]: storyCurrentPlayerAnalysis
        }
      : {},
    teams: {}
  }
}

function createAllEnabledPlayerCardTagSettings(): OngoingGamePanelPlayerCardTagSettings {
  const settings = createDefaultOngoingGamePanelPlayerCardTagSettings()

  for (const key of Object.keys(settings) as Array<keyof OngoingGamePanelPlayerCardTagSettings>) {
    settings[key] = true
  }

  return settings
}

function createSettings(enabled: boolean): OngoingGamePanelSettings {
  return {
    enabled,
    matchHistoryLoadCount: fullSgpHistorySummaries.length,
    orderPlayerBy: 'position',
    showChampionUsage: 'recent',
    showMatchHistoryItemBorder: true,
    showJunglePathing: true,
    showJunglePathingForAllPlayers: false,
    playerCardTags: createAllEnabledPlayerCardTagSettings()
  }
}

export const storyOngoingGamePanelSource = {
  currentGame: 'LCU match-history game fixture q_420',
  currentPlayerHistory:
    'full SGP match-history-query fixtures q_2400, q_420, and q_440, 2026-05-16-tencent-hn10',
  staticResources: 'Community Dragon (raw.communitydragon.org)',
  currentPlayerPuuid: currentSummonerPuuid,
  currentPlayerName: currentGameIdentityByPuuid.get(currentSummonerPuuid)?.player.gameName ?? '',
  currentPlayerHistoryCount: fullSgpHistorySummaries.length
}

export function createStoryOngoingGameProviderValue(
  variant: StoryOngoingGameProviderVariant = 'active'
): OngoingGameProviderValue {
  const active = variant === 'active'

  return {
    get settings() {
      return createSettings(variant !== 'disabled')
    },
    get queryStage() {
      return active ? activeQueryStage : unavailableQueryStage
    },
    get draft() {
      return null
    },
    get teams() {
      return active ? createTeams() : {}
    },
    get championSelections() {
      return active ? createChampionSelections() : {}
    },
    get positionAssignments() {
      return active ? createPositionAssignments() : {}
    },
    get mergedPremadeTeamMap() {
      return {}
    },
    get analysis() {
      return active ? createAnalysis() : null
    },
    get summoner() {
      return active ? createSummoners() : {}
    },
    get rankedStats() {
      return {}
    },
    get championMastery() {
      return {}
    },
    get savedInfo() {
      return {}
    },
    get cachedGames() {
      return {}
    },
    get gameDetails() {
      return {}
    },
    get matchHistory() {
      return active
        ? {
            [currentSummonerPuuid]: {
              data: fullSgpHistorySummaries
            }
          }
        : {}
    },
    get matchHistoryLoadingState() {
      return {}
    },
    get spells() {
      return active ? createSpellSelections() : {}
    },
    get isConnected() {
      return variant !== 'disconnected'
    },
    get isSpectating() {
      return false
    },
    get streamerMode() {
      return false
    },
    get selfPuuid() {
      return active ? currentSummonerPuuid : null
    },
    reloadPlayer(puuid, options) {
      console.info('[storybook] reloadPlayer', puuid, options)
    }
  }
}

export const storyOngoingGamePanelPreviewSummary = currentRankedGameSummary
