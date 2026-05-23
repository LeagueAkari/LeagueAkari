import type { LcuEvent } from '@shared/types/league-client/event'
import type { RadixEventEmitter } from '@shared/utils/event-emitter'

import type { AkariIpcRenderer } from '../ipc'
import type { LoggerRenderer } from '../logger'
import type { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import type { SettingUtilsRenderer } from '../setting-utils'
import type { SetupInAppScopeRenderer } from '../setup-in-app-scope'

export const RENDERER_DEBUG_RENDERER_NAMESPACE = 'renderer-debug-renderer'
export const MAIN_SHARD_NAMESPACE = 'renderer-debug-main'

export interface RendererDebugRendererContext {
  namespace: string
  mainShardNamespace: string
  ipc: AkariIpcRenderer
  piniaMobxUtils: PiniaMobxUtilsRenderer
  logger: LoggerRenderer
  settingUtils: SettingUtilsRenderer
  setupInAppScope: SetupInAppScopeRenderer
  matcher: RadixEventEmitter
}

export type RendererDebugLcuEvent = LcuEvent
