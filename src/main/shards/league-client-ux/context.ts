import type { AkariIpcMain } from '../ipc'
import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'
import type { SetterSettingService } from '../setting-factory/setter-setting-service'
import { getConnectedClientCommandLinePollInterval } from './platform'
import type { LeagueClientUxSettings, LeagueClientUxState } from './state'

export const LEAGUE_CLIENT_UX_MAIN_NAMESPACE = 'league-client-ux-main'
export const LEAGUE_CLIENT_UX_PROCESS_NAME =
  process.platform === 'win32' ? 'LeagueClientUx.exe' : 'LeagueClientUx'
export const CLIENT_CMD_DEFAULT_POLL_INTERVAL = 2000
export const CLIENT_CMD_LONG_POLL_INTERVAL = getConnectedClientCommandLinePollInterval()

export interface LeagueClientUxMainContext {
  namespace: string
  ipc: AkariIpcMain
  logger: AkariLogger
  mobxUtils: MobxUtilsMain
  settings: LeagueClientUxSettings
  settingService: SetterSettingService
  state: LeagueClientUxState
}
