import type { LcuOrSgpGameDetails, LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import type { MatchHistoryQueryParams } from '@shared/http-api-axios-helper/sgp/match-history-query'
import type { DraftOptions, OngoingGameSimplifiedChampMastery } from '@shared/shards/ongoing-game'
import type { RankedStats } from '@shared/types/league-client/ranked'
import type { SummonerInfo } from '@shared/types/league-client/summoner'

import type { AkariIpcRenderer } from '../ipc'
import type { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import type { SettingUtilsRenderer } from '../setting-utils'
import type { SetupInAppScopeRenderer } from '../setup-in-app-scope'
import type { MatchHistoryPlayer } from './store'

export const ONGOING_GAME_RENDERER_NAMESPACE = 'ongoing-game-renderer'
export const MAIN_SHARD_NAMESPACE = 'ongoing-game-main'

export interface OngoingGameRendererContext {
  namespace: string
  mainShardNamespace: string
  ipc: AkariIpcRenderer
  piniaMobxUtils: PiniaMobxUtilsRenderer
  settingUtils: SettingUtilsRenderer
  setupInAppScope: SetupInAppScopeRenderer
}

export interface OngoingGameAllData {
  matchHistory: Record<string, MatchHistoryPlayer>
  summoner: Record<string, SummonerInfo>
  rankedStats: Record<string, RankedStats>
  championMastery: Record<string, Record<number, OngoingGameSimplifiedChampMastery>>
  gameDetails: Record<number, LcuOrSgpGameDetails>
  additionalGames: Record<number, any>
  savedInfo: any
}

export type OngoingGameMatchHistoryQueryTagParams = Pick<
  MatchHistoryQueryParams,
  'tag' | 'tagsQueryType'
>

export type {
  DraftOptions,
  LcuOrSgpGameDetails,
  LcuOrSgpGameSummary,
  MatchHistoryPlayer,
  OngoingGameSimplifiedChampMastery,
  RankedStats,
  SummonerInfo
}
