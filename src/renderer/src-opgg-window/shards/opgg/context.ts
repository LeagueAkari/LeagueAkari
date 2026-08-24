import type { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import type { LoggerRenderer } from '@renderer-shared/shards/logger'
import type { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import type { ModeType, PositionType, RegionType, TierType } from '@shared/types/opgg'

export const OPGG_RENDERER_NAMESPACE = 'opgg-renderer'

export interface OpggRendererContext {
  settingUtils: SettingUtilsRenderer
  leagueClient: LeagueClientRenderer
  logger: LoggerRenderer
}

export type OpggPreferenceUpdate = Partial<{
  flashPosition: 'auto' | 'd' | 'f'
  mode: ModeType
  position: PositionType
  region: RegionType
  tier: TierType
}>
