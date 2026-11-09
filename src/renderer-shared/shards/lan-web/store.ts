import {
  LAN_WEB_DEFAULT_PORT,
  type LanWebRuntimeState,
  type LanWebSettingsData
} from '@shared/shards/lan-web'
import { defineStore } from 'pinia'
import { shallowReactive } from 'vue'

export const useLanWebStore = defineStore('shard:lan-web-renderer', () => {
  const settings = shallowReactive<LanWebSettingsData>({
    enabled: false,
    port: LAN_WEB_DEFAULT_PORT
  })
  const state = shallowReactive<LanWebRuntimeState>({
    status: 'stopped',
    listeningPort: null,
    accessUrls: [],
    errorMessage: null
  })

  return { settings, state }
})
