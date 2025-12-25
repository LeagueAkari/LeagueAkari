import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useInstance } from '@renderer-shared/shards'
import { GameClientRenderer } from '@renderer-shared/shards/game-client'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { SpectatorData } from '@shared/types/sgp/gsm'
import { useIntervalFn } from '@vueuse/core'
import { isAxiosError } from 'axios'
import { useTranslation } from 'i18next-vue'
import { useNotification } from 'naive-ui'
import {
  InjectionKey,
  MaybeRefOrGetter,
  Ref,
  computed,
  inject,
  markRaw,
  provide,
  ref,
  shallowRef,
  toRef,
  watch
} from 'vue'

import { UPDATE_SPECTATOR_DATA_INTERVAL } from './constants'

export type SpectatorContext = {
  spectatorData: Readonly<Ref<SpectatorData | null>>
  isLoading: Readonly<Ref<boolean>>

  /** API 是否被禁用（409 Conflict） */
  isApiDisabled: Readonly<Ref<boolean>>

  loadSpectatorData: () => Promise<void>
  launchSpectator: (byLcuApi: boolean) => Promise<void>
}

export const SpectatorContextKey: InjectionKey<SpectatorContext> = Symbol(
  'PlayerTabSpectatorContext'
)

/**
 * 加载观战信息
 *
 * 此特性仅支持 SGP 数据源，支持跨区查询
 *
 * 如果返回 409 Conflict，停止所有轮询，因为该 API 在某些服务器上被禁用
 */
export function provideSpectator(props: {
  puuid: MaybeRefOrGetter<string>
  sgpServerId: MaybeRefOrGetter<string>
}) {
  const puuid = toRef(props.puuid)
  const sgpServerId = toRef(props.sgpServerId)

  const componentName = useComponentName()

  const sgp = useInstance(SgpRenderer)
  const sgps = useSgpStore()
  const lc = useInstance(LeagueClientRenderer)
  const gc = useInstance(GameClientRenderer)
  const log = useInstance(LoggerRenderer)

  const { t } = useTranslation()

  const isLoading = ref(false)
  const isApiDisabled = ref(false)
  const spectatorData = shallowRef<SpectatorData | null>(null)

  const notification = useNotification()

  const sgpApiAvailable = computed(() => {
    return sgps.isTokenReady && (sgps.leagueServers.servers[sgpServerId.value]?.common ?? false)
  })

  const loadSpectatorData = async () => {
    // 需要可用
    if (!sgpApiAvailable.value) {
      return
    }

    // 如果 API 被禁用，不再请求
    if (isApiDisabled.value) {
      return
    }

    if (isLoading.value) {
      return
    }

    isLoading.value = true

    try {
      const { data } = await sgp.api.gsm.getSpectatorByPuuid(puuid.value, {
        __sgpServerId: sgpServerId.value
      })

      spectatorData.value = markRaw(data)
    } catch (error: any) {
      if (isAxiosError(error)) {
        const status = error.response?.status

        // 409 Conflict - API 在该服务器上被禁用
        if (status === 409) {
          isApiDisabled.value = true
          pause()
          log.warn(componentName, `Spectator API disabled for server: ${sgpServerId.value}`)
          return
        }

        // 404 或 400 - 玩家不在游戏中
        if (status === 404 || status === 400) {
          spectatorData.value = null
          return
        }
      }

      log.warn(componentName, 'Failed to load spectator data', error)
    } finally {
      isLoading.value = false
    }
  }

  const { pause, resume } = useIntervalFn(loadSpectatorData, UPDATE_SPECTATOR_DATA_INTERVAL, {
    immediate: true,
    immediateCallback: true
  })

  const launchSpectator = async (byLcuApi: boolean) => {
    if (!spectatorData.value) {
      return
    }

    try {
      if (byLcuApi) {
        await lc.api.spectator.launchSpectator(
          puuid.value,
          spectatorData.value.playerCredentials.spectatorKey
        )
        notification.success({
          title: () => t('PlayerTab.operationSuccessTitle'),
          content: () => t('PlayerTab.spectatorCalledUp'),
          duration: 4000
        })
      } else {
        await gc.launchSpectator({
          locale: 'zh_CN',
          gameId: spectatorData.value.game.id,
          gameMode: spectatorData.value.game.gameMode,
          observerEncryptionKey: spectatorData.value.playerCredentials.observerEncryptionKey,
          observerServerIp: spectatorData.value.playerCredentials.observerServerIp,
          observerServerPort: spectatorData.value.playerCredentials.observerServerPort,
          sgpServerId: sgpServerId.value
        })
        notification.success({
          title: () => t('PlayerTab.operationSuccessTitle'),
          content: () => t('PlayerTab.spectatorCalledUpByCmd'),
          duration: 4000
        })
      }
    } catch (error: any) {
      notification.warning({
        title: () => t('PlayerTab.operationFailedTitle'),
        content: () => t('PlayerTab.failedToCallUpSpectator', { reason: error.message }),
        duration: 4000
      })

      log.warn(componentName, `Failed to launch spectator: ${error.message}`, error)
    }
  }

  // 监听参数变化，重新加载
  watch(
    [puuid, sgpServerId],
    () => {
      // 重置状态
      spectatorData.value = null

      loadSpectatorData()
    },
    { immediate: true }
  )

  watch(
    sgpApiAvailable,
    (available) => {
      if (available && !isApiDisabled.value) {
        resume()
      } else {
        pause()
      }
    },
    { immediate: true }
  )

  // 监听 API 禁用状态
  watch(isApiDisabled, (disabled) => {
    if (disabled) {
      pause()
    }
  })

  provide(SpectatorContextKey, {
    spectatorData,
    isLoading,
    isApiDisabled,
    loadSpectatorData,
    launchSpectator
  })

  return { spectatorData, isLoading, isApiDisabled, loadSpectatorData, launchSpectator }
}

export function useSpectator() {
  const context = inject(SpectatorContextKey)

  if (!context) {
    throw new Error('useSpectator must be used within a player tab component')
  }

  return context
}
