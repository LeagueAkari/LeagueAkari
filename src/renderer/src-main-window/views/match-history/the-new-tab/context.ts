import { Summoner } from '@shared/data-adapter/summoner'
import { LcuOrSgpGameDetails, LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { MatchHistoryQueryParams } from '@shared/http-api-axios-helper/sgp/match-history-query'
import { RankedStats } from '@shared/types/league-client/ranked'
import { ReplayMetadata } from '@shared/types/league-client/replays'
import { SpectatorData } from '@shared/types/sgp/gsm'
import { type InjectionKey, type MaybeRefOrGetter, type Ref, inject, provide, toRef } from 'vue'

export type MatchHistoryTabContext = {
  puuid: Readonly<Ref<string>>

  /** 整个页面会使用哪个数据源
   * 对于可以 sgp 的数据源，那么就会使用 sgp，否则使用 lcu
   * 对于跨区查询，一定使用 sgp
   */
  preferSource: Readonly<Ref<'lcu' | 'sgp'>>

  /** 是否 TENCENT 跨区查询 */
  isCrossRegion: Readonly<Ref<boolean>>

  /** 该玩家数据来源自哪个服务器 */
  sgpServerId: Readonly<Ref<string>>

  /** 隐藏敏感信息 */
  hidePrivacy: Readonly<Ref<boolean>>

  /** 观战数据，sgp only，在大部分直营服被 disable 了 */
  spectatorData: Readonly<Ref<SpectatorData | null>>

  /** 召唤师信息，lcu / sgp 数据源 - 使用抽象类型 */
  summoner: Readonly<Ref<Summoner | null>>

  /** 排位对局信息，lcu 数据源。无法使用 sgp api */
  rankedStats: Readonly<Ref<RankedStats | null>>

  /** 分页战绩信息 */
  pagedMatchHistory: Readonly<Ref<PagedMatchHistory | null>>

  /** 加载状态 */
  loadingState: Readonly<Ref<LoadingState>>

  // events
  onNavigateToSummonerByPuuid: (puuid: string, setCurrent?: boolean) => void
}

export interface PagedMatchHistory {
  /** 战绩概览，应该是 raw */
  games: LcuOrSgpGameSummary[]

  /** 战绩回放元数据 */
  replayMetadata: Record<number, ReplayMetadata>

  /** 战绩详情 */
  details: Record<number, LcuOrSgpGameDetails>

  /** 加载状态图 */
  detailsLoading: Record<number, boolean>

  /** 战绩查询参数 */
  queryParams: MatchHistoryQueryParams
}

export interface EncounteredGame {
  id: number
  gameId: number
  puuid: string
  selfPuuid: string
  region: string
  rsoPlatformId: string
  updateAt: Date
  queueType: string
}

export interface PagedEncounteredGames {
  data: EncounteredGame[]
  page: number
  pageSize: number
  total: number
}

export interface LoadingState {
  isLoadingSummoner: boolean
  isLoadingRankedStats: boolean
  isLoadingMatchHistory: boolean
  isLoadingSpectatorData: boolean
  isLoadingTags: boolean
  isLoadingSavedInfo: boolean
  isLoadingSummonerProfile: boolean
  isLoadingEncounteredGames: boolean
}

export const MatchHistoryTabContextKey: InjectionKey<MatchHistoryTabContext> =
  Symbol('MatchHistoryTabContext')

export function useMatchHistoryTab(): MatchHistoryTabContext {
  const context = inject(MatchHistoryTabContextKey)

  if (!context) {
    throw new Error('useMatchHistoryTab must be used within a match history tab component')
  }

  return context
}

export function provideMatchHistoryTab(props: {
  puuid: MaybeRefOrGetter<string>
  summoner: MaybeRefOrGetter<Summoner | null>
  rankedStats: MaybeRefOrGetter<RankedStats | null>
  preferSource: MaybeRefOrGetter<'lcu' | 'sgp'>
  sgpServerId: MaybeRefOrGetter<string>
  hidePrivacy: MaybeRefOrGetter<boolean>
  spectatorData: MaybeRefOrGetter<SpectatorData | null>
  pagedMatchHistory: MaybeRefOrGetter<PagedMatchHistory | null>
  isCrossRegion: MaybeRefOrGetter<boolean>
  loadingState: MaybeRefOrGetter<LoadingState>

  onNavigateToSummonerByPuuid: (puuid: string, setCurrent?: boolean) => void
}) {
  provide(MatchHistoryTabContextKey, {
    puuid: toRef(props.puuid),
    summoner: toRef(props.summoner),
    rankedStats: toRef(props.rankedStats),
    preferSource: toRef(props.preferSource),
    sgpServerId: toRef(props.sgpServerId),
    hidePrivacy: toRef(props.hidePrivacy),
    spectatorData: toRef(props.spectatorData),
    pagedMatchHistory: toRef(props.pagedMatchHistory),
    isCrossRegion: toRef(props.isCrossRegion),
    loadingState: toRef(props.loadingState),

    onNavigateToSummonerByPuuid: props.onNavigateToSummonerByPuuid
  })
}
