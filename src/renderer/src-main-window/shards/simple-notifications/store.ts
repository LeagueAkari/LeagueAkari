import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSimpleNotificationsStore = defineStore(
  'shard:simple-notifications-renderer',
  () => {
    // need globally shared
    const showNoticeModal = ref(false)
    const noticeSummary = ref<string | null>(null)
    const showNewReleaseModal = ref(false)
    const showDeclarationModal = ref(false)

    const lastNoticeRevision = ref<string | null>(null)

    return {
      showNoticeModal,
      noticeSummary,
      showNewReleaseModal,
      showDeclarationModal,
      lastNoticeRevision
    }
  }
)
