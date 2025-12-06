import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
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

import { MatchHistoryTabsRenderer } from '@main-window/shards/match-history-tabs'

import { provideEncounteredGames } from './data/encountered-games'
import { provideMatchHistory } from './data/match-history'
import { provideRankedStats } from './data/ranked-stats'
import { provideSummoner } from './data/summoner'

export type PlayerTabContext = {
  puuid: Readonly<Ref<string>>

  /** 整个页面会使用哪个数据源
   * 对于可以 sgp 的数据源，那么就会使用 sgp，否则使用 lcu
   * 对于跨区查询，一定使用 sgp
   */
  preferredSource: Readonly<Ref<'lcu' | 'sgp'>>

  /** 是否是自己 */
  isSelfTab: Readonly<Ref<boolean>>

  /** 是否 TENCENT 跨区查询 */
  isCrossRegion: Readonly<Ref<boolean>>

  /** 该玩家数据来源自哪个服务器 */
  sgpServerId: Readonly<Ref<string>>

  /** 隐藏敏感信息 */
  hidePrivacy: Readonly<Ref<boolean>>

  /** 是否小尺寸 */
  isSmallSize: Readonly<Ref<boolean>>

  // events
  navigateToSummonerByPuuid: (puuid: string, setCurrent?: boolean) => void
  previewGame: (summary: LcuOrSgpGameSummary | number, puuid?: string) => void
}

export const PlayerTabContextKey: InjectionKey<PlayerTabContext> = Symbol('MatchHistoryTabContext')

export function usePlayerTab(): PlayerTabContext {
  const context = inject(PlayerTabContextKey)

  if (!context) {
    throw new Error('usePlayerTab must be used within a player tab component')
  }

  return context
}

export function providePlayerTab(props: {
  puuid: MaybeRefOrGetter<string>
  sgpServerId: MaybeRefOrGetter<string>
  isSmallSize: MaybeRefOrGetter<boolean>
  previewGame: (summary: LcuOrSgpGameSummary | number, puuid?: string) => void

  onCreateTab: (puuid: string, sgpServerId: string) => void
}) {
  const sgps = useSgpStore()
  const lcs = useLeagueClientStore()
  const as = useAppCommonStore()

  const mh = useInstance(MatchHistoryTabsRenderer)

  const { navigateToTabByPuuidAndSgpServerId } = mh.useNavigateToTab()

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
    puuid,
    preferredSource,
    sgpServerId,
    hidePrivacy: computed(() => as.settings.streamerMode),

    isSmallSize: toRef(props.isSmallSize),
    isCrossRegion: toRef(isCrossRegion),
    isSelfTab: toRef(isSelfTab),

    navigateToSummonerByPuuid: (puuid, setCurrent) => {
      if (setCurrent) {
        navigateToTabByPuuidAndSgpServerId(puuid, sgpServerId.value)
      } else {
        props.onCreateTab(puuid, sgpServerId.value)
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

  provideMatchHistory({
    puuid,
    preferredSource,
    sgpServerId,
    isCrossRegion
  })

  provideRankedStats({
    puuid,
    isCrossRegion
  })

  provideEncounteredGames({
    puuid,
    preferredSource,
    isSelfTab,
    isCrossRegion
  })
}
