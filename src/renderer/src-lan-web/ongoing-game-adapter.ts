import type { OngoingGameProviderValue } from '@renderer-shared/providers/ongoing-game'
import type { LanWebOngoingGameDto, LanWebRankedEntryDto } from '@shared/shards/lan-web'
import { createDefaultOngoingGamePanelPlayerCardTagSettings } from '@shared/shards/ongoing-game/settings'
import type { RankedEntry, RankedStats } from '@shared/types/league-client/ranked'
import type { SummonerInfo } from '@shared/types/league-client/summoner'
import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'

function toSummoner(
  player: LanWebOngoingGameDto['teams'][number]['players'][number]
): SummonerInfo {
  return {
    accountId: 0,
    displayName: player.gameName,
    gameName: player.gameName,
    internalName: player.gameName,
    nameChangeFlag: false,
    percentCompleteForNextLevel: 0,
    privacy: 'PUBLIC',
    profileIconId: player.profileIconId,
    puuid: player.puuid,
    rerollPoints: {
      currentPoints: 0,
      maxRolls: 0,
      numberOfRolls: 0,
      pointsCostToRoll: 0,
      pointsToReroll: 0
    },
    tagLine: player.tagLine,
    summonerId: 0,
    summonerLevel: player.summonerLevel,
    unnamed: false,
    xpSinceLastLevel: 0,
    xpUntilNextLevel: 0
  }
}

function toRankedEntry(entry?: LanWebRankedEntryDto): RankedEntry {
  return {
    currentSeasonWinsForRewards: 0,
    division: entry?.division ?? 'NA',
    highestDivision: entry?.highestDivision ?? 'NA',
    highestTier: entry?.highestTier ?? 'NA',
    isProvisional: false,
    leaguePoints: entry?.leaguePoints ?? 0,
    losses: entry?.losses ?? 0,
    miniSeriesProgress: '',
    previousSeasonEndDivision: 'NA',
    previousSeasonEndTier: 'NA',
    previousSeasonWinsForRewards: 0,
    provisionalGameThreshold: 0,
    provisionalGamesRemaining: 0,
    previousSeasonHighestTier: 'NA',
    previousSeasonHighestDivision: 'NA',
    queueType: entry?.queueType ?? '',
    ratedRating: 0,
    ratedTier: 'NONE',
    tier: entry?.tier ?? 'NONE',
    wins: entry?.wins ?? 0
  }
}

function toRankedStats(entries: LanWebRankedEntryDto[]): RankedStats {
  const queues = entries.map(toRankedEntry)
  const solo = queues.find((entry) => entry.queueType === 'RANKED_SOLO_5x5')
  const flex = queues.find((entry) => entry.queueType === 'RANKED_FLEX_SR')
  const highest = solo ?? flex ?? toRankedEntry()

  return {
    currentSeasonSplitPoints: 0,
    earnedRegaliaRewardIds: [],
    highestCurrentSeasonReachedTierSR: highest.tier,
    highestPreviousSeasonEndDivision: 'NA',
    highestPreviousSeasonEndTier: 'NA',
    highestRankedEntry: highest,
    highestRankedEntrySR: highest,
    previousSeasonSplitPoints: 0,
    queueMap: {
      RANKED_SOLO_5x5: solo,
      RANKED_FLEX_SR: flex
    },
    queues,
    rankedRegaliaLevel: 0,
    seasons: {},
    splitsProgress: {}
  }
}

export function createLanWebOngoingGameProvider(
  source: MaybeRefOrGetter<LanWebOngoingGameDto>
): OngoingGameProviderValue {
  const game = () => toValue(source)
  const players = () => game().teams.flatMap((team) => team.players)

  return {
    settings: {
      enabled: true,
      matchHistoryLoadCount: 10,
      orderPlayerBy: 'position',
      showChampionUsage: 'recent',
      showMatchHistoryItemBorder: true,
      showJunglePathing: false,
      showJunglePathingForAllPlayers: false,
      playerCardTags: createDefaultOngoingGamePanelPlayerCardTagSettings()
    },
    get queryStage() {
      return {
        phase: game().phase,
        gameInfo: game().gameInfo
      } as OngoingGameProviderValue['queryStage']
    },
    draft: null,
    get teams() {
      return Object.fromEntries(
        game().teams.map((team) => [team.id, team.players.map((p) => p.puuid)])
      )
    },
    get championSelections() {
      return Object.fromEntries(
        players()
          .filter((player) => player.championId !== null)
          .map((player) => [player.puuid, player.championId!])
      )
    },
    get positionAssignments() {
      return Object.fromEntries(
        players().map((player) => [
          player.puuid,
          { position: player.position || 'NONE', role: null }
        ])
      )
    },
    get mergedPremadeTeamMap() {
      return Object.fromEntries(
        players()
          .filter((player) => player.premadeTeamId !== null)
          .map((player) => [player.puuid, player.premadeTeamId!])
      )
    },
    get analysis() {
      const analyzed = players().filter((player) => player.detailedAnalysis)
      return analyzed.length
        ? {
            players: Object.fromEntries(
              analyzed.map((player) => [player.puuid, { ...player.detailedAnalysis!, map: {} }])
            ),
            teams: {}
          }
        : null
    },
    get summoner() {
      return Object.fromEntries(players().map((player) => [player.puuid, toSummoner(player)]))
    },
    get rankedStats() {
      return Object.fromEntries(
        players().map((player) => [player.puuid, toRankedStats(player.ranked)])
      )
    },
    championMastery: {},
    savedInfo: {},
    cachedGames: {},
    gameDetails: {},
    matchHistory: {},
    get matchHistoryViews() {
      return Object.fromEntries(
        players().map((player) => [
          player.puuid,
          player.recentMatches.map((match) => ({
            gameId: match.gameId,
            basicInfo: {
              gameMode: match.gameMode,
              queueId: match.queueId,
              gameCreation: match.gameCreation
            },
            participant: {
              championId: match.championId,
              kills: match.kills,
              deaths: match.deaths,
              assists: match.assists,
              winResult: match.winResult,
              subteamPlacement: 0
            }
          }))
        ])
      )
    },
    get matchHistoryLoadingState() {
      return Object.fromEntries(
        players().map((player) => [player.puuid, player.loadingState || 'loaded'])
      )
    },
    spells: {},
    get isConnected() {
      return game().leagueClientConnected
    },
    isSpectating: false,
    streamerMode: false,
    get selfPuuid() {
      return players().find((player) => player.isSelf)?.puuid ?? null
    },
    reloadPlayer() {}
  }
}
