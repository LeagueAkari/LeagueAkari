import { computeSingleAkariScore } from '@shared/data-adapter/analysis/player'
import type { AkariScore } from '@shared/data-adapter/analysis/player'
import { computeSingleSummary } from '@shared/data-adapter/analysis/player/single/summary'
import type { Participant } from '@shared/types/league-client/match-history'
import type { SgpParticipantLol } from '@shared/types/sgp/match-history'
import { computed, toValue } from 'vue'

import { useMatchCard } from '../../context'

export function useRawDetails() {
  const { summary, basicInfo, participants } = useMatchCard()

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
