import { useInstance } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { useRemoteConfigStore } from '@renderer-shared/shards/remote-config/store'
import { SelfUpdateRenderer } from '@renderer-shared/shards/self-update'
import { useSelfUpdateStore } from '@renderer-shared/shards/self-update/store'
import { useTranslation } from 'i18next-vue'
import { useNotification } from 'naive-ui'
import { defineComponent, watch } from 'vue'

import { type SimpleNotificationsRendererContext } from './context'
import UpdateModal from './modals/UpdateModal.vue'
import WithActions from './parts/WithActions.vue'
import { useSimpleNotificationsStore } from './store'

export function registerNewReleaseModal(context: SimpleNotificationsRendererContext) {
  const Component = defineComponent({
    setup() {
      const remoteConfigStore = useRemoteConfigStore()
      const simpleNotificationsStore = useSimpleNotificationsStore()
      const selfUpdateStore = useSelfUpdateStore()
      const selfUpdate = useInstance(SelfUpdateRenderer)
      const appCommon = useInstance(AppCommonRenderer)
      const notification = useNotification()

      const { t } = useTranslation(undefined, {
        keyPrefix: 'notifications.simple.newReleaseHints'
      })

      watch(
        () => remoteConfigStore.latestRelease,
        (release, previousRelease) => {
          if (!release || selfUpdateStore.settings.ignoreVersion === release.version) {
            return
          }

          if (previousRelease && previousRelease.version === release.version) {
            return
          }

          if (release.isNew) {
            const inst = notification.info({
              title: () => t('title'),
              content: () => (
                <WithActions
                  buttons={[
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
                        simpleNotificationsStore.showNewReleaseModal = true
                        inst.destroy()
                      }
                    }
                  ]}
                >
                  <span>{t('content', { version: release.version })}</span>
                </WithActions>
              ),
              duration: 0
            })
          }
        },
        { immediate: true }
      )

      appCommon.onRendererLink((url) => {
        const u = new URL(url)

        if (u.pathname === '/overlays/release-modal') {
          simpleNotificationsStore.showAnnouncementModal = false
          simpleNotificationsStore.showNewReleaseModal = true
        }
      })

      return () => (
        <UpdateModal
          {...{
            release: remoteConfigStore.latestRelease,
            show: simpleNotificationsStore.showNewReleaseModal,
            ignoreVersion: selfUpdateStore.settings.ignoreVersion,
            updateProgressInfo: selfUpdateStore.updateProgressInfo,
            'onUpdate:show': (value: boolean) =>
              (simpleNotificationsStore.showNewReleaseModal = value),
            onIgnoreVersion: (version: string, ignore: boolean) => {
              selfUpdate.setIgnoreVersion(ignore ? version : null)
            },
            onStartDownload: () => {
              simpleNotificationsStore.showNewReleaseModal = false
              if (import.meta.env.DEV) {
                selfUpdate.forceStartUpdate()
              } else {
                selfUpdate.startUpdate()
              }
            }
          }}
        />
      )
    }
  })

  context.setupInAppScope.addRenderVNode(() => <Component />)
}
