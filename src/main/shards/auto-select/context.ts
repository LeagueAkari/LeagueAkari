import type { AkariIpcMain } from '../ipc'
import type { LeagueClientMain } from '../league-client'
import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'
import type { SetterSettingService } from '../setting-factory/setter-setting-service'
import type { AutoSelectSettings, AutoSelectState } from './state'

export const AUTO_SELECT_MAIN_NAMESPACE = 'auto-select-main'

export interface AutoSelectMainContext {
  namespace: string
  settings: AutoSelectSettings
  state: AutoSelectState
  logger: AkariLogger
  settingService: SetterSettingService
  leagueClient: LeagueClientMain
  mobxUtils: MobxUtilsMain
  ipc: AkariIpcMain
}
