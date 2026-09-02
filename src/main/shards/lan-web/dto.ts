import type { AggregatedAnalysis } from '@shared/data-adapter/analysis/player'
import { toBasicInfo } from '@shared/data-adapter/match-history/match-basic'
import { toParticipants } from '@shared/data-adapter/match-history/participants'
import { toTeams } from '@shared/data-adapter/match-history/teams'
import type { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import type {
  LanWebAnalysisDto,
  LanWebMatchDto,
  LanWebMatchParticipantDto,
  LanWebOngoingRecentMatchDto,
  LanWebRankedEntryDto
} from '@shared/shards/lan-web'
import type { RankedStats } from '@shared/types/league-client/ranked'

export function toLanWebAnalysis(
  analysis: AggregatedAnalysis | undefined
): LanWebAnalysisDto | null {
  if (!analysis) {
    return null
  }

  return {
    gameCount: analysis.count,
    detailsCount: analysis.detailsCount,
    wins: analysis.winLoss.all.wins,
    losses: analysis.winLoss.all.losses,
    winRate: analysis.winLoss.all.winRate,
    kills: analysis.summary.kills,
    deaths: analysis.summary.deaths,
    assists: analysis.summary.assists,
    averageKda: analysis.summary.avgKda,
    averageKillParticipation: analysis.summary.avgKillParticipation,
    averageDamagePercentageOfTeam: analysis.summary.avgChampionDamagePercentageOfTeam,
    averageDamageTakenPercentageOfTeam: analysis.summary.avgDamageTakenPercentageOfTeam,
    averageGoldPercentageOfTeam: analysis.summary.avgGoldPercentageOfTeam,
    averageDamageToChampionsPerMinute: analysis.summary.avgChampionDamagePerMinute,
    averageCsPerMinute: analysis.summary.avgCsPerMinute,
    averageVisionScore: analysis.summary.avgVisionScore,
    activeSessionWins: analysis.winLoss.all.activeSessionWins,
    activeSessionLosses: analysis.winLoss.all.activeSessionLosses,
    winningStreak: analysis.winLoss.all.winningStreak,
    losingStreak: analysis.winLoss.all.losingStreak,
    blueSideCount: analysis.teamSide.blueSideCount,
    redSideCount: analysis.teamSide.redSideCount,
    champions: Object.values(analysis.champions)
      .map((champion) => ({
        championId: champion.championId,
        gameCount: champion.winLoss.all.count,
        wins: champion.winLoss.all.wins,
        losses: champion.winLoss.all.losses,
        winRate: champion.winLoss.all.winRate
      }))
      .sort((a, b) => b.gameCount - a.gameCount || b.wins - a.wins),
    akariScore: analysis.akariScore.total,
    akariScoreMax: analysis.akariScore.maxScore
  }
}

export function toLanWebDetailedAnalysis(
  analysis: AggregatedAnalysis | undefined
): Omit<AggregatedAnalysis, 'map'> | null {
  if (!analysis) {
    return null
  }

  const { map: _perGameAnalysis, ...publicAnalysis } = analysis
  return publicAnalysis
}

function toLanWebParticipant(
  participant: ReturnType<typeof toParticipants>[number]
): LanWebMatchParticipantDto {
  return {
    puuid: participant.puuid,
    gameName: participant.gameName,
    tagLine: participant.tagLine,
    profileIconId: participant.profileIconId,
    participantId: participant.participantId,
    championId: participant.championId,
    position: participant.position,
    teamId: participant.teamId,
    teamIdentifier: participant.teamIdentifier,
    items: participant.items.filter((itemId) => itemId > 0),
    spells: participant.spells,
    level: participant.level,
    kills: participant.kills,
    deaths: participant.deaths,
    assists: participant.assists,
    kda: participant.kda,
    killParticipation: participant.killParticipation,
    totalDamageDealtToChampions: participant.totalDamageDealtToChampions,
    totalDamageTaken: participant.totalDamageTaken,
    goldEarned: participant.goldEarned,
    cs: participant.cs,
    visionScore: participant.visionScore,
    win: participant.win,
    winResult: participant.winResult
  }
}

export function toLanWebMatch(
  summary: LcuOrSgpGameSummary,
  sgpServerId: string,
  subjectPuuid?: string,
  includeParticipants = true
): LanWebMatchDto {
  const basic = toBasicInfo(summary)
  const cardParticipants = toParticipants(summary, basic)
  const participants = cardParticipants.map(toLanWebParticipant)

  return {
    source: summary.source,
    sgpServerId,
    gameId: basic.gameId,
    gameCreation: basic.gameCreation,
    gameDuration: basic.gameDuration,
    queueId: basic.queueId,
    gameMode: basic.gameMode,
    mapId: basic.mapId,
    gameType: basic.gameType,
    endOfGameResult: basic.endOfGameResult ?? null,
    subject: participants.find((participant) => participant.puuid === subjectPuuid) ?? null,
    participants: includeParticipants ? participants : [],
    cardView: {
      basicInfo: basic,
      participants: cardParticipants,
      teams: toTeams(summary, basic, cardParticipants)
    }
  }
}

export function toLanWebRankedEntries(rankedStats?: RankedStats): LanWebRankedEntryDto[] {
  if (!rankedStats) return []

  const queueTypes = ['RANKED_SOLO_5x5', 'RANKED_FLEX_SR'] as const
  return queueTypes
    .map(
      (queueType) =>
        rankedStats.queueMap[queueType] ||
        rankedStats.queues.find((entry) => entry.queueType === queueType)
    )
    .filter((entry) => Boolean(entry))
    .map((entry) => ({
      queueType: entry!.queueType as LanWebRankedEntryDto['queueType'],
      tier: entry!.tier,
      division: entry!.division,
      leaguePoints: entry!.leaguePoints,
      wins: entry!.wins,
      losses: entry!.losses,
      highestTier: entry!.highestTier,
      highestDivision: entry!.highestDivision
    }))
}

export function toLanWebOngoingRecentMatch(
  summary: LcuOrSgpGameSummary,
  sgpServerId: string,
  puuid: string
): LanWebOngoingRecentMatchDto | null {
  const basic = toBasicInfo(summary)
  const participant = toParticipants(summary, basic).find((item) => item.puuid === puuid)
  if (!participant) return null

  return {
    source: summary.source,
    sgpServerId,
    gameId: basic.gameId,
    gameCreation: basic.gameCreation,
    gameDuration: basic.gameDuration,
    queueId: basic.queueId,
    gameMode: basic.gameMode,
    championId: participant.championId,
    kills: participant.kills,
    deaths: participant.deaths,
    assists: participant.assists,
    winResult: participant.winResult
  }
}
