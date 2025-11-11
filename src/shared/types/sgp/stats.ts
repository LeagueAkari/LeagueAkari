export interface SgpStatsEndOfGameGame {
  sendTimestamp: number
  endOfGameTimestamp: number
  puuid: string
  userId: number
  gameId: number
  reportGameId: number
  riotIdGameName: string
  riotIdTagLine: string
  roomName: string
  roomPassword: string
  mucJwtDto: MucJwtDto
  newSpells: any[]
  talentPointsGained: number
  coOpVsAiMinutesLeftToday: number
  ipEarned: number
  gameLength: number
  battleBoostIpEarned: number
  teamPlayerParticipantStats: TeamPlayerParticipantStat[]
  otherTeamPlayerParticipantStats: TeamPlayerParticipantStat[]
  gameType: string
  ranked: boolean
  invalid: boolean
  eloChange: number
  elo: number
  queueType: string
  queueId: number
  causedEarlySurrender: boolean
  teamEarlySurrendered: boolean
  gameEndedInEarlySurrender: boolean
  coOpVsAiMsecsUntilReset: number
  skinIndex: number
  gameMode: string
  gameMutators: string[]
  earlySurrenderAccomplice: boolean
}

interface TeamPlayerParticipantStat {
  level: number
  userId: number
  puuid: string
  teamId: number
  gameId: number
  leaver: boolean
  summonerName: string
  riotIdGameName: string
  riotIdTagLine: string
  skinName: string
  profileIconId: number
  wins: number
  leaves: number
  losses: number
  eloChange: number
  elo: number
  botPlayer: boolean
  spell1Id: number
  spell2Id: number
  championId: number
  skinIndex: number
  selectedPosition: string
  detectedTeamPosition: string
  statistics: Statistic[]
}

interface Statistic {
  value: number
  statTypeName: string
}

interface MucJwtDto {
  jwt: string
  channelClaim: string
  domain: string
  targetRegion: string
}
