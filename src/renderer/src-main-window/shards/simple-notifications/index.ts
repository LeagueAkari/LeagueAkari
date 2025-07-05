import { useInstance } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useBackgroundTasksStore } from '@renderer-shared/shards/background-tasks/store'
import { ClientInstallationRenderer } from '@renderer-shared/shards/client-installation'
import { useClientInstallationStore } from '@renderer-shared/shards/client-installation/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useRemoteConfigStore } from '@renderer-shared/shards/remote-config/store'
import { SelfUpdateRenderer } from '@renderer-shared/shards/self-update'
import { useSelfUpdateStore } from '@renderer-shared/shards/self-update/store'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { SetupInAppScopeRenderer } from '@renderer-shared/shards/setup-in-app-scope'
import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { formatSeconds } from '@shared/utils/format'
import { useTranslation } from 'i18next-vue'
import { NotificationReactive, useNotification } from 'naive-ui'
import { computed, defineComponent, h, inject, ref, watch, watchEffect } from 'vue'

import AnnouncementModal from './modals/AnnouncementModal.vue'
import DeclarationModal from './modals/DeclarationModal.vue'
import UpdateModal from './modals/UpdateModal.vue'
import WithActions from './parts/WithActions.vue'
import { useSimpleNotificationsStore } from './store'

/**
 * 一些全局性的周期性通知
 *
 * 足够 simple (存疑)
 */
@Shard(SimpleNotificationsRenderer.id)
export class SimpleNotificationsRenderer implements IAkariShardInitDispose {
  static id = 'simple-notifications-renderer'

  static NEVER_SHOW_SETTING_KEY = 'neverShowLiveStreamingStreamerMode'
  static LAST_DISMISS_SETTING_KEY = 'lastDismissLiveStreamingStreamerMode'

  constructor(
    @Dep(ClientInstallationRenderer) private readonly _inst: ClientInstallationRenderer,
    @Dep(AppCommonRenderer) private readonly _app: AppCommonRenderer,
    @Dep(SettingUtilsRenderer) private readonly _setting: SettingUtilsRenderer,
    @Dep(LeagueClientRenderer) private readonly _client: LeagueClientRenderer,
    @Dep(SetupInAppScopeRenderer) private readonly _setup: SetupInAppScopeRenderer
  ) {}

  /**
   * 猜你正在直播
   */
  _setupStreamerModeNotifications() {
    const notification = useNotification()
    const installation = useClientInstallationStore()
    const app = useAppCommonStore()
    const appInject = inject('app') as any
    const lcs = useLeagueClientStore()
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
      const { data } = await this._client._http.get(
        '/lol-settings/v2/account/GamePreferences/game-settings'
      )

      if (data?.data?.['HUD']?.['HidePlayerNames'] === true) {
        leagueClientStreamerModeEnabled.value = true
      } else {
        leagueClientStreamerModeEnabled.value = false
      }
    }

    this._client.onLcuEventVue(
      '/lol-settings/v2/account/GamePreferences/game-settings',
      ({ data }) => {
        if (data?.data?.['HUD']?.['HidePlayerNames'] === true) {
          leagueClientStreamerModeEnabled.value = true
        } else {
          leagueClientStreamerModeEnabled.value = false
        }
      }
    )

    watch(
      () => lcs.isConnected,
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
      if (inst || app.settings.streamerMode) {
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

        const v = await this._setting.get(
          SimpleNotificationsRenderer.id,
          SimpleNotificationsRenderer.NEVER_SHOW_SETTING_KEY,
          false
        )

        if (v) {
          return
        }

        const l = await this._setting.get(
          SimpleNotificationsRenderer.id,
          SimpleNotificationsRenderer.LAST_DISMISS_SETTING_KEY,
          0
        )

        if (Date.now() - l < 3 * 24 * 60 * 60 * 1000) {
          return
        }

        const dismiss = () => {
          this._setting.set(
            SimpleNotificationsRenderer.id,
            SimpleNotificationsRenderer.LAST_DISMISS_SETTING_KEY,
            Date.now()
          )
        }

        const neverShowAgain = () => {
          this._setting.set(
            SimpleNotificationsRenderer.id,
            SimpleNotificationsRenderer.NEVER_SHOW_SETTING_KEY,
            true
          )
        }

        inst = notification.info({
          title: () => t('detected.title'),
          content: () =>
            h(
              WithActions,
              {
                buttons: [
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
                      appInject.openSettingsModal('misc')
                      neverShowAgain()
                    }
                  }
                ]
              },
              () =>
                should === 'live-tools'
                  ? h('span', t('detected.liveTools'))
                  : h('span', t('detected.bySettings'))
            ),
          onClose: dismiss
        })
      },
      {
        immediate: true
      }
    )
  }

  private _handleQueueingProgress() {
    const lcs = useLeagueClientStore()
    const bts = useBackgroundTasksStore()
    const { t } = useTranslation(undefined, {
      keyPrefix: 'simple-notifications-renderer.login-queue-task'
    })

    const taskId = `${SimpleNotificationsRenderer.id}/queueing`

    watch(
      () => lcs.login.loginQueueState,
      (state) => {
        if (!state) {
          bts.removeTask(taskId)
          return
        }

        if (!bts.hasTask(taskId)) {
          bts.createTask(taskId, {
            name: () => t('name')
          })
        }

        bts.updateTask(taskId, {
          description: () =>
            t('description', {
              position: state.estimatedPositionInQueue,
              maxPosition: state.maxDisplayedPosition,
              waitTime: formatSeconds(state.approximateWaitTimeSeconds)
            }),
          progress: Math.max(1 - state.estimatedPositionInQueue / state.maxDisplayedPosition, 0)
        })
      },
      {
        immediate: true
      }
    )
  }

  private _handleNotifications() {
    this._setupStreamerModeNotifications()
  }

  private _setupDeclarationModal() {
    const comp = defineComponent({
      setup() {
        const showModal = ref(false)
        const as = useAppCommonStore()
        const app = useInstance(AppCommonRenderer)

        watchEffect(() => {
          if (as.settings.showFreeSoftwareDeclaration) {
            showModal.value = true
          }
        })

        return () =>
          h(DeclarationModal, {
            show: showModal.value,
            'onUpdate:show': (v) => (showModal.value = v),
            onConfirm: () => {
              app.setShowFreeSoftwareDeclaration(false)
              showModal.value = false
            },
            onQuit: () => {
              app.quit()
            }
          })
      }
    })

    this._setup.addRenderVNode(() => h(comp))
  }

  private _setupAnnouncementModal() {
    const comp = defineComponent({
      setup() {
        const rcs = useRemoteConfigStore()
        const sns = useSimpleNotificationsStore()

        watch(
          () => rcs.announcement,
          (a, p) => {
            if (!a) {
              return
            }

            // unchanged
            if (p && a.uniqueId === p.uniqueId) {
              return
            }

            // new announcement
            if (
              a.frontMatter.alertLevel === 'high' &&
              a.uniqueId !== sns.lastAnnouncementUniqueId
            ) {
              sns.showAnnouncementModal = true
            }
          },
          { immediate: true }
        )

        // medium 和 low 会自动已读
        watch(
          () => sns.showAnnouncementModal,
          (v) => {
            if (!v) {
              return
            }

            if (
              rcs.announcement &&
              (rcs.announcement.frontMatter.alertLevel === 'medium' ||
                rcs.announcement.frontMatter.alertLevel === 'low')
            ) {
              sns.lastAnnouncementUniqueId = rcs.announcement.uniqueId
            }
          }
        )

        return () =>
          h(AnnouncementModal, {
            announcement: rcs.announcement,
            show: sns.showAnnouncementModal,
            'onUpdate:show': (v) => (sns.showAnnouncementModal = v),
            hasRead: sns.lastAnnouncementUniqueId === rcs.announcement?.uniqueId,
            onRead: (uniqueId) => {
              sns.lastAnnouncementUniqueId = uniqueId
              sns.showAnnouncementModal = false
            }
          })
      }
    })

    this._setup.addRenderVNode(() => h(comp))
  }

  private _setupNewReleaseModal() {
    const comp = defineComponent({
      setup() {
        const rcs = useRemoteConfigStore()
        const sns = useSimpleNotificationsStore()
        const sus = useSelfUpdateStore()
        const su = useInstance(SelfUpdateRenderer)
        const app = useInstance(AppCommonRenderer)
        const notification = useNotification()

        const { t } = useTranslation(undefined, {
          keyPrefix: 'simple-notifications-renderer.newReleaseHints'
        })

        watch(
          () => rcs.latestRelease,
          (release, p) => {
            if (!release || sus.settings.ignoreVersion === release.tag_name) {
              return
            }

            // unchanged
            if (p && p.tag_name === release.tag_name) {
              return
            }

            // new release
            if (release.isNew) {
              const inst = notification.info({
                title: () => t('title'),
                content: () =>
                  h(
                    WithActions,
                    {
                      buttons: [
                        {
                          label: () => t('dismiss'),
                          secondary: true,
                          onClick: () => {
                            inst.destroy()
                          }
                        },
                        {
                          label: () => t('takeALook'),
                          type: 'primary',
                          onClick: () => {
                            sns.showNewReleaseModal = true
                            inst.destroy()
                          }
                        }
                      ]
                    },
                    () => h('span', t('content', { version: release.tag_name }))
                  ),
                duration: 0
              })
            }
          },
          { immediate: true }
        )

        app.onRendererLink((url) => {
          const u = new URL(url)

          if (u.pathname === '/overlays/release-modal') {
            sns.showAnnouncementModal = false
            sns.showNewReleaseModal = true
          }
        })

        return () =>
          h(UpdateModal, {
            release: rcs.latestRelease,
            show: sns.showNewReleaseModal,
            ignoreVersion: sus.settings.ignoreVersion,
            isUpdating: sus.updateProgressInfo !== null,
            'onUpdate:show': (v) => (sns.showNewReleaseModal = v),
            onIgnoreVersion: (version, ignore) => {
              su.setIgnoreVersion(ignore ? version : null)
            },
            onStartDownload: () => {
              sns.showNewReleaseModal = false
              if (import.meta.env.DEV) {
                su.forceStartUpdate()
              } else {
                su.startUpdate()
              }
            }
          })
      }
    })

    this._setup.addRenderVNode(() => h(comp))
  }

  async onInit() {
    const sns = useSimpleNotificationsStore()

    await this._setting.savedPropVue(
      SimpleNotificationsRenderer.id,
      sns,
      'lastAnnouncementUniqueId'
    )

    this._setupDeclarationModal()
    this._setupAnnouncementModal()
    this._setupNewReleaseModal()
    this._setup.addSetupFn(() => this._handleNotifications())
    this._setup.addSetupFn(() => this._handleQueueingProgress())
  }

  showAnnouncementModal() {
    const sn = useSimpleNotificationsStore()
    sn.showAnnouncementModal = true
  }

  showNewReleaseModal() {
    const sn = useSimpleNotificationsStore()
    sn.showNewReleaseModal = true
  }
}
