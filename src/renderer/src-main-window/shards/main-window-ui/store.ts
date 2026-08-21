import { defineStore } from 'pinia'
import { shallowReactive } from 'vue'

export type MainWindowBackgroundImageMode = 'profile-skin' | 'custom-image' | 'none'

export const useMainWindowUiStore = defineStore('shard:main-window-ui-renderer', () => {
  const frontendSettings = shallowReactive({
    backgroundImageMode: 'none' as MainWindowBackgroundImageMode,
    customBackgroundFilePath: '',
    customBackgroundRevision: 0,
    customBackgroundOverlayStrength: 0.8,
    sidebarCollapsed: true,
    showTestPage: false
  })

  return {
    frontendSettings
  }
})
