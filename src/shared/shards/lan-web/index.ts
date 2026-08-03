export const LAN_WEB_MAIN_NAMESPACE = 'lan-web-main'
export const LAN_WEB_RENDERER_NAMESPACE = 'lan-web-renderer'
export const LAN_WEB_DEFAULT_PORT = 41414

export type LanWebServiceStatus = 'stopped' | 'starting' | 'running' | 'error'
export type LanWebDataSource = 'lcu' | 'sgp'

export interface LanWebSettingsData {
  enabled: boolean
  port: number
}

export interface LanWebRuntimeState {
  status: LanWebServiceStatus
  listeningPort: number | null
  accessUrls: string[]
  errorMessage: string | null
}

export interface LanWebStatusDto {
  service: 'league-akari-lan-web'
  leagueClientConnected: boolean
  leagueClientConnectionState: 'connecting' | 'connected' | 'disconnected'
  currentSgpServerId: string | null
  currentPlayer: LanWebPlayerDto | null
  sgpMatchHistoryAvailable: boolean
  updatedAt: number
}

export interface LanWebPlayerDto {
  puuid: string
  gameName: string
  tagLine: string
  profileIconId: number
  summonerLevel: number
  privacy: string
  sgpServerId: string
}

export interface LanWebPlayerSearchDto {
  query: string
  results: LanWebPlayerDto[]
}

export interface LanWebAnalysisDto {
  gameCount: number
  detailsCount: number
  wins: number
  losses: number
  winRate: number
  kills: number
  deaths: number
  assists: number
  averageKda: number
  averageKillParticipation: number
  averageDamagePercentageOfTeam: number
  averageDamageTakenPercentageOfTeam: number
  averageGoldPercentageOfTeam: number
  averageDamageToChampionsPerMinute: number
  averageCsPerMinute: number
  averageVisionScore: number
  activeSessionWins: number
  activeSessionLosses: number
  winningStreak: number
  losingStreak: number
  blueSideCount: number
  redSideCount: number
  champions: Array<{
    championId: number
    gameCount: number
    wins: number
    losses: number
    winRate: number
  }>
  akariScore: number
  akariScoreMax: number
}

export interface LanWebRankedEntryDto {
  queueType: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR'
  tier: string
  division: string
  leaguePoints: number
  wins: number
  losses: number
  highestTier: string
  highestDivision: string
}

export interface LanWebOngoingPlayerDto {
  puuid: string
  sgpServerId: string
  gameName: string
  tagLine: string
  profileIconId: number
  summonerLevel: number
  championId: number | null
  position: string | null
  teamId: string
  premadeTeamId: number | null
  isSelf: boolean
  ranked: LanWebRankedEntryDto[]
  tags: string[]
  recentMatches: LanWebOngoingRecentMatchDto[]
  loadingState: string | null
  analysis: LanWebAnalysisDto | null
}

export interface LanWebOngoingRecentMatchDto {
  source: LanWebDataSource
  sgpServerId: string
  gameId: number
  gameCreation: number
  gameDuration: number
  queueId: number
  gameMode: string
  championId: number
  kills: number
  deaths: number
  assists: number
  winResult: string
}

export interface LanWebOngoingTeamDto {
  id: string
  players: LanWebOngoingPlayerDto[]
}

export interface LanWebOngoingGameDto {
  leagueClientConnected: boolean
  phase: string
  gameInfo: {
    gameId?: number
    queueId: number
    queueType: string
    gameMode?: string
  } | null
  teams: LanWebOngoingTeamDto[]
  updatedAt: number
}

export interface LanWebMatchParticipantDto {
  puuid: string
  gameName: string
  tagLine: string
  profileIconId: number
  participantId: number
  championId: number
  position: string | null
  teamId: number
  teamIdentifier: string
  items: number[]
  spells: number[]
  level: number
  kills: number
  deaths: number
  assists: number
  kda: number
  killParticipation: number
  totalDamageDealtToChampions: number
  totalDamageTaken: number
  goldEarned: number
  cs: number
  visionScore: number
  win: boolean
  winResult: string
}

export interface LanWebMatchDto {
  source: LanWebDataSource
  sgpServerId: string
  gameId: number
  gameCreation: number
  gameDuration: number
  queueId: number
  gameMode: string
  mapId: number
  gameType: string
  endOfGameResult: string | null
  subject: LanWebMatchParticipantDto | null
  participants: LanWebMatchParticipantDto[]
}

export interface LanWebMatchHistoryDto {
  player: LanWebPlayerDto
  source: LanWebDataSource
  analysis: LanWebAnalysisDto | null
  ranked: LanWebRankedEntryDto[] | null
  startIndex: number
  count: number
  hasMore: boolean
  games: LanWebMatchDto[]
}

export interface LanWebApiErrorDto {
  error: {
    code: string
    message: string
  }
}
