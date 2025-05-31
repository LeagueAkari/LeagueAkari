import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSimpleNotificationsStore = defineStore(
  'shard:simple-notifications-renderer',
  () => {
    // need globally shared
    const showAnnouncementModal = ref(false)
    const lastAnnouncementSha = ref<string | null>(null)

    return {
      showAnnouncementModal,
      lastAnnouncementSha
    }
  }
)
