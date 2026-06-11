import type { MatchPreviewPayload } from '@renderer-shared/components/match-preview'
import { type SgpApiStatus, useSgpApiStatus } from '@renderer-shared/composables/useSgpApiStatus'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import mitt, { Emitter } from 'mitt'
import {
  type InjectionKey,
  type MaybeRefOrGetter,
  type Ref,
  computed,
  inject,
  provide,
  toRef,
  toValue
} from 'vue'

import { PlayerTabsRenderer } from '@main-window/shards/player-tabs'

import { provideChallengesPlayerData } from './data/challenges'
import { provideChampionMastery } from './data/champion-mastery'
import { provideEncounteredGames } from './data/encountered-games'
import { provideMatchHistory } from './data/match-history'
import { provideMatchHistoryFilters } from './data/match-history-filters'
import { provideRankedStats } from './data/ranked-stats'
import { provideSpectator } from './data/spectator'
import { provideSummoner } from './data/summoner'
import { provideSummonerProfile } from './data/summoner-profile'
import { provideTags } from './data/tags'
import { provideInitParamsTool } from './init-params'

export type PlayerTabContext = {
  id: Ref<string>

  puuid: Ref<string>

  /** 整个页面会使用哪个数据源
   * 对于可以 sgp 的数据源，那么就会使用 sgp，否则使用 lcu
   * 对于跨区查询，一定使用 sgp
   */
  preferredSource: Ref<'lcu' | 'sgp'>

  /** 是否是自己 */
  isSelfTab: Ref<boolean>

  /** 是否是当前 tab */
  isCurrentTab: Ref<boolean>

  /** 是否 TENCENT 跨区查询 */
  isCrossRegion: Ref<boolean>

  /** 该玩家数据来源自哪个服务器 */
  sgpServerId: Ref<string>

  /** 该玩家数据来源的服务器是否可用 */
  sgpApiStatus: Ref<SgpApiStatus>

  /** 是否小尺寸 */
  isSmallSize: Ref<boolean>

  /** 松散事件 */
  events: Emitter<PlayerTabEvents>

  // events
  navigateToSummonerByPuuid: (puuid: string, setCurrent?: boolean) => void
  previewGame: (payload: MatchPreviewPayload) => void
}

export const PlayerTabContextKey: InjectionKey<PlayerTabContext> = Symbol('PlayerTabContext')

export type PlayerTabEvents = {
  /**
   * 一些预览战绩的组件需要和 MatchHistoryList 组件联动
   */
  focusGame: MatchPreviewPayload
}

export function usePlayerTab(): PlayerTabContext {
  const context = inject(PlayerTabContextKey)

  if (!context) {
    throw new Error('usePlayerTab must be used within a player tab component')
  }

  return context
}

export function providePlayerTab(props: {
  id: MaybeRefOrGetter<string>
  puuid: MaybeRefOrGetter<string>
  sgpServerId: MaybeRefOrGetter<string>
  isCurrentTab: MaybeRefOrGetter<boolean>
  isSmallSize: MaybeRefOrGetter<boolean>
  previewGame: (payload: MatchPreviewPayload) => void
}) {
  const sgps = useSgpStore()
  const lcs = useLeagueClientStore()
  const as = useAppCommonStore()

  const pt = useInstance(PlayerTabsRenderer)

  const events = mitt<PlayerTabEvents>()

  const { navigateToTabByPuuidAndSgpServerId } = pt.useNavigateToTab()

  const id = toRef(props.id)
  const puuid = toRef(props.puuid)
  const preferredSource = computed(() => as.settings.preferredLolSource)
  const sgpServerId = toRef(props.sgpServerId)
  const sgpApiStatus = useSgpApiStatus(sgpServerId)

  const isSelfTab = computed(() => {
    return puuid.value === lcs.summoner.me?.puuid
  })

  const isCrossRegion = computed(() => {
    return toValue(props.sgpServerId) !== sgps.availability.sgpServerId
  })

  // basics and top-level states and methods
  provide(PlayerTabContextKey, {
    id,
    puuid,
    preferredSource,
    sgpServerId,
    sgpApiStatus,

    isSmallSize: toRef(props.isSmallSize),
    isCurrentTab: toRef(props.isCurrentTab),
    isCrossRegion: toRef(isCrossRegion),
    isSelfTab: toRef(isSelfTab),

    events,

    navigateToSummonerByPuuid: (puuid, setCurrent = true) => {
      if (setCurrent) {
        navigateToTabByPuuidAndSgpServerId(puuid, sgpServerId.value)
      } else {
        pt.createTab(puuid, sgpServerId.value, { setCurrent: false })
      }
    },
    previewGame: props.previewGame
  })

  const initParamsTool = provideInitParamsTool({ id })

  // data
  provideSummoner({
    puuid,
    preferredSource,
    sgpServerId,
    sgpApiStatus,
    isCrossRegion
  })

  const { predicate, setActiveMode, setAdvancedFilterState } = provideMatchHistoryFilters({
    puuid,
    enablePositionFilter: computed(
      () => (preferredSource.value === 'sgp' || isCrossRegion.value) && sgpApiStatus.value.canUse
    )
  })

  provideMatchHistory(
    {
      puuid,
      preferredSource,
      sgpServerId,
      sgpApiStatus,
      isCrossRegion,
      predicate,
      syncCollectFilterState: (filterState) => {
        setActiveMode('advanced')
        setAdvancedFilterState(filterState)
      }
    },
    initParamsTool
  )

  provideRankedStats({
    puuid,
    isCrossRegion,
    isSelfTab
  })

  provideChampionMastery({
    puuid,
    isCrossRegion
  })

  provideEncounteredGames({
    puuid,
    preferredSource,
    sgpServerId,
    sgpApiStatus,
    isSelfTab,
    isCrossRegion
  })

  provideTags({
    puuid
  })

  provideSpectator({
    puuid,
    sgpServerId,
    sgpApiStatus
  })

  provideSummonerProfile({
    puuid,
    isCrossRegion
  })

  provideChallengesPlayerData({
    puuid,
    sgpServerId,
    sgpApiStatus
  })
}
