import type { AkariIpcMain } from '../ipc'
import type { LeagueClientMain } from '../league-client'
import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'
import type { AutoMiscSettings } from './state'

export const AUTO_MISC_MAIN_NAMESPACE = 'auto-misc-main'

export const AUTO_MISC_SETTING_KEYS = [
  'autoReplyEnabled',
  'autoReplyEnableOnAway',
  'autoReplyText',
  'lockOfflineStatus',
  'autoSetStatusMessageEnabled',
  'statusMessage',
  'autoSetRankedStatusEnabled',
  'rankedStatus'
] as const

export interface AutoMiscMainContext {
  namespace: string
  settings: AutoMiscSettings
  logger: AkariLogger
  leagueClient: LeagueClientMain
  mobxUtils: MobxUtilsMain
  ipc: AkariIpcMain
}
