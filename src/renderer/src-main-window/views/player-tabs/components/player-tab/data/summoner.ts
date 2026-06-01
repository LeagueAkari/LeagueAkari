import { useComponentName } from '@renderer-shared/composables/useComponentName'
import type { SgpApiStatus } from '@renderer-shared/composables/useSgpApiStatus'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { RiotClientRenderer } from '@renderer-shared/shards/riot-client'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { Summoner, toSummoner } from '@shared/data-adapter/summoner'
import { useTranslation } from 'i18next-vue'
import { useNotification } from 'naive-ui'
import {
  InjectionKey,
  MaybeRefOrGetter,
  Ref,
  computed,
  inject,
  provide,
  ref,
  shallowRef,
  toRef,
  watch
} from 'vue'

import { PlayerTabsRenderer } from '@main-window/shards/player-tabs'

import { type PlayerTabDataSourceDecision, toLoadStatus } from './source-selection'

export type SummonerContext = {
  summoner: Ref<Summoner | null>
  isLoading: Ref<boolean>
  loadSummoner: () => Promise<void>
}

export const SummonerContextKey: InjectionKey<SummonerContext> = Symbol('PlayerTabSummonerContext')

/**
 * 加载 summoner 信息
 *
 * 可使用 sgp 数据源，或在跨区时强制使用 sgp 数据源
 */
export function provideSummoner(props: {
  puuid: MaybeRefOrGetter<string>
  preferredSource: MaybeRefOrGetter<'lcu' | 'sgp'>
  sgpServerId: MaybeRefOrGetter<string>
  sgpApiStatus: MaybeRefOrGetter<SgpApiStatus>
  isCrossRegion: MaybeRefOrGetter<boolean>
}) {
  const puuid = toRef(props.puuid)
  const preferredSource = toRef(props.preferredSource)
  const sgpServerId = toRef(props.sgpServerId)
  const sgpApiStatus = toRef(props.sgpApiStatus)
  const isCrossRegion = toRef(props.isCrossRegion)

  const componentName = useComponentName()

  const sgp = useInstance(SgpRenderer)
  const lc = useInstance(LeagueClientRenderer)
  const rc = useInstance(RiotClientRenderer)
  const log = useInstance(LoggerRenderer)
  const pt = useInstance(PlayerTabsRenderer)
  const lcs = useLeagueClientStore()

  const isLoading = ref(false)
  const summoner = shallowRef<Summoner | null>(null)

  const { t } = useTranslation()
  const notification = useNotification()

  const dataSourceDecision = computed<PlayerTabDataSourceDecision>(() =>
    toLoadStatus({
      preferredSource: preferredSource.value,
      isCrossRegion: isCrossRegion.value,
      sgpApiStatus: sgpApiStatus.value
    })
  )

  const logDataSourceDecision = (decision: PlayerTabDataSourceDecision) => {
    if (decision.type === 'unavailable') {
      log.warn(
        componentName,
        `Cannot load summoner data: SGP API is unavailable for ${sgpServerId.value}`
      )
    } else if (decision.type === 'wait') {
      log.info(
        componentName,
        `Waiting for SGP API token readiness before loading summoner data from ${sgpServerId.value}`
      )
    } else if (decision.fallbackReason === 'sgp-api-unavailable') {
      log.warn(
        componentName,
        `Falling back to LCU summoner data: SGP API is unavailable for ${sgpServerId.value}`
      )
    }
  }

  const loadSummoner = async () => {
    if (isLoading.value) return

    const decision = dataSourceDecision.value
    logDataSourceDecision(decision)

    if (decision.type !== 'load') {
      return
    }

    isLoading.value = true

    try {
      if (decision.source === 'sgp') {
        const { data: summoners } = await sgp.api.summonerLedge.postSummonersByPuuids(
          [puuid.value],
          {
            __sgpServerId: sgpServerId.value
          }
        )

        if (summoners.length === 0) {
          notification.error({
            title: () => t('PlayerTab.summonerNotFoundTitle', { puuid: puuid.value }),
            content: () => t('PlayerTab.summonerNotFoundContent'),
            duration: 4000
          })
          return
        }

        const summoner0 = summoners[0]

        const { data: namesets } = await rc.api.playerAccount.getPlayerAccountNameset([puuid.value])

        if (namesets.namesets.length === 0) {
          notification.error({
            title: () => t('PlayerTab.summonerNotFoundTitle', { puuid: puuid.value }),
            content: () => t('PlayerTab.summonerNotFoundContent'),
            duration: 4000
          })
          return
        }

        const nameset = namesets.namesets[0]

        summoner.value = toSummoner(
          { source: 'sgp', data: summoner0, puuid: summoner0.puuid },
          {
            gameName: nameset.gnt.gameName,
            tagLine: nameset.gnt.tagLine
          }
        )
      } else {
        const { data } = await lc.api.summoner.getSummonerByPuuid(puuid.value)
        summoner.value = toSummoner({ source: 'lcu', data, puuid: data.puuid })
      }
    } catch (error: any) {
      notification.error({
        title: () => t('PlayerTab.failedToLoadSummonerTitle'),
        content: () => t('PlayerTab.failedToLoadSummonerContent', { reason: error.message }),
        duration: 4000
      })
      log.error(componentName, error)
    } finally {
      isLoading.value = false
    }
  }

  // 主要监听器：参数变化时加载
  watch(
    [dataSourceDecision, puuid, sgpServerId],
    () => {
      const decision = dataSourceDecision.value

      if (decision.type !== 'load') {
        logDataSourceDecision(decision)
        return
      }

      loadSummoner()
    },
    { immediate: true }
  )

  // 当自己的召唤师信息更新的时候，立即更新相关页面
  watch(
    () => lcs.summoner.me,
    (me) => {
      const decision = dataSourceDecision.value

      if (me && me.puuid === puuid.value && decision.type === 'load' && decision.source === 'lcu') {
        summoner.value = toSummoner({ source: 'lcu', data: me, puuid: me.puuid })
      }
    }
  )

  watch(
    () => summoner.value,
    (summoner) => {
      if (summoner && summoner.puuid !== lcs.summoner.me?.puuid) {
        pt.saveSearchHistory({
          puuid: summoner.puuid,
          sgpServerId: sgpServerId.value,
          summoner: {
            profileIconId: summoner.profileIconId,
            gameName: summoner.gameName,
            tagLine: summoner.tagLine
          }
        })
      }
    }
  )

  provide(SummonerContextKey, {
    summoner,
    isLoading,
    loadSummoner
  })

  return { summoner, isLoading, loadSummoner }
}

export function useSummoner() {
  const context = inject(SummonerContextKey)

  if (!context) {
    throw new Error('useSummoner must be used within a PlayerTab')
  }

  return context
}
