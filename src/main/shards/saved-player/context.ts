import type { SharedGlobalShard } from '@shared/akari-shard'

import type { AkariIpcMain } from '../ipc'
import type { StorageMain } from '../storage'

export const SAVED_PLAYER_MAIN_NAMESPACE = 'saved-player-main'

export interface SavedPlayerMainContext {
  namespace: string
  ipc: AkariIpcMain
  storage: StorageMain
  shared: SharedGlobalShard
}
