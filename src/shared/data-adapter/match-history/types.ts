import type { LcuOrSgpGameSummary } from '../wrapper'

export type MatchBasicInfo = {
  dataSource: LcuOrSgpGameSummary['source']
  gameVersion: string
  gameId: number
  isTwoTeam: boolean
  isCherrySubteam: boolean
  endOfGameResult: string
  gameCreation: number
  gameDuration: number
  gameType: string
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
  profileIconId: number
  championId: number
  position: string | null
  teamId: number
  playerSubteamId: number
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
  isSurrender: boolean
  winResult: WinResult
  subteamPlacement: number
  gameEndedInEarlySurrender: boolean
  gameEndedInSurrender: boolean
  teamEarlySurrendered: boolean
  totalDamageToTowers: number
  totalHeal: number
  visionScore: number
  soloKills: number | null
  effectiveHealAndShielding: number | null
  totalDamageShieldedOnTeammates: number | null
  pings: MatchParticipantPings | null
  doubleKills: number
  tripleKills: number
  quadraKills: number
  pentaKills: number
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

export type WinResult = 'win' | 'lose' | 'remake' | 'abort'

export type WinResultInfo = {
  isSurrender: boolean
  result: WinResult
}

export type MatchTeamStats = {
  teamIdentifier: string
  teamInfo: MatchTeamInfo | null // 如 CHERRY 模式，teamInfo 则没有必要
  winResult: WinResult
  isSurrender: boolean
  win: boolean
  subteamPlacement: number
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
  maxHeal: number
  totalHeal: number
  maxKda: number
  totalKda: number
  maxKillParticipation: number
  totalKillParticipation: number
  maxDamageShieldedOnTeammates: number | null // sgp only
  totalDamageShieldedOnTeammates: number | null // sgp only
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
  maxHeal: number
  totalHeal: number
  maxKda: number
  totalKda: number
  maxKillParticipation: number
  totalKillParticipation: number
  maxDamageShieldedOnTeammates: number | null // sgp only
  totalDamageShieldedOnTeammates: number | null // sgp only
}

export type TeamsAdapterResult = {
  teamStatMap: Record<string, MatchTeamStats>
  teamStatsArr: MatchTeamStats[]
  allTeamStats: AggregateTeamStats
}
