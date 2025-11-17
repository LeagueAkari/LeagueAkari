import { Participant } from '@shared/types/league-client/match-history'

import { LcuOrSgpGameSummary } from '../wrapper'
import { MatchBasicInfo, MatchParticipant, MatchParticipantPerks } from './types'

// 以 SGP 的格式为参照，将 LCU 数据映射为抽象格式
function mapLcuDataToPerks(participant: Participant): MatchParticipantPerks {
  return {
    statPerks: null, // lcu has no stat perks record
    styles: [
      {
        description: null,
        selections: [
          {
            perk: participant.stats.perk0,
            var1: participant.stats.perk0Var1,
            var2: participant.stats.perk0Var2,
            var3: participant.stats.perk0Var3
          },
          {
            perk: participant.stats.perk1,
            var1: participant.stats.perk1Var1,
            var2: participant.stats.perk1Var2,
            var3: participant.stats.perk1Var3
          },
          {
            perk: participant.stats.perk2,
            var1: participant.stats.perk2Var1,
            var2: participant.stats.perk2Var2,
            var3: participant.stats.perk2Var3
          },
          {
            perk: participant.stats.perk3,
            var1: participant.stats.perk3Var1,
            var2: participant.stats.perk3Var2,
            var3: participant.stats.perk3Var3
          }
        ],
        style: participant.stats.perkPrimaryStyle
      },
      {
        description: null,
        selections: [
          {
            perk: participant.stats.perk4,
            var1: participant.stats.perk4Var1,
            var2: participant.stats.perk4Var2,
            var3: participant.stats.perk4Var3
          },
          {
            perk: participant.stats.perk5,
            var1: participant.stats.perk5Var1,
            var2: participant.stats.perk5Var2,
            var3: participant.stats.perk5Var3
          }
        ],
        style: participant.stats.perkSubStyle
      }
    ]
  }
}

export function toParticipants(
  summary: LcuOrSgpGameSummary,
  basicInfo: MatchBasicInfo
): MatchParticipant[] {
  const { source, data } = summary

  if (source === 'sgp') {
    const totalKills = data.json.participants.reduce(
      (acc, p) => {
        const teamIdentifier = basicInfo.isCherrySubteam
          ? `CHERRY-${p.playerSubteamId}`
          : `TEAM-${p.teamId}`

        acc[teamIdentifier] = (acc[teamIdentifier] || 0) + p.kills
        return acc
      },
      {} as Record<string, number>
    )

    const participants = data.json.participants.map<MatchParticipant>((p) => {
      const teamIdentifier = basicInfo.isCherrySubteam
        ? `CHERRY-${p.playerSubteamId}`
        : `TEAM-${p.teamId}`

      return {
        puuid: p.puuid,
        participantId: p.participantId,
        gameName: p.riotIdGameName,
        tagLine: p.riotIdTagline,
        championId: p.championId,
        position: p.individualPosition,
        teamId: p.teamId,
        teamIdentifier,
        items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6],
        augments: [
          p.playerAugment1,
          p.playerAugment2,
          p.playerAugment3,
          p.playerAugment4,
          p.playerAugment5,
          p.playerAugment6
        ],
        spells: [p.spell1Id, p.spell2Id],
        perks: p.perks,
        level: p.champLevel,
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        kda: (p.kills + p.assists) / (p.deaths || 1),
        killParticipation: (p.kills + p.assists) / totalKills[teamIdentifier],
        totalDamageDealtToChampions: p.totalDamageDealtToChampions,
        physicalDamageDealtToChampions: p.physicalDamageDealtToChampions,
        magicDamageDealtToChampions: p.magicDamageDealtToChampions,
        trueDamageDealtToChampions: p.trueDamageDealtToChampions,
        totalDamageTaken: p.totalDamageTaken,
        physicalDamageTaken: p.physicalDamageTaken,
        magicDamageTaken: p.magicDamageTaken,
        trueDamageTaken: p.trueDamageTaken,
        goldEarned: p.goldEarned,
        goldSpent: p.goldSpent,
        neutralMinionsKilled: p.neutralMinionsKilled,
        totalMinionsKilled: p.totalMinionsKilled,
        cs: p.neutralMinionsKilled + p.totalMinionsKilled,
        win: p.win,
        subteamPlacement: p.subteamPlacement,
        gameEndedInEarlySurrender: p.gameEndedInEarlySurrender,
        gameEndedInSurrender: p.gameEndedInSurrender,
        teamEarlySurrendered: p.teamEarlySurrendered,
        totalDamageToTowers: p.damageDealtToTurrets,
        totalHeal: p.totalHeal,
        soloKills: p.challenges.soloKills ?? null,
        effectiveHealAndShielding: p.challenges.effectiveHealAndShielding ?? null,

        pings: {
          allInPings: p.allInPings,
          assistMePings: p.assistMePings,
          basicPings: p.basicPings,
          commandPings: p.commandPings,
          dangerPings: p.dangerPings,
          enemyMissingPings: p.enemyMissingPings,
          enemyVisionPings: p.enemyVisionPings,
          getBackPings: p.getBackPings,
          holdPings: p.holdPings,
          needVisionPings: p.needVisionPings,
          onMyWayPings: p.onMyWayPings,
          pushPings: p.pushPings,
          retreatPings: p.retreatPings,
          visionClearedPings: p.visionClearedPings
        }
      }
    })

    return participants
  }

  const totalKills = data.participants.reduce(
    (acc, p) => {
      const teamIdentifier = basicInfo.isCherrySubteam
        ? `CHERRY-${p.stats.playerSubteamId}`
        : `TEAM-${p.teamId}`
      acc[teamIdentifier] = (acc[teamIdentifier] || 0) + p.stats.kills
      return acc
    },
    {} as Record<string, number>
  )

  const participants = data.participants
    .map<MatchParticipant | null>((participant) => {
      const identity = data.participantIdentities.find(
        (i) => i.participantId === participant.participantId
      )
      if (!identity) return null

      const teamIdentifier = basicInfo.isCherrySubteam
        ? `CHERRY-${participant.stats.playerSubteamId}`
        : `TEAM-${participant.teamId}`

      return {
        puuid: identity.player.puuid,
        participantId: participant.participantId,
        gameName: identity.player.gameName,
        tagLine: identity.player.tagLine,
        championId: participant.championId,
        position: null, // lcu has no position record
        teamId: participant.teamId,
        teamIdentifier,
        items: [
          participant.stats.item0,
          participant.stats.item1,
          participant.stats.item2,
          participant.stats.item3,
          participant.stats.item4,
          participant.stats.item5,
          participant.stats.item6
        ],
        augments: [
          participant.stats.playerAugment1,
          participant.stats.playerAugment2,
          participant.stats.playerAugment3,
          participant.stats.playerAugment4,
          participant.stats.playerAugment5,
          participant.stats.playerAugment6
        ],
        spells: [participant.spell1Id, participant.spell2Id],
        perks: mapLcuDataToPerks(participant),
        level: participant.stats.champLevel,
        kills: participant.stats.kills,
        deaths: participant.stats.deaths,
        assists: participant.stats.assists,
        kda:
          (participant.stats.kills + participant.stats.assists) / (participant.stats.deaths || 1),
        killParticipation:
          (participant.stats.kills + participant.stats.assists) / totalKills[teamIdentifier],
        totalDamageDealtToChampions: participant.stats.totalDamageDealtToChampions,
        physicalDamageDealtToChampions: participant.stats.physicalDamageDealtToChampions,
        magicDamageDealtToChampions: participant.stats.magicDamageDealtToChampions,
        trueDamageDealtToChampions: participant.stats.trueDamageDealtToChampions,
        totalDamageTaken: participant.stats.totalDamageTaken,
        physicalDamageTaken: participant.stats.physicalDamageTaken,
        magicDamageTaken: participant.stats.magicalDamageTaken,
        trueDamageTaken: participant.stats.trueDamageTaken,
        goldEarned: participant.stats.goldEarned,
        goldSpent: participant.stats.goldSpent,
        neutralMinionsKilled: participant.stats.neutralMinionsKilled,
        totalMinionsKilled: participant.stats.totalMinionsKilled,
        cs: participant.stats.neutralMinionsKilled + participant.stats.totalMinionsKilled,
        win: participant.stats.win,
        subteamPlacement: participant.stats.subteamPlacement,
        gameEndedInEarlySurrender: participant.stats.gameEndedInEarlySurrender,
        gameEndedInSurrender: participant.stats.gameEndedInSurrender,
        teamEarlySurrendered: participant.stats.teamEarlySurrendered,
        totalDamageToTowers: participant.stats.damageDealtToTurrets,
        totalHeal: participant.stats.totalHeal,

        effectiveHealAndShielding: null, // lcu has no effective heal and shielding record
        soloKills: null, // lcu has no solo kills record
        pings: null // lcu has no pings record
      }
    })
    .filter(isNotNull)

  return participants
}

function isNotNull<T>(value: T | null): value is T {
  return value !== null
}
