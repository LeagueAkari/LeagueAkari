import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'
import type { StorageState } from './state'

export const STORAGE_MAIN_NAMESPACE = 'storage-main'
export const LEAGUE_AKARI_DB_CURRENT_VERSION = 15
export const LEAGUE_AKARI_DB_FILENAME = 'LeagueAkari.db'

export interface StorageMainContext {
  namespace: string
  logger: AkariLogger
  mobxUtils: MobxUtilsMain
  state: StorageState
}
