import {
  CHAMPION_DATA_OPGG_FEATURE_GATE,
  CHAMPION_DATA_QQ101_FEATURE_GATE
} from '@shared/types/champion-data'

import type { FeatureGatingMain } from '../feature-gating'
import type { AkariLogger } from '../logger-factory'
import type { SetterSettingService } from '../setting-factory/setter-setting-service'
import type { ChampionDataSettings, OpggChampionDataState } from './state'

export const OPGG_ARAM_BALANCE_UPDATE_INTERVAL = 30 * 60 * 1000

export const CHAMPION_DATA_MAIN_NAMESPACE = 'champion-data-main'
export const CHAMPION_DATA_OPGG_NAMESPACE = `${CHAMPION_DATA_MAIN_NAMESPACE}/opgg`
export { CHAMPION_DATA_OPGG_FEATURE_GATE, CHAMPION_DATA_QQ101_FEATURE_GATE }

export interface ChampionDataMainContext {
  namespace: string
  featureGating: FeatureGatingMain
  logger: AkariLogger
  settingService: SetterSettingService<ChampionDataSettings>
}

export interface OpggResourceContext {
  state: OpggChampionDataState
  logger: AkariLogger
}
