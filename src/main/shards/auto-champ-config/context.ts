import type { AkariIpcMain } from '../ipc'
import type { LeagueClientMain } from '../league-client'
import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'
import type { SetterSettingService } from '../setting-factory/setter-setting-service'
import type { AutoChampConfigSettings } from './state'

export const AUTO_CHAMP_CONFIG_MAIN_NAMESPACE = 'auto-champ-config-main'

export { GAME_MODE_TYPE_MAP } from '@shared/shards/auto-champ-config/preset'
export interface ChampionConfigMeta {
  championId: number
  position: string
}

export interface AutoChampionConfigMainContext {
  namespace: string
  ipc: AkariIpcMain
  leagueClient: LeagueClientMain
  logger: AkariLogger
  mobxUtils: MobxUtilsMain
  settings: AutoChampConfigSettings
  settingService: SetterSettingService
}
