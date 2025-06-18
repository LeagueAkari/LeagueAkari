import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSimpleNotificationsStore = defineStore(
  'shard:simple-notifications-renderer',
  () => {
    // need globally shared
    const showAnnouncementModal = ref(false)
    const showNewReleaseModal = ref(false)

    const lastAnnouncementUniqueId = ref<string | null>(null)

    return {
      showAnnouncementModal,
      showNewReleaseModal,
      lastAnnouncementUniqueId
    }
  }
)
