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
}

export type MatchCardEmits = {
  loadDetails: [gameId: number]
  downloadReplay: [gameId: number]
  watchReplay: [gameId: number]
  navigateToSummonerByPuuid: [puuid: string, setCurrent?: boolean]
  dryRunOngoingGame: [draft: DraftOptions]
}

export type MatchCardExpose = {
  setExpanded: (expanded: boolean) => void
}
