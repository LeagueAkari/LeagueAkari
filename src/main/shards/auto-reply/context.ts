import type { AkariIpcMain } from '../ipc'
import type { LeagueClientMain } from '../league-client'
import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'
import type { SetterSettingService } from '../setting-factory/setter-setting-service'
import type { AutoReplySettings } from './state'

export const AUTO_REPLY_MAIN_NAMESPACE = 'auto-reply-main'

export interface AutoReplyMainContext {
  namespace: string
  ipc: AkariIpcMain
  leagueClient: LeagueClientMain
  logger: AkariLogger
  mobxUtils: MobxUtilsMain
  settings: AutoReplySettings
  settingService: SetterSettingService
}
