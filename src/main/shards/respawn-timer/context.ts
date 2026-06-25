import type { GameClientMain } from '../game-client'
import type { LeagueClientMain } from '../league-client'
import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'
import type { SetterSettingService } from '../setting-factory/setter-setting-service'
import type { RespawnTimerSettings, RespawnTimerState } from './state'

export const RESPAWN_TIMER_MAIN_NAMESPACE = 'respawn-timer-main'
export const RESPAWN_TIMER_POLL_INTERVAL = 1000

export interface RespawnTimerMainContext {
  namespace: string
  gameClient: GameClientMain
  leagueClient: LeagueClientMain
  logger: AkariLogger
  mobxUtils: MobxUtilsMain
  settings: RespawnTimerSettings
  settingService: SetterSettingService<RespawnTimerSettings>
  state: RespawnTimerState
}
