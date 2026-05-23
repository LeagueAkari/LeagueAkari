import type { ClientInstallationMain } from '../client-installation'
import type { AkariIpcMain } from '../ipc'
import type { KeyboardShortcutsMain } from '../keyboard-shortcuts'
import type { LeagueClientMain } from '../league-client'
import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'
import type { SetterSettingService } from '../setting-factory/setter-setting-service'
import type { GameClientMain } from './index'
import type { GameClientSettings } from './state'

export const GAME_CLIENT_MAIN_NAMESPACE = 'game-client-main'
export const GAME_CLIENT_PROCESS_NAME = 'League of Legends.exe'
export const GAME_CLIENT_BASE_URL = 'https://127.0.0.1:2999'
export const TERMINATE_GAME_CLIENT_SHORTCUT_TARGET_ID = `${GAME_CLIENT_MAIN_NAMESPACE}/terminate-game-client`

export type SettingsFileMode = 'readonly' | 'writable'

export interface GameClientMainContext {
  namespace: string
  clientInstallation: ClientInstallationMain
  gameClient: GameClientMain
  keyboardShortcuts: KeyboardShortcutsMain
  leagueClient: LeagueClientMain
  logger: AkariLogger
  mobxUtils: MobxUtilsMain
  ipc: AkariIpcMain
  settings: GameClientSettings
  settingService: SetterSettingService
}
