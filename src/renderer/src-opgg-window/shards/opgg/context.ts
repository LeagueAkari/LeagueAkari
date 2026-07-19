import type { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import type { LoggerRenderer } from '@renderer-shared/shards/logger'
import type { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import type { ModeType, PositionType, RegionType, TierType } from '@shared/types/opgg'
import type { AxiosInstance } from 'axios'

export const OPGG_RENDERER_NAMESPACE = 'opgg-renderer'

export interface OpggRendererContext {
  settingUtils: SettingUtilsRenderer
  leagueClient: LeagueClientRenderer
  logger: LoggerRenderer
  httpClient: AxiosInstance
}

export type OpggPreferenceUpdate = Partial<{
  flashPosition: 'auto' | 'd' | 'f'
  mode: ModeType
  position: PositionType
  region: RegionType
  tier: TierType
}>
