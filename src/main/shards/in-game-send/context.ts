import type { SharedGlobalShard } from '@shared/akari-shard'

import type { AppCommonMain } from '../app-common'
import type { AkariIpcMain } from '../ipc'
import type { KeyboardShortcutsMain } from '../keyboard-shortcuts'
import type { LeagueClientMain } from '../league-client'
import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'
import type { OngoingGameMain } from '../ongoing-game'
import type { RemoteConfigMain } from '../remote-config'
import type { SetterSettingService } from '../setting-factory/setter-setting-service'
import type { InGameSendSettings, InGameSendState } from './state'

export const IN_GAME_SEND_MAIN_NAMESPACE = 'in-game-send-main'
export const IN_GAME_SEND_ENTER_KEY_CODE = 13
export const IN_GAME_SEND_ENTER_KEY_INTERNAL_DELAY = 20

export interface InGameSendMainContext {
  namespace: string
  settings: InGameSendSettings
  state: InGameSendState
  logger: AkariLogger
  settingService: SetterSettingService
  mobxUtils: MobxUtilsMain
  ipc: AkariIpcMain
  keyboardShortcuts: KeyboardShortcutsMain
  ongoingGame: OngoingGameMain
  leagueClient: LeagueClientMain
  shared: SharedGlobalShard
  appCommon: AppCommonMain
  remoteConfig: RemoteConfigMain

  isGameClientForeground(): Promise<boolean>
}
