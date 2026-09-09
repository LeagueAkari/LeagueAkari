import { computeSingleAkariScore } from '@shared/data-adapter/analysis/player'
import type { AkariScore } from '@shared/data-adapter/analysis/player'
import { computeSingleSummary } from '@shared/data-adapter/analysis/player/single/summary'
import type { Participant } from '@shared/types/league-client/match-history'
import type { SgpParticipantLol } from '@shared/types/sgp/match-history'
import { computed, toValue } from 'vue'

import { type MatchCardRawStat, useMatchCard } from '../../context'

export function toRawDetailsFromParticipants(
  basicInfo: ReturnType<typeof useMatchCard>['basicInfo']['value'],
  participants: ReturnType<typeof useMatchCard>['participants']['value']
): MatchCardRawStat[] {
  return participants.map((participant) => {
    const teamParticipants = participants.filter(
      (entry) => entry.teamIdentifier === participant.teamIdentifier
    )
    const summaryAnalysis = computeSingleSummary(
      basicInfo,
      participant,
      teamParticipants,
      participants
    )

    return {
      participantId: participant.participantId,
      championId: participant.championId,
      identity: {
        puuid: participant.puuid,
        gameName: participant.gameName,
        tagLine: participant.tagLine,
        teamIdentifier: participant.teamIdentifier
      },
      kills: participant.kills,
      deaths: participant.deaths,
      assists: participant.assists,
      doubleKills: participant.doubleKills,
      tripleKills: participant.tripleKills,
      quadraKills: participant.quadraKills,
      pentaKills: participant.pentaKills,
      damageGoldEfficiency: participant.damageGoldEfficiency,
      akariScore: computeSingleAkariScore(summaryAnalysis),
      totalDamageDealtToChampions: participant.totalDamageDealtToChampions,
      physicalDamageDealtToChampions: participant.physicalDamageDealtToChampions,
      magicDamageDealtToChampions: participant.magicDamageDealtToChampions,
      trueDamageDealtToChampions: participant.trueDamageDealtToChampions,
      totalDamageTaken: participant.totalDamageTaken,
      physicalDamageTaken: participant.physicalDamageTaken,
      magicDamageTaken: participant.magicDamageTaken,
      trueDamageTaken: participant.trueDamageTaken,
      totalDamageShieldedOnTeammates: participant.totalDamageShieldedOnTeammates,
      timeCCingOthers: participant.timeCCingOthers,
      knockEnemyIntoTeamAndKill: participant.knockEnemyIntoTeamAndKill,
      visionScore: participant.visionScore,
      damageDealtToTurrets: participant.totalDamageToTowers,
      goldEarned: participant.goldEarned,
      goldSpent: participant.goldSpent,
      totalMinionsKilled: participant.totalMinionsKilled,
      neutralMinionsKilled: participant.neutralMinionsKilled,
      maxCsAdvantageOnLaneOpponent: participant.maxCsAdvantageOnLaneOpponent,
      totalHeal: participant.totalHeal,
      effectiveHealAndShielding: participant.effectiveHealAndShielding,
      ...participant.pings,
      soloKills: participant.soloKills,
      killsNearEnemyTurret: participant.killsNearEnemyTurret,
      killsUnderOwnTurret: participant.killsUnderOwnTurret,
      earliestDragonTakedown: participant.earliestDragonTakedown,
      kda: participant.kda,
      killParticipation: participant.killParticipation,
      gameEndedInEarlySurrender: participant.gameEndedInEarlySurrender,
      gameEndedInSurrender: participant.gameEndedInSurrender,
      teamEarlySurrendered: participant.teamEarlySurrendered,
      champLevel: participant.level
    }
  })
}

export function useRawDetails() {
  const { summary, basicInfo, participants, rawStatsOverride } = useMatchCard()

  const akariScoresByPuuid = computed(() => {
    const scores: Record<string, AkariScore> = {}

    for (const participant of participants.value) {
      const teamParticipants = participants.value.filter(
        (p) => p.teamIdentifier === participant.teamIdentifier
      )
      const summaryAnalysis = computeSingleSummary(
        basicInfo.value,
        participant,
        teamParticipants,
        participants.value
      )

      scores[participant.puuid] = computeSingleAkariScore(summaryAnalysis)
    }

    return scores
  })

  const addUp = (
    participant: { data: SgpParticipantLol; source: 'sgp' } | { data: Participant; source: 'lcu' }
  ) => {
    if (participant.source === 'sgp') {
      return {
        damageGoldEfficiency:
          participant.data.totalDamageDealtToChampions / participant.data.goldEarned
      }
    }

    return {
      damageGoldEfficiency:
        participant.data.stats.totalDamageDealtToChampions / participant.data.stats.goldEarned
    }
  }

  return computed(() => {
    if (rawStatsOverride.value !== null) {
      return rawStatsOverride.value
    }

    const { source, data } = toValue(summary)

    if (source === 'sgp') {
      const isCherryMode = data.json.gameMode === 'CHERRY'

      return data.json.participants
        .toSorted((a, b) => {
          if (isCherryMode) {
            return a.subteamPlacement - b.subteamPlacement
          }

          return a.teamId - b.teamId
        })
        .map((p) => {
          const { challenges, missions, PlayerBehavior, ...rest } = p

          return {
            ...rest,
            ...PlayerBehavior,
            ...challenges,
            ...addUp({ data: p, source: 'sgp' }),
            akariScore: akariScoresByPuuid.value[p.puuid],
            championId: p.championId,
            identity: {
              puuid: p.puuid,
              gameName: p.riotIdGameName,
              tagLine: p.riotIdTagline,
              teamIdentifier: isCherryMode ? `CHERRY-${p.playerSubteamId}` : `TEAM-${p.teamId}`
            }
          }
        })
    }

    const isCherryMode = data.gameMode === 'CHERRY'

    return data.participants
      .map((p) => {
        const identity = data.participantIdentities.find((i) => i.participantId === p.participantId)
        if (!identity) return null

        return {
          ...p.stats,
          ...addUp({ data: p, source: 'lcu' }),
          akariScore: akariScoresByPuuid.value[identity.player.puuid],
          championId: p.championId,
          identity: {
            puuid: identity.player.puuid,
            gameName: identity.player.gameName,
            tagLine: identity.player.tagLine,
            teamIdentifier: isCherryMode ? `CHERRY-${p.teamId}` : `TEAM-${p.teamId}`
          }
        }
      })
      .filter((p) => p !== null)
  })
}
