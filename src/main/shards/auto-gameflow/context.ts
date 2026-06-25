import type { AkariIpcMain } from '../ipc'
import type { LeagueClientMain } from '../league-client'
import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'
import type { SetterSettingService } from '../setting-factory/setter-setting-service'
import type { AutoGameflowSettings, AutoGameflowState } from './state'

export const AUTO_GAMEFLOW_MAIN_NAMESPACE = 'auto-gameflow-main'
export const AUTO_GAMEFLOW_HONOR_CATEGORY = ['HEART'] as const

export const AUTO_GAMEFLOW_PLAY_AGAIN_WAIT_FOR_BALLOT_TIMEOUT = 3250
export const AUTO_GAMEFLOW_PLAY_AGAIN_WAIT_FOR_STATS_TIMEOUT = 10000
export const AUTO_GAMEFLOW_PLAY_AGAIN_BUFFER_TIMEOUT = 1575

export interface AutoGameflowMainContext {
  namespace: string
  settings: AutoGameflowSettings
  state: AutoGameflowState
  logger: AkariLogger
  settingService: SetterSettingService<AutoGameflowSettings>
  leagueClient: LeagueClientMain
  mobxUtils: MobxUtilsMain
  ipc: AkariIpcMain
}
