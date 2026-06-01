import { useComponentName } from '@renderer-shared/composables/useComponentName'
import type { SgpApiStatus } from '@renderer-shared/composables/useSgpApiStatus'
import { useInstance } from '@renderer-shared/shards'
import { GameClientRenderer } from '@renderer-shared/shards/game-client'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
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

import { IS_SPECTATOR_FEATURE_ENABLED, UPDATE_SPECTATOR_DATA_INTERVAL } from '../constants'
import { type PlayerTabDataSourceDecision, toRequiredSgpLoadStatus } from './source-selection'

export type SpectatorContext = {
  spectatorData: Ref<SpectatorData | null>
  isLoading: Ref<boolean>

  /** API 是否被禁用（409 Conflict） */
  isApiDisabled: Ref<boolean>

  loadSpectatorData: () => Promise<void>
  launchSpectator: (byLcuApi: boolean) => Promise<void>
}

export const SpectatorContextKey: InjectionKey<SpectatorContext> = Symbol(
  'PlayerTabSpectatorContext'
)

// Avoid repeated disabled warnings and useless retries for known unsupported spectator servers.
const disabledSpectatorServers = new Set<string>()

/**
 * 加载观战信息
 *
 * 此特性仅支持 SGP 数据源，支持跨区查询
 *
 * Spectator API 已不再可用，因此该功能保留上下文与组件，但不再主动加载数据。
 */
export function provideSpectator(props: {
  puuid: MaybeRefOrGetter<string>
  sgpServerId: MaybeRefOrGetter<string>
  sgpApiStatus: MaybeRefOrGetter<SgpApiStatus>
}) {
  const puuid = toRef(props.puuid)
  const sgpServerId = toRef(props.sgpServerId)
  const sgpApiStatus = toRef(props.sgpApiStatus)

  const componentName = useComponentName()

  const sgp = useInstance(SgpRenderer)
  const lc = useInstance(LeagueClientRenderer)
  const gc = useInstance(GameClientRenderer)
  const log = useInstance(LoggerRenderer)

  const { t } = useTranslation()

  const isLoading = ref(false)
  const isApiDisabled = ref(false)
  const spectatorData = shallowRef<SpectatorData | null>(null)

  const notification = useNotification()

  const dataSourceStatus = computed<PlayerTabDataSourceDecision>(() =>
    toRequiredSgpLoadStatus(sgpApiStatus.value)
  )

  const logDataSourceStatus = (status: PlayerTabDataSourceDecision) => {
    if (status.type === 'unavailable') {
      log.warn(
        componentName,
        `Cannot load spectator data: SGP API is unavailable for ${sgpServerId.value}`
      )
    } else if (status.type === 'wait') {
      log.info(
        componentName,
        `Waiting for SGP API token readiness before loading spectator data from ${sgpServerId.value}`
      )
    }
  }

  const loadSpectatorData = async () => {
    if (!IS_SPECTATOR_FEATURE_ENABLED) {
      spectatorData.value = null
      isApiDisabled.value = true
      return
    }

    if (disabledSpectatorServers.has(sgpServerId.value)) {
      isApiDisabled.value = true
      return
    }

    const status = dataSourceStatus.value
    if (status.type !== 'load') {
      logDataSourceStatus(status)
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

        // 意外情况，直接不再进行请求
        if (status && status >= 400 && status < 500 && status !== 404) {
          const serverId = sgpServerId.value
          disabledSpectatorServers.add(serverId)
          isApiDisabled.value = true
          pause()
          log.warn(componentName, `Spectator API disabled for server: ${serverId}`)
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
    immediate: IS_SPECTATOR_FEATURE_ENABLED,
    immediateCallback: IS_SPECTATOR_FEATURE_ENABLED
  })

  const launchSpectator = async (byLcuApi: boolean) => {
    if (!IS_SPECTATOR_FEATURE_ENABLED) {
      return
    }

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
    [puuid, sgpServerId, dataSourceStatus],
    () => {
      if (!IS_SPECTATOR_FEATURE_ENABLED) {
        spectatorData.value = null
        isApiDisabled.value = true
        pause()
        return
      }

      // 重置状态
      spectatorData.value = null
      isApiDisabled.value = disabledSpectatorServers.has(sgpServerId.value)

      if (dataSourceStatus.value.type !== 'load') {
        logDataSourceStatus(dataSourceStatus.value)
        pause()
        return
      }

      loadSpectatorData()
    },
    { immediate: true }
  )

  watch(
    dataSourceStatus,
    (status) => {
      if (status.type === 'load' && !isApiDisabled.value) {
        resume()
      } else {
        logDataSourceStatus(status)
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
