import type { LcuEvent } from '@shared/types/league-client/event'

import type { AkariIpcMain } from '../ipc'
import type { LeagueClientMain } from '../league-client'
import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'
import type { RendererDebugState } from './state'

export const RENDERER_DEBUG_MAIN_NAMESPACE = 'renderer-debug-main'

export interface RendererDebugMainContext {
  namespace: string
  ipc: AkariIpcMain
  leagueClient: LeagueClientMain
  logger: AkariLogger
  mobxUtils: MobxUtilsMain
  state: RendererDebugState
}

export type RendererDebugLcuEvent = LcuEvent
