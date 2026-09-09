import type { AppCommonMain } from '../app-common'
import type { LeagueClientMain } from '../league-client'
import type { AkariLogger } from '../logger-factory'
import type { OngoingGameMain } from '../ongoing-game'
import type { RiotClientMain } from '../riot-client'
import type { SetterSettingService } from '../setting-factory/setter-setting-service'
import type { SgpMain } from '../sgp'
import type { LanWebSettings, LanWebState } from './state'

export interface LanWebMainContext {
  namespace: string
  logger: AkariLogger
  settings: LanWebSettings
  state: LanWebState
  settingService: SetterSettingService<LanWebSettings>
  appCommon: AppCommonMain
  leagueClient: LeagueClientMain
  riotClient: RiotClientMain
  sgp: SgpMain
  ongoingGame: OngoingGameMain
}
