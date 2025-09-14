import LeagueAkariSpan from '@renderer-shared/components/LeagueAkariSpan.vue'
import FunnyPricing from '@renderer-shared/components/easter-eggs/FunnyPricing.vue'
import { useKeyboardCombo } from '@renderer-shared/compositions/useKeyboardCombo'
import { useInstance } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useBackgroundTasksStore } from '@renderer-shared/shards/background-tasks/store'
import { ClientInstallationRenderer } from '@renderer-shared/shards/client-installation'
import { useClientInstallationStore } from '@renderer-shared/shards/client-installation/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LeagueClientUxRenderer } from '@renderer-shared/shards/league-client-ux'
import { useLeagueClientUxStore } from '@renderer-shared/shards/league-client-ux/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useRemoteConfigStore } from '@renderer-shared/shards/remote-config/store'
import { SelfUpdateRenderer } from '@renderer-shared/shards/self-update'
import { useSelfUpdateStore } from '@renderer-shared/shards/self-update/store'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { SetupInAppScopeRenderer } from '@renderer-shared/shards/setup-in-app-scope'
import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { formatSeconds } from '@shared/utils/format'
import { useTranslation } from 'i18next-vue'
import { NotificationReactive, useDialog, useMessage, useNotification } from 'naive-ui'
import { computed, defineComponent, h, inject, ref, watch, watchEffect } from 'vue'

import AnnouncementModal from './modals/AnnouncementModal.vue'
import DeclarationModal from './modals/DeclarationModal.vue'
import UpdateModal from './modals/UpdateModal.vue'
import WithActions from './parts/WithActions.vue'
import { useSimpleNotificationsStore } from './store'

/**
 * 一些全局性的周期性通知
 *
 * 和 simple 毫无关联
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
    @Dep(SetupInAppScopeRenderer) private readonly _setup: SetupInAppScopeRenderer,
    @Dep(LeagueClientUxRenderer) private readonly _lcux: LeagueClientUxRenderer
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
        const as = useAppCommonStore()
        const app = useInstance(AppCommonRenderer)
        const sns = useSimpleNotificationsStore()

        watchEffect(() => {
          if (as.settings.showFreeSoftwareDeclaration) {
            sns.showDeclarationModal = true
          }
        })

        return () =>
          h(DeclarationModal, {
            show: sns.showDeclarationModal,
            'onUpdate:show': (v) => (sns.showDeclarationModal = v),
            onConfirm: () => {
              app.setShowFreeSoftwareDeclaration(false)
              sns.showDeclarationModal = false
            },
            onExit: () => {
              app.exit()
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

  private _setupFunnyPricingModal() {
    const comp = defineComponent({
      setup() {
        const { t } = useTranslation()
        const as = useAppCommonStore()

        const show = ref(false)
        const balance = ref(0)
        const current = ref('basic')

        useKeyboardCombo('SUBSCRIBE', {
          onFinish: () => {
            show.value = true
          }
        })

        useKeyboardCombo('GIVEMEAKARI', {
          onFinish: () => {
            balance.value += 1000000
          }
        })

        return () =>
          h(FunnyPricing, {
            ref: (el) => {},
            show: show.value,
            balance: balance.value,
            current: current.value,
            'onUpdate:show': (val) => (show.value = val),
            'onUpdate:balance': (val) => (balance.value = val),
            onPurchase: (item) => {
              balance.value -= item.price
              current.value = item.id

              // 彩蛋环节
              as.overrideAppTitle = `${t('appName', { ns: 'common' })} ${item.title} ${as.isAdministrator ? 'X' : ''}`
            }
          })
      }
    })

    this._setup.addRenderVNode(() => h(comp))
  }

  private _setupSpecialKeyboardCombo() {
    const message = useMessage()
    const sns = useSimpleNotificationsStore()

    useKeyboardCombo('AKARI', {
      onFinish: () => {
        if (sns.showDeclarationModal) {
          sns.showDeclarationModal = false
        } else {
          message.success(() => h(LeagueAkariSpan, { bold: true }))
        }
      },
      requireSameEl: true,
      caseSensitive: false,
      timeout: 250
    })
  }

  /**
   * 提醒需要以管理员权限运行
   */
  private _handleAskUserToRunAsAdministrator() {
    const lcuxs = useLeagueClientUxStore()
    const as = useAppCommonStore()
    const dialog = useDialog()
    const { t } = useTranslation(undefined, {
      keyPrefix: 'simple-notifications-renderer.wmiRequiresAdministrator'
    })

    const app = useInstance(AppCommonRenderer)

    const shouldAsk = computed(() => {
      return lcuxs.settings.useWmi && !as.isAdministrator
    })

    watch(
      () => shouldAsk.value,
      (v) => {
        if (v) {
          const dl = dialog.warning({
            title: () => t('title'),
            content: () => t('content'),
            positiveText: t('positiveText'),
            negativeText: t('negativeText'),
            onNegativeClick: () => {
              dl.destroy()
            },
            onPositiveClick: () => {
              app.relaunchAsAdministrator()
            }
          })
        }
      },
      { immediate: true }
    )
  }

  private _handleCannotGetUxCommandLine() {
    const lcuxs = useLeagueClientUxStore()
    const as = useAppCommonStore()
    const dialog = useDialog()
    const { t } = useTranslation(undefined, {
      keyPrefix: 'simple-notifications-renderer.cannotGetUxCommandLine'
    })

    const app = useInstance(AppCommonRenderer)

    watch(
      () => lcuxs.hasClientButNoCommandLine,
      (v) => {
        if (v) {
          const dl = dialog.warning({
            style: { width: '600px' },
            title: () => t('title'),
            content: () =>
              h('div', [
                h('div', as.isAdministrator ? t('withAdminContent') : t('noAdminContent')),
                h('div', { style: { marginTop: '8px', fontWeight: 'bold' } }, t('extraContent'))
              ]),
            positiveText: as.isAdministrator
              ? t('withAdminPositiveText')
              : t('noAdminPositiveText'),
            onPositiveClick: () => {
              if (as.isAdministrator) {
                app.relaunchAsAdministrator()
              } else {
                dl.destroy()
              }
            }
          })
        }
      },
      { immediate: true }
    )
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
    this._setupFunnyPricingModal()
    this._setup.addSetupFn(() => this._setupSpecialKeyboardCombo())
    this._setup.addSetupFn(() => this._handleNotifications())
    this._setup.addSetupFn(() => this._handleQueueingProgress())
    this._setup.addSetupFn(() => this._handleAskUserToRunAsAdministrator())
    this._setup.addSetupFn(() => this._handleCannotGetUxCommandLine())
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
