import type { AkariScore } from '@shared/data-adapter/analysis/player'
import type { LcuOrSgpGameDetails, LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import type { DraftOptions } from '@shared/shards/ongoing-game'
import type { ReplayDownloadProgress } from '@shared/types/league-client/replays'

export type MatchCardProps = {
  summary: LcuOrSgpGameSummary
  details?: LcuOrSgpGameDetails | null
  puuid?: string
  hidePrivacy?: boolean
  loadingDetails?: boolean
  replayState?: ReplayDownloadProgress | null
  canDryRunOngoingGame?: boolean
  multiGameScores?: Record<string, AkariScore> | null
  loadingMultiGameScores?: boolean
  isMultiGameScoreEnabled?: boolean
  showMultiGameScoreSwitch?: boolean
}

export type MatchCardEmits = {
  loadDetails: [gameId: number]
  downloadReplay: [gameId: number]
  watchReplay: [gameId: number]
  navigateToSummonerByPuuid: [puuid: string, setCurrent?: boolean]
  dryRunOngoingGame: [draft: DraftOptions]
  'update:isMultiGameScoreEnabled': [enabled: boolean]
}

export type MatchCardExpose = {
  setExpanded: (expanded: boolean) => void
}
