import { Participant } from '@shared/types/league-client/match-history'

import { noZero } from '../utils'
import { LcuOrSgpGameSummary } from '../wrapper'
import { MatchBasicInfo } from './match-basic'
import { WinResult, computeWinResult } from './win-result'

export type MatchParticipantPerkSelection = {
  perk: number
  var1: number
  var2: number
  var3: number
}

export type MatchParticipantPerkStyle = {
  description: string
  selections: MatchParticipantPerkSelection[]
  style: number
}

export type MatchParticipantStatPerks = {
  offense: number
  flex: number
  defense: number
}

export type MatchParticipantPerks = {
  statPerks: MatchParticipantStatPerks | null
  styles: MatchParticipantPerkStyle[]
}

export type MatchParticipantPings = {
  allInPings: number
  assistMePings: number
  basicPings: number
  commandPings: number
  dangerPings: number
  enemyMissingPings: number
  enemyVisionPings: number
  getBackPings: number
  holdPings: number
  needVisionPings: number
  onMyWayPings: number
  pushPings: number
  retreatPings: number
  visionClearedPings: number
}

export type MatchParticipant = {
  puuid: string
  participantId: number
  gameName: string
  tagLine: string
  profileIconId: number
  championId: number
  position: string | null
  teamId: number
  playerSubteamId: number
  teamIdentifier: string
  items: number[]
  roleBoundItem: number
  augments: number[]
  spells: number[]
  perks: MatchParticipantPerks
  level: number
  kills: number
  deaths: number
  assists: number
  kda: number
  killParticipation: number
  totalDamageDealtToChampions: number
  damageGoldEfficiency: number
  physicalDamageDealtToChampions: number
  magicDamageDealtToChampions: number
  trueDamageDealtToChampions: number
  totalDamageTaken: number
  physicalDamageTaken: number
  magicDamageTaken: number
  trueDamageTaken: number
  goldEarned: number
  goldSpent: number
  neutralMinionsKilled: number
  totalMinionsKilled: number
  cs: number
  win: boolean
  isSurrender: boolean
  winResult: WinResult
  subteamPlacement: number
  gameEndedInEarlySurrender: boolean
  gameEndedInSurrender: boolean
  teamEarlySurrendered: boolean
  totalDamageToTowers: number
  totalHeal: number
  visionScore: number
  timeCCingOthers: number
  soloKills: number | null
  effectiveHealAndShielding: number | null
  totalDamageShieldedOnTeammates: number | null
  pings: MatchParticipantPings | null
  knockEnemyIntoTeamAndKill: number | null
  killsNearEnemyTurret: number | null
  killsUnderOwnTurret: number | null
  earliestDragonTakedown: number | null
  maxCsAdvantageOnLaneOpponent: number | null
  doubleKills: number
  tripleKills: number
  quadraKills: number
  pentaKills: number
}

// 以 SGP 的格式为参照，将 LCU 数据映射为抽象格式
function mapLcuDataToPerks(participant: Participant): MatchParticipantPerks {
  return {
    statPerks: null, // lcu has no stat perks record
    styles: [
      {
        description: 'primaryStyle',
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
        description: 'subStyle',
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

      const { isSurrender, result } = computeWinResult(basicInfo.endOfGameResult, p)

      return {
        puuid: p.puuid,
        participantId: p.participantId,
        gameName: p.riotIdGameName || p.summonerName,
        tagLine: p.riotIdTagline,
        profileIconId: p.profileIcon,
        championId: p.championId,
        position: p.teamPosition,
        teamId: p.teamId,
        playerSubteamId: p.playerSubteamId,
        teamIdentifier,
        items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6],
        roleBoundItem: p.roleBoundItem,
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
        kda: (p.kills + p.assists) / noZero(p.deaths),
        killParticipation: (p.kills + p.assists) / noZero(totalKills[teamIdentifier]),
        totalDamageDealtToChampions: p.totalDamageDealtToChampions,
        damageGoldEfficiency: p.totalDamageDealtToChampions / noZero(p.goldEarned),
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
        isSurrender,
        winResult: result,
        subteamPlacement: p.subteamPlacement,
        gameEndedInEarlySurrender: p.gameEndedInEarlySurrender,
        gameEndedInSurrender: p.gameEndedInSurrender,
        teamEarlySurrendered: p.teamEarlySurrendered,
        totalDamageToTowers: p.damageDealtToTurrets,
        totalHeal: p.totalHeal,
        visionScore: p.visionScore ?? 0,
        timeCCingOthers: p.timeCCingOthers,
        soloKills: p.challenges?.soloKills ?? null,
        effectiveHealAndShielding: p.challenges?.effectiveHealAndShielding ?? null,
        totalDamageShieldedOnTeammates: p.totalDamageShieldedOnTeammates,
        knockEnemyIntoTeamAndKill: p.challenges?.knockEnemyIntoTeamAndKill ?? null,
        killsNearEnemyTurret: p.challenges?.killsNearEnemyTurret ?? null,
        killsUnderOwnTurret: p.challenges?.killsUnderOwnTurret ?? null,
        earliestDragonTakedown: p.challenges?.earliestDragonTakedown ?? null,
        maxCsAdvantageOnLaneOpponent: p.challenges?.maxCsAdvantageOnLaneOpponent ?? null,

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
        },

        doubleKills: p.doubleKills,
        tripleKills: p.tripleKills,
        quadraKills: p.quadraKills,
        pentaKills: p.pentaKills
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

      const { isSurrender, result } = computeWinResult(basicInfo.endOfGameResult, participant.stats)

      return {
        puuid: identity.player.puuid,
        participantId: participant.participantId,
        gameName: identity.player.gameName || identity.player.summonerName,
        tagLine: identity.player.tagLine,
        profileIconId: identity.player.profileIcon,
        championId: participant.championId,
        position: null,
        teamId: participant.teamId,
        playerSubteamId: participant.stats.playerSubteamId,
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
        roleBoundItem: participant.stats.roleBoundItem,
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
          (participant.stats.kills + participant.stats.assists) / noZero(participant.stats.deaths),
        killParticipation:
          (participant.stats.kills + participant.stats.assists) /
          noZero(totalKills[teamIdentifier]),
        totalDamageDealtToChampions: participant.stats.totalDamageDealtToChampions,
        damageGoldEfficiency:
          participant.stats.totalDamageDealtToChampions / noZero(participant.stats.goldEarned),
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
        isSurrender,
        winResult: result,
        subteamPlacement: participant.stats.subteamPlacement,
        gameEndedInEarlySurrender: participant.stats.gameEndedInEarlySurrender,
        gameEndedInSurrender: participant.stats.gameEndedInSurrender,
        teamEarlySurrendered: participant.stats.teamEarlySurrendered,
        totalDamageToTowers: participant.stats.damageDealtToTurrets,
        totalHeal: participant.stats.totalHeal,
        visionScore: participant.stats.visionScore ?? 0,
        timeCCingOthers: participant.stats.timeCCingOthers,

        effectiveHealAndShielding: null, // lcu has no effective heal and shielding record
        totalDamageShieldedOnTeammates: null, // lcu has no total damage shielded on teammates record
        soloKills: null, // lcu has no solo kills record
        pings: null, // lcu has no pings record
        knockEnemyIntoTeamAndKill: null, // lcu has no knock enemy into team and kill record
        killsNearEnemyTurret: null, // lcu has no kills near enemy turret record
        killsUnderOwnTurret: null, // lcu has no kills under own turret record
        earliestDragonTakedown: null, // lcu has no earliest dragon takedown record
        maxCsAdvantageOnLaneOpponent: null, // lcu has no max cs advantage on lane opponent record

        doubleKills: participant.stats.doubleKills,
        tripleKills: participant.stats.tripleKills,
        quadraKills: participant.stats.quadraKills,
        pentaKills: participant.stats.pentaKills
      }
    })
    .filter(isNotNull)

  return participants
}

function isNotNull<T>(value: T | null): value is T {
  return value !== null
}
