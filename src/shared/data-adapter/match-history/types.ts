import type { LcuOrSgpGameSummary } from '../wrapper'

export type MatchBasicInfo = {
  dataSource: LcuOrSgpGameSummary['source']
  gameId: number
  isTwoTeam: boolean
  isCherrySubteam: boolean
  endOfGameResult: string
  gameCreation: number
  gameDuration: number
  queueId: number
  gameMode: string
  mapId: number
  gameModeMutators: string[]
}

export type MatchParticipantPerkSelection = {
  perk: number
  var1: number
  var2: number
  var3: number
}

export type MatchParticipantPerkStyle = {
  description: string | null
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
  championId: number
  position: string | null
  teamId: number
  teamIdentifier: string
  items: number[]
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
  subteamPlacement: number | null
  gameEndedInEarlySurrender: boolean
  gameEndedInSurrender: boolean
  teamEarlySurrendered: boolean
  totalDamageToTowers: number
  totalHeal: number
  soloKills: number | null
  effectiveHealAndShielding: number | null
  pings: MatchParticipantPings | null
}

export type MatchTeamBan = {
  championId: number
  pickTurn: number
}

export type MatchTeamObjectiveStats = {
  first: boolean | null
  kills: number | null
}

export type MatchTeamObjectives = {
  atakhan: MatchTeamObjectiveStats | null
  baron: MatchTeamObjectiveStats
  champion: MatchTeamObjectiveStats | null
  dragon: MatchTeamObjectiveStats
  horde: MatchTeamObjectiveStats
  inhibitor: MatchTeamObjectiveStats
  riftHerald: MatchTeamObjectiveStats
  tower: MatchTeamObjectiveStats
}

export type MatchTeamInfo = {
  bans: MatchTeamBan[]
  win: boolean | string
  teamId: number
  objectives: MatchTeamObjectives
}

export type TeamWinResult = {
  isSurrender: boolean
  result: 'win' | 'lose' | 'remake' | 'abort'
}

export type MatchTeamStats = {
  teamIdentifier: string
  teamInfo: MatchTeamInfo
  winResult: TeamWinResult['result']
  isSurrender: boolean
  win: boolean
  subteamPlacement: number | null
  maxDamageDealtToChampions: number
  totalDamageDealtToChampions: number
  maxDamageTaken: number
  totalDamageTaken: number
  maxGoldEarned: number
  totalGoldEarned: number
  maxKills: number
  totalKills: number
  totalDeaths: number
  totalAssists: number
  maxCs: number
  totalCs: number
  maxDamageToTowers: number
  totalDamageToTowers: number
  maxTotalHeal: number
  totalHeal: number
  maxKda: number
  totalKda: number
  maxKillParticipation: number
  totalKillParticipation: number
}

export type AggregateTeamStats = {
  teamIdentifier: string
  bans: MatchTeamBan[]
  maxDamageDealtToChampions: number
  totalDamageDealtToChampions: number
  maxDamageTaken: number
  totalDamageTaken: number
  maxGoldEarned: number
  totalGoldEarned: number
  maxKills: number
  totalKills: number
  totalDeaths: number
  totalAssists: number
  maxCs: number
  totalCs: number
  maxDamageToTowers: number
  totalDamageToTowers: number
  maxTotalHeal: number
  totalHeal: number
  maxKda: number
  totalKda: number
  maxKillParticipation: number
  totalKillParticipation: number
}

export type TeamsAdapterResult = {
  teamStatMap: Record<string, MatchTeamStats>
  teamStatsArr: MatchTeamStats[]
  allTeamStats: AggregateTeamStats
}
