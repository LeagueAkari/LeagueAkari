import type { AkariIpcRenderer } from '../ipc'

export const SAVED_PLAYER_MAIN_NAMESPACE = 'saved-player-main'
export const SAVED_PLAYER_RENDERER_NAMESPACE = 'saved-player-renderer'

export interface SavedPlayerRendererContext {
  ipc: AkariIpcRenderer
}
