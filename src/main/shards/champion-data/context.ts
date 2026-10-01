import {
  CHAMPION_DATA_OPGG_FEATURE_GATE,
  CHAMPION_DATA_QQ101_FEATURE_GATE
} from '@shared/types/champion-data'
import type {
  OpggAramChampionDetailsResponse,
  OpggAramChampionsResponse,
  OpggAramMayhemChampionAugmentsResponse,
  OpggAramMayhemTier,
  OpggAramMayhemTiersResponse,
  OpggArenaChampionDetailsResponse,
  OpggArenaChampionsResponse,
  OpggNexusBlitzChampionDetailsResponse,
  OpggNexusBlitzChampionsResponse,
  OpggRankedChampionDetailsResponse,
  OpggRankedChampionsResponse,
  OpggRegion,
  OpggTierFilter,
  OpggUrfChampionDetailsResponse,
  OpggUrfChampionsResponse
} from '@shared/types/opgg'

import type { ExtraAssetsMain } from '../extra-assets'
import type { FeatureGatingMain } from '../feature-gating'
import type { LeagueClientMain } from '../league-client'
import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'
import type { SetterSettingService } from '../setting-factory/setter-setting-service'
import type { WindowManagerMain } from '../window-manager'
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

export interface OpggChampionDataMainContext extends ChampionDataMainContext {
  settings: ChampionDataSettings
  state: OpggChampionDataState
  leagueClient: LeagueClientMain
  extraAssets: ExtraAssetsMain
  mobxUtils: MobxUtilsMain
  windowManager: WindowManagerMain
}

interface OpggVersionedOverviewTarget {
  region: OpggRegion
  version: string
}

interface OpggTieredOverviewTarget extends OpggVersionedOverviewTarget {
  tier: OpggTierFilter
}

export type OpggOverviewTarget =
  | (OpggTieredOverviewTarget & { mode: 'ranked' | 'aram' | 'nexus_blitz' | 'urf' })
  | (OpggVersionedOverviewTarget & { mode: 'arena' })
  | { mode: 'aram_mayhem' }

export interface OpggResolvedTarget {
  target: OpggOverviewTarget
  versions: string[]
  requestedVersion: string | null
}

export type OpggLoadedOverview =
  | (OpggTieredOverviewTarget & {
      mode: 'ranked'
      response: OpggRankedChampionsResponse
    })
  | (OpggTieredOverviewTarget & {
      mode: 'aram'
      response: OpggAramChampionsResponse
    })
  | (OpggTieredOverviewTarget & {
      mode: 'nexus_blitz'
      response: OpggNexusBlitzChampionsResponse
    })
  | (OpggTieredOverviewTarget & {
      mode: 'urf'
      response: OpggUrfChampionsResponse
    })
  | (OpggVersionedOverviewTarget & {
      mode: 'arena'
      response: OpggArenaChampionsResponse
    })
  | {
      mode: 'aram_mayhem'
      response: OpggAramMayhemTiersResponse
    }

export type OpggLoadedChampion =
  | {
      mode: 'ranked'
      response: OpggRankedChampionDetailsResponse
    }
  | {
      mode: 'aram'
      response: OpggAramChampionDetailsResponse
    }
  | {
      mode: 'nexus_blitz'
      response: OpggNexusBlitzChampionDetailsResponse
    }
  | {
      mode: 'urf'
      response: OpggUrfChampionDetailsResponse
    }
  | {
      mode: 'arena'
      response: OpggArenaChampionDetailsResponse
    }
  | {
      mode: 'aram_mayhem'
      summary: OpggAramMayhemTier
      response: OpggAramMayhemChampionAugmentsResponse
    }
