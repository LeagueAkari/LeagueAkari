import { defineStore } from 'pinia'
import { ref, shallowReactive } from 'vue'

export const useMainWindowUiStore = defineStore('shard:main-window-ui-renderer', () => {
  const frontendSettings = shallowReactive({
    useProfileSkinAsBackground: false,
    sidebarCollapsed: true,
    showTestPage: false
  })

  const backgroundSkinUrl = ref<string | null>(null)
  const tabBackgroundSkinUrl = ref<string | null>(null)

  return {
    frontendSettings,
    backgroundSkinUrl,
    tabBackgroundSkinUrl
  }
})
