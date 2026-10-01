import type { AkariProtocolMain } from '../akari-protocol'
import type { AkariIpcMain } from '../ipc'
import type { LeagueClientUxMain } from '../league-client-ux'
import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'
import type { SetterSettingService } from '../setting-factory/setter-setting-service'
import type { LeagueClientMain } from './index'
import type { LeagueClientSettings, LeagueClientState } from './state'

export const LEAGUE_CLIENT_MAIN_NAMESPACE = 'league-client-main'

export const LEAGUE_CLIENT_CONNECT_RETRY_INTERVAL = 2000
export const LEAGUE_CLIENT_HTTP_PING_URL = '/riotclient/auth-token'
export const LEAGUE_CLIENT_REQUEST_TIMEOUT_MS = 17500
export const LEAGUE_CLIENT_ITEM_SET_PREFIX = 'akari1'
export const LEAGUE_CLIENT_PROCESS_NAME = 'LeagueClient.exe'

export interface LeagueClientMainContext {
  state: LeagueClientState
  settings: LeagueClientSettings
  settingService: SetterSettingService
  leagueClientUx: LeagueClientUxMain
  protocol: AkariProtocolMain
  namespace: string
  mobxUtils: MobxUtilsMain
  ipc: AkariIpcMain
  logger: AkariLogger
  leagueClient: LeagueClientMain
}

export class LeagueClientLcuUninitializedError extends Error {
  name = 'LeagueClientLcuUninitializedError'
}
