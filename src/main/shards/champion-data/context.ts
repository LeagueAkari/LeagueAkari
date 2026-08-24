import type {
  ChampionDataDetails,
  ChampionDataLoadResult,
  ChampionDataOverview,
  ChampionDataQuery,
  ChampionDataSourceId
} from '@shared/data-adapter/champion-data'

import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'
import type { SetterSettingService } from '../setting-factory/setter-setting-service'
import type { ChampionDataSettings, ChampionDataState } from './state'

export const CHAMPION_DATA_MAIN_NAMESPACE = 'champion-data-main'
export const CHAMPION_DATA_OPGG_FEATURE_GATE = 'champion-data.source.opgg'
export const CHAMPION_DATA_QQ101_FEATURE_GATE = 'champion-data.source.qq101'

export function resolveChampionDataSourceGateAvailability(options: {
  opggConfigured: boolean
  qq101Configured: boolean
  opggEnabled: boolean
  qq101Enabled: boolean
}) {
  if (!options.opggConfigured && !options.qq101Configured) {
    return { opgg: true, qq101: false }
  }
  return { opgg: options.opggEnabled, qq101: options.qq101Enabled }
}

export interface ChampionDataSourceLoader {
  loadOverview(
    source: ChampionDataSourceId,
    query: ChampionDataQuery
  ): Promise<ChampionDataOverview>
  loadDetails(
    source: ChampionDataSourceId,
    query: ChampionDataQuery,
    championId: number
  ): Promise<ChampionDataDetails | null>
}

export interface ChampionDataService {
  loadOverview(query: ChampionDataQuery): Promise<ChampionDataLoadResult<ChampionDataOverview>>
  loadDetails(
    query: ChampionDataQuery,
    championId: number
  ): Promise<ChampionDataLoadResult<ChampionDataDetails>>
}

export interface ChampionDataMainContext {
  namespace: string
  logger: AkariLogger
  mobxUtils: MobxUtilsMain
  settings: ChampionDataSettings
  state: ChampionDataState
  settingService: SetterSettingService<ChampionDataSettings>
}
