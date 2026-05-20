import { useRemoteConfigStore } from '@renderer-shared/shards/remote-config/store'
import { defineComponent, watch } from 'vue'

import { type SimpleNotificationsRendererContext } from './context'
import AnnouncementModal from './modals/AnnouncementModal.vue'
import { useSimpleNotificationsStore } from './store'

export function registerAnnouncementModal(context: SimpleNotificationsRendererContext) {
  const Component = defineComponent({
    setup() {
      const remoteConfigStore = useRemoteConfigStore()
      const simpleNotificationsStore = useSimpleNotificationsStore()

      watch(
        () => remoteConfigStore.announcement,
        (announcement, previousAnnouncement) => {
          if (!announcement) {
            return
          }

          simpleNotificationsStore.announcementSummary = announcement.frontMatter.summary ?? null

          if (previousAnnouncement && announcement.uniqueId === previousAnnouncement.uniqueId) {
            return
          }

          if (
            announcement.frontMatter.alertLevel === 'high' &&
            announcement.uniqueId !== simpleNotificationsStore.lastAnnouncementUniqueId
          ) {
            simpleNotificationsStore.showAnnouncementModal = true
          }
        },
        { immediate: true }
      )

      // medium 和 low 会自动已读
      watch(
        () => simpleNotificationsStore.showAnnouncementModal,
        (shown) => {
          if (!shown) {
            return
          }

          if (
            remoteConfigStore.announcement &&
            (remoteConfigStore.announcement.frontMatter.alertLevel === 'medium' ||
              remoteConfigStore.announcement.frontMatter.alertLevel === 'low')
          ) {
            simpleNotificationsStore.lastAnnouncementUniqueId =
              remoteConfigStore.announcement.uniqueId
          }
        }
      )

      return () => (
        <AnnouncementModal
          {...{
            announcement: remoteConfigStore.announcement,
            show: simpleNotificationsStore.showAnnouncementModal,
            'onUpdate:show': (value: boolean) =>
              (simpleNotificationsStore.showAnnouncementModal = value),
            hasRead:
              simpleNotificationsStore.lastAnnouncementUniqueId ===
              remoteConfigStore.announcement?.uniqueId,
            onRead: (uniqueId: string) => {
              simpleNotificationsStore.lastAnnouncementUniqueId = uniqueId
              simpleNotificationsStore.showAnnouncementModal = false
            }
          }}
        />
      )
    }
  })

  context.setupInAppScope.addRenderVNode(() => <Component />)
}
