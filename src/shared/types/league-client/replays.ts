export interface ReplayMetadata extends ReplayDownloadProgress {}

// Event: /lol-replays/v1/metadata/{gameId}
export interface ReplayDownloadProgress {
  // checking 和 found 时, 这个数字不知道用途, 总之是一个很大的数字
  downloadProgress: number
  gameId: number
  state: 'checking' | 'found' | 'download' | 'downloading' | 'watch' | 'incompatible'
}

export interface ReplayConfiguration {
  gameVersion: string
  isInTournament: boolean
  isLoggedIn: boolean
  isPatching: boolean
  isPlayingGame: boolean
  isPlayingReplay: boolean
  isReplaysEnabled: boolean
  isReplaysForEndOfGameEnabled: boolean
  isReplaysForMatchHistoryEnabled: boolean
  minServerVersion: string
  minutesUntilReplayConsideredLost: number
}
