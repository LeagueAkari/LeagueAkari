import { useInstance } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { LeagueClientUxRenderer } from '@renderer-shared/shards/league-client-ux'
import { useLeagueClientUxStore } from '@renderer-shared/shards/league-client-ux/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useRemoteConfigStore } from '@renderer-shared/shards/remote-config/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { useStorageStore } from '@renderer-shared/shards/storage/store'
import { useTranslation } from 'i18next-vue'
import { DialogReactive, NCheckbox, useDialog } from 'naive-ui'
import { computed, ref, watch } from 'vue'

import { useMainWindowAppContext } from '@main-window/context'

import {
  NEVER_SHOW_BAD_SGP_CONNECTION_SETTING_KEY,
  SIMPLE_NOTIFICATIONS_RENDERER_ID,
  type SimpleNotificationsRendererContext
} from './context'
import { useSimpleNotificationsStore } from './store'

export function watchAskUserToRunAsAdministrator() {
  const leagueClientUxStore = useLeagueClientUxStore()
  const appCommonStore = useAppCommonStore()
  const dialog = useDialog()
  const { t } = useTranslation(undefined, {
    keyPrefix: 'notifications.simple.wmiRequiresAdministrator'
  })

  const appCommon = useInstance(AppCommonRenderer)

  const shouldAsk = computed(() => {
    return leagueClientUxStore.settings.useWmi && !appCommonStore.isElevated
  })

  watch(
    () => shouldAsk.value,
    (should) => {
      if (should) {
        const dialogReactive = dialog.warning({
          title: () => t('title'),
          content: () => t('content'),
          positiveText: t('positiveText'),
          negativeText: t('negativeText'),
          onNegativeClick: () => {
            dialogReactive.destroy()
          },
          onPositiveClick: () => {
            appCommon.relaunchAsAdministrator()
          }
        })
      }
    },
    { immediate: true }
  )
}

export function watchCannotGetUxCommandLine() {
  const leagueClientStore = useLeagueClientStore()
  const leagueClientUx = useInstance(LeagueClientUxRenderer)
  const leagueClientUxStore = useLeagueClientUxStore()
  const appCommonStore = useAppCommonStore()
  const dialog = useDialog()
  const { t } = useTranslation(undefined, {
    keyPrefix: 'notifications.simple.cannotGetUxCommandLine'
  })

  const appCommon = useInstance(AppCommonRenderer)

  let dialogReactive: DialogReactive | null = null
  watch(
    [
      () => leagueClientUxStore.hasClientButNoCommandLine,
      () =>
        leagueClientStore.isDisconnected /* 在退出 leagueClientUx 后，leagueClient 仍然会短暂停留并处理善后工作，考虑仅限未连接才会触发此提示 */
    ],
    ([hasClientButNoCommandLine, isDisconnected]) => {
      if (hasClientButNoCommandLine && isDisconnected) {
        if (leagueClientUxStore.settings.useWmi) {
          dialogReactive = dialog.warning({
            style: { width: '600px' },
            title: () => t('title'),
            content: () => t('alreadyUseWmi'),
            positiveText: t('withAdminPositiveText'),
            onPositiveClick: () => dialogReactive?.destroy()
          })

          return
        }

        dialogReactive = dialog.warning({
          style: { width: '600px' },
          title: () => t('title'),
          content: () => (
            <div>
              <div>{appCommonStore.isElevated ? t('withAdminContent') : t('noAdminContent')}</div>
              <div style={{ marginTop: '8px', fontWeight: 'bold' }}>{t('extraContent')}</div>
            </div>
          ),
          positiveText: appCommonStore.isElevated
            ? t('withAdminPositiveText')
            : t('noAdminPositiveText'),
          onPositiveClick: () => {
            if (appCommonStore.isElevated) {
              leagueClientUx.setUseWmi(true).then(() => {
                appCommon.relaunchAsAdministrator()
              })
            } else {
              dialogReactive?.destroy()
            }
          }
        })
      } else {
        dialogReactive?.destroy()
      }
    },
    { immediate: true }
  )
}

export function watchHigherVersionDbWarning() {
  const storage = useStorageStore()
  const remoteConfigStore = useRemoteConfigStore()
  const dialog = useDialog()
  const simpleNotificationsStore = useSimpleNotificationsStore()
  const { t } = useTranslation(undefined, {
    keyPrefix: 'notifications.simple.higherVersionDb'
  })

  const hasNewRelease = computed(
    () => !!remoteConfigStore.latestRelease && remoteConfigStore.latestRelease.isNew === true
  )

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
    (usingHigherVersionDb) => {
      if (usingHigherVersionDb) {
        inst = dialog.warning({
          style: { width: '600px' },
          closable: true,
          title: () => t('title'),
          content: () => t('content'),
          positiveText: t('positiveText'),
          positiveButtonProps: { disabled: !hasNewRelease.value },
          onPositiveClick: () => {
            if (hasNewRelease.value) {
              simpleNotificationsStore.showNewReleaseModal = true
            }
            inst?.destroy()
          }
        })
      }
    },
    { immediate: true }
  )
}

export function watchBadSgpConnectionWarning(context: SimpleNotificationsRendererContext) {
  const sgpStore = useSgpStore()
  const dialog = useDialog()
  const appCommonStore = useAppCommonStore()
  const { openSettingsModal } = useMainWindowAppContext()
  const neverShowAgainChecked = ref(false)

  const { t } = useTranslation(undefined, {
    keyPrefix: 'notifications.simple.badSgpConnection'
  })

  const isBadSgp = computed(() => {
    if (appCommonStore.settings.preferredLolSource === 'lcu') {
      return false
    }

    return (
      sgpStore.connectionSuccessesCounted + sgpStore.connectionFailuresCounted >= 5 &&
      sgpStore.connectionFailuresCounted /
        (sgpStore.connectionSuccessesCounted + sgpStore.connectionFailuresCounted) >=
        0.5
    )
  })

  let inst: ReturnType<typeof dialog.warning> | null = null

  const saveNeverShowAgain = () => {
    if (neverShowAgainChecked.value) {
      context.settingUtils.set(
        SIMPLE_NOTIFICATIONS_RENDERER_ID,
        NEVER_SHOW_BAD_SGP_CONNECTION_SETTING_KEY,
        true
      )
    }
  }

  watch(
    () => isBadSgp.value,
    async (isBad) => {
      if (isBad) {
        const neverShow = await context.settingUtils.get(
          SIMPLE_NOTIFICATIONS_RENDERER_ID,
          NEVER_SHOW_BAD_SGP_CONNECTION_SETTING_KEY,
          false
        )

        if (!isBadSgp.value || neverShow || inst) {
          return
        }

        neverShowAgainChecked.value = false

        inst = dialog.warning({
          style: { width: '600px' },
          closable: true,
          title: () => t('title'),
          content: () => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>{t('content.usingSgp')}</div>
              <div>{t('content.recommendation')}</div>
              <div>{t('content.vpnReason')}</div>
              <NCheckbox
                {...{
                  checked: neverShowAgainChecked.value,
                  'onUpdate:checked': (checked: boolean) => {
                    neverShowAgainChecked.value = checked
                  }
                }}
              >
                {t('neverShowAgain')}
              </NCheckbox>
            </div>
          ),
          positiveText: t('positiveText'),
          negativeText: t('negativeText'),
          onPositiveClick: () => {
            saveNeverShowAgain()
            openSettingsModal('basic')
            inst?.destroy()
            inst = null
          },
          onNegativeClick: () => {
            saveNeverShowAgain()
            inst?.destroy()
            inst = null
          },
          onClose: () => {
            saveNeverShowAgain()
            inst = null
          }
        })
      } else {
        inst?.destroy()
        inst = null
      }
    }
  )
}

export function watchRunInTempDirWarning() {
  const appCommonStore = useAppCommonStore()

  const dialog = useDialog()
  const { t } = useTranslation(undefined, {
    keyPrefix: 'notifications.simple.runInTempDirWarning'
  })

  let inst: ReturnType<typeof dialog.warning> | null = null

  watch(
    () => appCommonStore.isRunInTempDir,
    (isRunInTempDir) => {
      if (isRunInTempDir) {
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
