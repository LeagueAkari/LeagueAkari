import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useClientInstallationStore } from '@renderer-shared/shards/client-installation/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NotificationReactive, useNotification } from 'naive-ui'
import { computed, ref, watch } from 'vue'

import { useMainWindowAppContext } from '@main-window/context'

import {
  LAST_DISMISS_LIVE_STREAMING_STREAMER_MODE_SETTING_KEY,
  NEVER_SHOW_LIVE_STREAMING_STREAMER_MODE_SETTING_KEY,
  SIMPLE_NOTIFICATIONS_RENDERER_ID,
  type SimpleNotificationsRendererContext
} from './context'
import WithActions from './parts/WithActions.vue'

export function setupStreamerModeNotifications(context: SimpleNotificationsRendererContext) {
  const notification = useNotification()
  const installation = useClientInstallationStore()
  const appCommonStore = useAppCommonStore()
  const { openSettingsModal } = useMainWindowAppContext()
  const leagueClientStore = useLeagueClientStore()
  const { t } = useTranslation(undefined, {
    keyPrefix: 'simple-notifications-renderer.liveStreamingHints'
  })

  let inst: NotificationReactive | null = null

  const close = () => {
    if (inst) {
      inst.destroy()
      inst = null
    }
  }

  const leagueClientStreamerModeEnabled = ref(false)

  const checkStreamerModeInSettings = async () => {
    const { data } = await context.leagueClient.httpClient.get(
      '/lol-settings/v2/account/GamePreferences/game-settings'
    )

    leagueClientStreamerModeEnabled.value = data?.data?.['HUD']?.['HidePlayerNames'] === true
  }

  context.leagueClient.onLcuEventVue(
    '/lol-settings/v2/account/GamePreferences/game-settings',
    ({ data }) => {
      leagueClientStreamerModeEnabled.value = data?.data?.['HUD']?.['HidePlayerNames'] === true
    }
  )

  watch(
    () => leagueClientStore.isConnected,
    (connected) => {
      if (connected) {
        checkStreamerModeInSettings()
      }
    },
    {
      immediate: true
    }
  )

  const shouldRemind = computed(() => {
    if (inst || appCommonStore.settings.streamerMode) {
      return false
    }

    if (installation.detectedLiveStreamingClients.length) {
      return 'live-tools'
    }

    if (leagueClientStreamerModeEnabled.value) {
      return 'client-settings'
    }

    return false
  })

  watch(
    () => shouldRemind.value,
    async (should) => {
      if (!should) {
        return
      }

      const neverShow = await context.settingUtils.get(
        SIMPLE_NOTIFICATIONS_RENDERER_ID,
        NEVER_SHOW_LIVE_STREAMING_STREAMER_MODE_SETTING_KEY,
        false
      )

      if (neverShow) {
        return
      }

      const lastDismissedAt = await context.settingUtils.get(
        SIMPLE_NOTIFICATIONS_RENDERER_ID,
        LAST_DISMISS_LIVE_STREAMING_STREAMER_MODE_SETTING_KEY,
        0
      )

      if (Date.now() - lastDismissedAt < 3 * 24 * 60 * 60 * 1000) {
        return
      }

      const dismiss = () => {
        context.settingUtils.set(
          SIMPLE_NOTIFICATIONS_RENDERER_ID,
          LAST_DISMISS_LIVE_STREAMING_STREAMER_MODE_SETTING_KEY,
          Date.now()
        )
      }

      const neverShowAgain = () => {
        context.settingUtils.set(
          SIMPLE_NOTIFICATIONS_RENDERER_ID,
          NEVER_SHOW_LIVE_STREAMING_STREAMER_MODE_SETTING_KEY,
          true
        )
      }

      inst = notification.info({
        title: () => t('detected.title'),
        content: () => (
          <WithActions
            buttons={[
              {
                label: () => t('dismiss'),
                secondary: true,
                onClick: () => {
                  close()
                  dismiss()
                }
              },
              {
                label: () => t('neverShowAgain'),
                type: 'warning',
                secondary: true,
                onClick: () => {
                  close()
                  neverShowAgain()
                }
              },
              {
                label: () => t('toSettings'),
                type: 'primary',
                onClick: () => {
                  close()
                  openSettingsModal('misc')
                  neverShowAgain()
                }
              }
            ]}
          >
            {should === 'live-tools' ? (
              <span>{t('detected.liveTools')}</span>
            ) : (
              <span>{t('detected.bySettings')}</span>
            )}
          </WithActions>
        ),
        onClose: dismiss
      })
    },
    {
      immediate: true
    }
  )
}
