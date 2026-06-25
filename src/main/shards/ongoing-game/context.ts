import type { QueueKeeper } from '@shared/utils/queue-keeper'

import type { AkariIpcMain } from '../ipc'
import type { LeagueClientMain } from '../league-client'
import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'
import type { RemoteConfigMain } from '../remote-config'
import type { SavedPlayerMain } from '../saved-player'
import type { SetterSettingService } from '../setting-factory/setter-setting-service'
import type { SgpMain } from '../sgp'
import type { OngoingGameSettings, OngoingGameState } from './state'

export const ONGOING_GAME_MAIN_NAMESPACE = 'ongoing-game-main'

export const ONGOING_GAME_LOADING_PRIORITY = {
  ADDITIONAL_INFO: 50,
  ADDITIONAL_SUMMONER: -1,
  SUMMONER: 30,
  MATCH_HISTORY: 25,
  SAVED_INFO: 20,
  RANKED_STATS: 15,
  CHAMPION_MASTERY: 10,
  GAME_DETAILS_JUNGLE: 10,
  GAME_DETAILS: 5
}

export interface OngoingGameMainContext {
  namespace: string
  settings: OngoingGameSettings
  state: OngoingGameState
  queueKeeper: QueueKeeper
  logger: AkariLogger
  ipc: AkariIpcMain
  mobxUtils: MobxUtilsMain
  settingService: SetterSettingService<OngoingGameSettings>
  leagueClient: LeagueClientMain
  sgp: SgpMain
  savedPlayer: SavedPlayerMain
  remoteConfig: RemoteConfigMain
}
