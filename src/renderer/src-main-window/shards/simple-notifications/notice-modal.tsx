import { useAkariApiStore } from '@renderer-shared/shards/akari-api/store'
import { defineComponent, watch } from 'vue'

import { type SimpleNotificationsRendererContext } from './context'
import NoticeModal from './modals/NoticeModal.vue'
import { useSimpleNotificationsStore } from './store'

export function registerNoticeModal(context: SimpleNotificationsRendererContext) {
  const Component = defineComponent({
    setup() {
      const akariApiStore = useAkariApiStore()
      const simpleNotificationsStore = useSimpleNotificationsStore()

      watch(
        () => akariApiStore.notice,
        (notice, previousNotice) => {
          if (!notice) {
            return
          }

          simpleNotificationsStore.noticeSummary = notice.summary

          if (previousNotice && notice.revision === previousNotice.revision) {
            return
          }

          if (
            notice.severity === 'high' &&
            notice.revision !== simpleNotificationsStore.lastNoticeRevision
          ) {
            simpleNotificationsStore.showNoticeModal = true
          }
        },
        { immediate: true }
      )

      // medium 和 low 会在打开弹窗时自动已读
      watch(
        () => simpleNotificationsStore.showNoticeModal,
        (shown) => {
          if (!shown) {
            return
          }

          if (
            akariApiStore.notice &&
            (akariApiStore.notice.severity === 'medium' || akariApiStore.notice.severity === 'low')
          ) {
            simpleNotificationsStore.lastNoticeRevision = akariApiStore.notice.revision
          }
        }
      )

      return () => (
        <NoticeModal
          {...{
            notice: akariApiStore.notice,
            contactChannels: akariApiStore.contactChannels,
            show: simpleNotificationsStore.showNoticeModal,
            'onUpdate:show': (value: boolean) => (simpleNotificationsStore.showNoticeModal = value),
            hasRead: simpleNotificationsStore.lastNoticeRevision === akariApiStore.notice?.revision,
            onRead: (revision: string) => {
              simpleNotificationsStore.lastNoticeRevision = revision
              simpleNotificationsStore.showNoticeModal = false
            }
          }}
        />
      )
    }
  })

  context.setupInAppScope.addRenderVNode(() => <Component />)
}
