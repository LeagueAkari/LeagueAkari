import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { RiotClientRenderer } from '@renderer-shared/shards/riot-client'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { Summoner, toSummoner } from '@shared/data-adapter/summoner'
import { useNotification } from 'naive-ui'
import {
  InjectionKey,
  MaybeRefOrGetter,
  Ref,
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

export const SummonerContextKey: InjectionKey<SummonerContext> = Symbol(
  'MatchHistoryTabSummonerContext'
)

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
  const lc = useInstance(LeagueClientRenderer)
  const rc = useInstance(RiotClientRenderer)
  const log = useInstance(LoggerRenderer)

  const isLoading = ref(false)
  const summoner = shallowRef<Summoner | null>(null)

  const notification = useNotification()

  const loadSummoner = async () => {
    if (isLoading.value) return

    isLoading.value = true

    try {
      if (preferredSource.value === 'sgp' || isCrossRegion.value) {
        const { data: summoners } = await sgp.api.summonerLedge.postSummonersByPuuids(
          [puuid.value],
          {
            __sgpServerId: sgpServerId.value
          }
        )

        if (summoners.length === 0) {
          notification.error({
            title: 'Summoner not found' + puuid.value,
            content: 'The summoner you are looking for is not found.'
          })
          return
        }

        const summoner0 = summoners[0]

        const { data: namesets } = await rc.api.playerAccount.getPlayerAccountNameset([puuid.value])

        if (namesets.namesets.length === 0) {
          notification.error({
            title: 'Summoner not found' + puuid.value,
            content: 'The summoner you are looking for is not found.'
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
    } catch (error) {
      notification.error({
        title: 'Failed to load summoner',
        content: 'Failed to load summoner'
      })
      log.error(componentName, error)
    } finally {
      isLoading.value = false
    }
  }

  watch(
    [preferredSource, puuid, sgpServerId, isCrossRegion],
    () => {
      loadSummoner()
    },
    { immediate: true }
  )

  provide(SummonerContextKey, {
    summoner,
    isLoading,
    loadSummoner
  })
}

export function useSummoner() {
  const context = inject(SummonerContextKey)

  if (!context) {
    throw new Error('useSummoner must be used within a MatchHistoryTab')
  }

  return context
}
