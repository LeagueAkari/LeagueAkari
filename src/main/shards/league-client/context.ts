import type { AkariIpcMain } from '../ipc'
import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'
import type { LeagueClientMain } from './index'

export const LEAGUE_CLIENT_MAIN_NAMESPACE = 'league-client-main'

export interface LeagueClientMainContext {
  namespace: string
  mobxUtils: MobxUtilsMain
  ipc: AkariIpcMain
  logger: AkariLogger
  leagueClient: LeagueClientMain
}

export class LeagueClientLcuUninitializedError extends Error {
  name = 'LeagueClientLcuUninitializedError'
}
