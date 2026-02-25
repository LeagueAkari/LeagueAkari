import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
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
import { provideEncounteredGames } from './data/encountered-games'
import { provideMatchHistory } from './data/match-history'
import { provideMatchHistoryFilters } from './data/match-history-filters'
import { provideRankedStats } from './data/ranked-stats'
import { provideSpectator } from './data/spectator'
import { provideSummoner } from './data/summoner'
import { provideSummonerProfile } from './data/summoner-profile'
import { provideTags } from './data/tags'

export type PlayerTabContext = {
  id: Readonly<Ref<string>>

  puuid: Readonly<Ref<string>>

  /** 整个页面会使用哪个数据源
   * 对于可以 sgp 的数据源，那么就会使用 sgp，否则使用 lcu
   * 对于跨区查询，一定使用 sgp
   */
  preferredSource: Readonly<Ref<'lcu' | 'sgp'>>

  /** 是否是自己 */
  isSelfTab: Readonly<Ref<boolean>>

  /** 是否是当前 tab */
  isCurrentTab: Readonly<Ref<boolean>>

  /** 是否 TENCENT 跨区查询 */
  isCrossRegion: Readonly<Ref<boolean>>

  /** 该玩家数据来源自哪个服务器 */
  sgpServerId: Readonly<Ref<string>>

  /** 是否小尺寸 */
  isSmallSize: Readonly<Ref<boolean>>

  /** 松散事件 */
  events: Emitter<PlayerTabEvents>

  // events
  navigateToSummonerByPuuid: (puuid: string, setCurrent?: boolean) => void
  previewGame: (summary: LcuOrSgpGameSummary | number, puuid?: string) => void
}

export const PlayerTabContextKey: InjectionKey<PlayerTabContext> = Symbol('PlayerTabContext')

export type PlayerTabEvents = {
  /**
   * 一些预览战绩的组件需要和 MatchHistoryList 组件联动
   */
  focusGame: { summary: LcuOrSgpGameSummary | number; puuid?: string }
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
  previewGame: (summary: LcuOrSgpGameSummary | number, puuid?: string) => void
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

  const isSelfTab = computed(() => {
    return puuid.value === lcs.summoner.me?.puuid
  })

  const isCrossRegion = computed(() => {
    return toValue(props.sgpServerId) !== sgps.availability.sgpServerId
  })

  provide(PlayerTabContextKey, {
    id,
    puuid,
    preferredSource,
    sgpServerId,

    isSmallSize: toRef(props.isSmallSize),
    isCurrentTab: toRef(props.isCurrentTab),
    isCrossRegion: toRef(isCrossRegion),
    isSelfTab: toRef(isSelfTab),

    events,

    navigateToSummonerByPuuid: (puuid, setCurrent = true) => {
      if (setCurrent) {
        navigateToTabByPuuidAndSgpServerId(puuid, sgpServerId.value)
      } else {
        pt.createTab(puuid, sgpServerId.value, false)
      }
    },
    previewGame: props.previewGame
  })

  provideSummoner({
    puuid,
    preferredSource,
    sgpServerId,
    isCrossRegion
  })

  const matchHistoryFilters = provideMatchHistoryFilters()

  provideMatchHistory({
    puuid,
    preferredSource,
    sgpServerId,
    isCrossRegion,
    winLoss: () => matchHistoryFilters.filters.value.winLoss,
    selectedChampions: () => matchHistoryFilters.filters.value.selectedChampions,
    selectedSummoners: () => matchHistoryFilters.filters.value.selectedSummoners,
    showPractice: () => matchHistoryFilters.filters.value.showPractice,
    showIrregularGames: () => matchHistoryFilters.filters.value.showIrregularGames
  })

  provideRankedStats({
    puuid,
    isCrossRegion,
    isSelfTab
  })

  provideEncounteredGames({
    puuid,
    preferredSource,
    isSelfTab,
    isCrossRegion
  })

  provideTags({
    puuid
  })

  provideSpectator({
    puuid,
    sgpServerId
  })

  provideSummonerProfile({
    puuid,
    isCrossRegion
  })

  provideChallengesPlayerData({
    puuid,
    sgpServerId
  })
}
