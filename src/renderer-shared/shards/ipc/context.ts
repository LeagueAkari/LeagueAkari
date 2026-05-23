import type { SharedGlobalShard } from '@shared/akari-shard'

export const AKARI_IPC_RENDERER_NAMESPACE = 'akari-ipc-renderer'
export const LOGGER_SHARD_NAMESPACE = 'logger-renderer'

export interface AkariIpcRendererContext {
  shared: SharedGlobalShard
}
