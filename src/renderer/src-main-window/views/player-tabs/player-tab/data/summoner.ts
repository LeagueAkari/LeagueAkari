import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { RiotClientRenderer } from '@renderer-shared/shards/riot-client'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
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

export type SummonerContext = {
  summoner: Readonly<Ref<Summoner | null>>
  isLoading: Readonly<Ref<boolean>>
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
  isCrossRegion: MaybeRefOrGetter<boolean>
}) {
  const puuid = toRef(props.puuid)
  const preferredSource = toRef(props.preferredSource)
  const sgpServerId = toRef(props.sgpServerId)
  const isCrossRegion = toRef(props.isCrossRegion)

  const componentName = useComponentName()

  const sgp = useInstance(SgpRenderer)
  const sgps = useSgpStore()
  const lc = useInstance(LeagueClientRenderer)
  const rc = useInstance(RiotClientRenderer)
  const log = useInstance(LoggerRenderer)

  const lcs = useLeagueClientStore()

  const isLoading = ref(false)
  const summoner = shallowRef<Summoner | null>(null)

  const { t } = useTranslation()
  const notification = useNotification()

  const sgpApiAvailable = computed(() => {
    return sgps.isTokenReady && (sgps.sgpServerConfig.servers[sgpServerId.value]?.common ?? false)
  })

  const loadSummoner = async () => {
    if (isLoading.value) return

    isLoading.value = true

    try {
      // 仅在跨区时考虑 sgp 数据源
      if (isCrossRegion.value) {
        // 需要可用
        if (!sgpApiAvailable.value) {
          return
        }

        const { data: summoners } = await sgp.api.summonerLedge.postSummonersByPuuids(
          [puuid.value],
          {
            __sgpServerId: sgpServerId.value
          }
        )

        if (summoners.length === 0) {
          notification.error({
            title: () => t('PlayerTab.summonerNotFoundTitle', { puuid: puuid.value }),
            content: () => t('PlayerTab.summonerNotFoundContent')
          })
          return
        }

        const summoner0 = summoners[0]

        const { data: namesets } = await rc.api.playerAccount.getPlayerAccountNameset([puuid.value])

        if (namesets.namesets.length === 0) {
          notification.error({
            title: () => t('PlayerTab.summonerNotFoundTitle', { puuid: puuid.value }),
            content: () => t('PlayerTab.summonerNotFoundContent')
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
        content: () => t('PlayerTab.failedToLoadSummonerContent', { reason: error.message })
      })
      log.error(componentName, error)
    } finally {
      isLoading.value = false
    }
  }

  // 主要监听器：参数变化时加载
  watch(
    [sgpApiAvailable, preferredSource, puuid, sgpServerId, isCrossRegion],
    ([available]) => {
      // 如果需要 SGP 但 token 未就绪，等待 token 就绪后再加载
      if ((preferredSource.value === 'sgp' || isCrossRegion.value) && !available) {
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
      if (me && me.puuid === puuid.value) {
        summoner.value = toSummoner({ source: 'lcu', data: me, puuid: me.puuid })
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
