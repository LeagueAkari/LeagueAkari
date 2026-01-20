import LeagueAkariSpan from '@renderer-shared/components/LeagueAkariSpan.vue'
import FunnyPricing from '@renderer-shared/components/easter-eggs/FunnyPricing.vue'
import { useKeyboardCombo } from '@renderer-shared/composables/useKeyboardCombo'
import { useTimeLeft } from '@renderer-shared/composables/useTimeLeft'
import { useInstance } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useAutoGameflowStore } from '@renderer-shared/shards/auto-gameflow/store'
import { useBackgroundTasksStore } from '@renderer-shared/shards/background-tasks/store'
import { ClientInstallationRenderer } from '@renderer-shared/shards/client-installation'
import { useClientInstallationStore } from '@renderer-shared/shards/client-installation/store'
import { AkariIpcRenderer } from '@renderer-shared/shards/ipc'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LeagueClientUxRenderer } from '@renderer-shared/shards/league-client-ux'
import { useLeagueClientUxStore } from '@renderer-shared/shards/league-client-ux/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { RemoteConfigRenderer } from '@renderer-shared/shards/remote-config'
import { useRemoteConfigStore } from '@renderer-shared/shards/remote-config/store'
import { SelfUpdateRenderer } from '@renderer-shared/shards/self-update'
import { useSelfUpdateStore } from '@renderer-shared/shards/self-update/store'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { SetupInAppScopeRenderer } from '@renderer-shared/shards/setup-in-app-scope'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { useStorageStore } from '@renderer-shared/shards/storage/store'
import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { formatSeconds } from '@shared/utils/format'
import { useTranslation } from 'i18next-vue'
import {
  DialogReactive,
  NButton,
  NotificationReactive,
  useDialog,
  useMessage,
  useNotification
} from 'naive-ui'
import { computed, defineComponent, h, ref, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

import FeatureGuide from '@main-window/components/FeatureGuide.vue'
import { useAppContext } from '@main-window/context'
import moreTags from '@main-window/shards/simple-notifications/imgs/more-tags.png'
import queryInLobby from '@main-window/shards/simple-notifications/imgs/query-in-lobby.png'

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
    @Dep(ClientInstallationRenderer) readonly _inst: ClientInstallationRenderer,
    @Dep(AppCommonRenderer) readonly _app: AppCommonRenderer,
    @Dep(SettingUtilsRenderer) private readonly _setting: SettingUtilsRenderer,
    @Dep(LeagueClientRenderer) private readonly _client: LeagueClientRenderer,
    @Dep(SetupInAppScopeRenderer) private readonly _setup: SetupInAppScopeRenderer,
    @Dep(LeagueClientUxRenderer) readonly _lcux: LeagueClientUxRenderer,
    @Dep(RemoteConfigRenderer) readonly _rc: RemoteConfigRenderer,
    @Dep(AkariIpcRenderer) readonly _ipc: AkariIpcRenderer
  ) {}

  /**
   * 猜你正在直播
   */
  _setupStreamerModeNotifications() {
    const notification = useNotification()
    const installation = useClientInstallationStore()
    const app = useAppCommonStore()
    const { openSettingsModal } = useAppContext()
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
                      openSettingsModal('misc')
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

            sns.announcementSummary = a.frontMatter.summary ?? null

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
            if (!release || sus.settings.ignoreVersion === release.version) {
              return
            }

            // unchanged
            if (p && p.version === release.version) {
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
                    () => h('span', t('content', { version: release.version }))
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
            updateProgressInfo: sus.updateProgressInfo,
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

  private _handleSpecialKeyboardCombo() {
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
    const lcs = useLeagueClientStore()
    const lcux = useInstance(LeagueClientUxRenderer)
    const lcuxs = useLeagueClientUxStore()
    const as = useAppCommonStore()
    const dialog = useDialog()
    const { t } = useTranslation(undefined, {
      keyPrefix: 'simple-notifications-renderer.cannotGetUxCommandLine'
    })

    const app = useInstance(AppCommonRenderer)

    let dl: DialogReactive | null = null
    watch(
      [
        () => lcuxs.hasClientButNoCommandLine,
        () =>
          lcs.isDisconnected /* 在退出 lcux 后，lc 仍然会短暂停留并处理善后工作，考虑仅限未连接才会触发此提示 */
      ],
      ([hasClientButNoCommandLine, isDisconnected]) => {
        if (hasClientButNoCommandLine && isDisconnected) {
          if (lcuxs.settings.useWmi) {
            dl = dialog.warning({
              style: { width: '600px' },
              title: () => t('title'),
              content: () => t('alreadyUseWmi'),
              positiveText: t('withAdminPositiveText'),
              onPositiveClick: () => dl?.destroy()
            })

            return
          }

          dl = dialog.warning({
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
                lcux.setUseWmi(true).then(() => {
                  app.relaunchAsAdministrator()
                })
              } else {
                dl?.destroy()
              }
            }
          })
        } else {
          dl?.destroy()
        }
      },
      { immediate: true }
    )
  }

  /**
   * 使用新版本数据库时，提醒用户更新
   */
  private _handleHigherVersionDbWarning() {
    const storage = useStorageStore()
    const rcs = useRemoteConfigStore()
    const dialog = useDialog()
    const sns = useSimpleNotificationsStore()
    const { t } = useTranslation(undefined, {
      keyPrefix: 'simple-notifications-renderer.higherVersionDb'
    })

    const hasNewRelease = computed(() => !!rcs.latestRelease && rcs.latestRelease.isNew === true)

    let inst: ReturnType<typeof dialog.warning> | null = null

    watch(
      () => hasNewRelease.value,
      () => {
        if (hasNewRelease.value && inst) {
          inst.positiveButtonProps = { disabled: false }
        }
      }
    )

    watch(
      () => storage.usingHigherVersionDb,
      (v) => {
        if (v) {
          inst = dialog.warning({
            style: { width: '600px' },
            closable: true,
            title: () => t('title'),
            content: () => t('content'),
            positiveText: t('positiveText'),
            positiveButtonProps: { disabled: !hasNewRelease.value },
            onPositiveClick: () => {
              if (hasNewRelease.value) {
                sns.showNewReleaseModal = true
              }
              inst?.destroy()
            }
          })
        }
      },
      { immediate: true }
    )
  }

  private _handleBadSgpConnectionWarning() {
    const sgps = useSgpStore()
    const dialog = useDialog()
    const as = useAppCommonStore()
    const { openSettingsModal } = useAppContext()

    const { t } = useTranslation(undefined, {
      keyPrefix: 'simple-notifications-renderer.badSgpConnection'
    })

    const isBadSgp = computed(() => {
      if (as.settings.preferredLolSource === 'lcu') {
        return false
      }

      return (
        sgps.connectionSuccessesCounted + sgps.connectionFailuresCounted >= 5 &&
        sgps.connectionFailuresCounted /
          (sgps.connectionSuccessesCounted + sgps.connectionFailuresCounted) >=
          0.5
      )
    })

    let inst: ReturnType<typeof dialog.warning> | null = null

    watch(
      () => isBadSgp.value,
      (v) => {
        if (v) {
          inst = dialog.warning({
            style: { width: '600px' },
            closable: true,
            title: () => t('title'),
            content: () =>
              h('div', { style: { display: 'flex', 'flex-direction': 'column', gap: '12px' } }, [
                h('div', t('content.usingSgp')),
                h('div', t('content.recommendation')),
                h('div', t('content.vpnReason'))
              ]),
            positiveText: t('positiveText'),
            negativeText: t('negativeText'),
            onPositiveClick: () => {
              openSettingsModal('basic')
              inst?.destroy()
            },
            onNegativeClick: () => {
              inst?.destroy()
            }
          })
        }
      }
    )
  }

  private _handleAutoReconnectNotification() {
    const agfs = useAutoGameflowStore()
    const notification = useNotification()
    const { t } = useTranslation(undefined, {
      keyPrefix: 'simple-notifications-renderer.autoReconnect'
    })

    const { timeLeft } = useTimeLeft(() => agfs.willReconnectAt, null)

    let notificationReactive: NotificationReactive | null = null

    watch(
      () => timeLeft.value,
      (leftMs) => {
        if (leftMs > 0) {
          notificationReactive = notification.success({
            title: () => t('title'),
            content: () => h('span', t('content', { timeLeft: formatSeconds(leftMs / 1000, 1) })),
            duration: 0
          })
        } else {
          notificationReactive?.destroy()
        }
      },
      { immediate: true }
    )
  }

  private _handleRunInTempDirWarning() {
    const app = useAppCommonStore()

    const dialog = useDialog()
    const { t } = useTranslation(undefined, {
      keyPrefix: 'simple-notifications-renderer.runInTempDirWarning'
    })

    let inst: ReturnType<typeof dialog.warning> | null = null

    watch(
      () => app.isRunInTempDir,
      (v) => {
        if (v) {
          inst = dialog.warning({
            title: () => t('title'),
            content: () => t('content'),
            negativeText: t('negativeText'),
            negativeButtonProps: { type: 'warning', secondary: false },
            onNegativeClick: () => {
              inst?.destroy()
            }
          })
        }
      },
      { immediate: true }
    )
  }

  private _handleUpdateDownloadFailed() {
    const { t } = useTranslation(undefined, {
      keyPrefix: 'simple-notifications-renderer.updateDownloadFailed'
    })

    const notification = useNotification()

    this._ipc.onEventVue(SelfUpdateRenderer.id, 'error-download-update', (error) => {
      const no = notification.warning({
        title: () => t('title'),
        content: () =>
          h('div', [
            t('content', { error: error.message }),

            // buttons group
            h('div', { class: 'flex justify-end gap-2' }, [
              h(
                NButton,
                {
                  size: 'tiny',
                  onClick: () => {
                    no.destroy()
                  }
                },
                () => t('negativeText')
              ),
              h(
                NButton,
                {
                  type: 'primary',
                  size: 'tiny',
                  onClick: () => {
                    this.showAnnouncementModal()
                    no.destroy()
                  }
                },
                () => t('positiveText')
              )
            ])
          ])
      })
    })
  }

  private _setupOngoingGameNewFeatures() {
    const comp = defineComponent({
      setup() {
        const st = useInstance(SettingUtilsRenderer)

        const ogs = useOngoingGameStore()
        const route = useRoute()

        const { t } = useTranslation(undefined, {
          keyPrefix: 'FeatureGuide.ongoingGameNewFeatures20251225'
        })

        const show = ref(false)

        watch(
          () => route.name,
          async (name) => {
            if (name === 'ongoing-game' && ogs.queryStage.phase !== 'unavailable') {
              const isConfirmed = await st.get(
                SimpleNotificationsRenderer.id,
                'ongoingGameNewFeatures20251225'
              )

              if (!isConfirmed) {
                show.value = true
              }
            }
          }
        )

        return () =>
          h(FeatureGuide, {
            items: [
              {
                title: t('item1.title'),
                description: t('item1.description'),
                imageUrls: [queryInLobby]
              },
              {
                title: t('item2.title'),
                description: t('item2.description'),
                imageUrls: [moreTags]
              }
            ],
            show: show.value,
            'onUpdate:show': (v) => (show.value = v),
            onConfirm: () => {
              show.value = false
              st.set(SimpleNotificationsRenderer.id, 'ongoingGameNewFeatures20251225', true).catch(
                () => {}
              )
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
    this._setupFunnyPricingModal()
    this._setupOngoingGameNewFeatures()
    this._setup.addSetupFn(() => this._handleSpecialKeyboardCombo())
    this._setup.addSetupFn(() => this._handleNotifications())
    this._setup.addSetupFn(() => this._handleQueueingProgress())
    this._setup.addSetupFn(() => this._handleAskUserToRunAsAdministrator())
    this._setup.addSetupFn(() => this._handleCannotGetUxCommandLine())
    this._setup.addSetupFn(() => this._handleHigherVersionDbWarning())
    this._setup.addSetupFn(() => this._handleBadSgpConnectionWarning())
    this._setup.addSetupFn(() => this._handleAutoReconnectNotification())
    this._setup.addSetupFn(() => this._handleRunInTempDirWarning())
    this._setup.addSetupFn(() => this._handleUpdateDownloadFailed())
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
