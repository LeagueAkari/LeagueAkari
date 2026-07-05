import type {
  OngoingGamePanelMatchHistory,
  OngoingGamePanelPositionAssignment,
  OngoingGamePanelSummonerSpellSelection
} from '@renderer-shared/providers/ongoing-game/types'
import type { AggregatedAnalysis } from '@shared/data-adapter/analysis/player'
import type { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import type { OngoingGamePanelPlayerCardTagSettings } from '@shared/shards/ongoing-game/settings'
import type { SavedInfo } from '@shared/shards/saved-player'
import type { SummonerInfo } from '@shared/types/league-client/summoner'
import type { TFunction } from 'i18next'
import type { VNode } from 'vue'

export interface PlayerCardTagContext {
  puuid: string
  selfPuuid: string | null
  settings: OngoingGamePanelPlayerCardTagSettings
  analysis: AggregatedAnalysis | null
  summoners: Record<string, SummonerInfo>
  savedInfo: SavedInfo | null
  matchHistory: Record<string, OngoingGamePanelMatchHistory>
  premadeTeamId?: string
  positionAssignment?: OngoingGamePanelPositionAssignment
  spells?: OngoingGamePanelSummonerSpellSelection
  cachedGames: Record<number, LcuOrSgpGameSummary>
  isStandaloneOngoingGameWindow: boolean
  locale: string
  t: TFunction
  masked: (text: string, replacement?: string) => string
  navigateToSummonerByPuuid: (puuid: string) => void
  previewEncounteredGame: (gameId: number) => void
}

export interface PlayerCardTagPopover {
  content: VNode
  delay?: number
  keepAliveOnHover?: boolean
  scrollable?: boolean
  maxHeight?: number
}

export interface PlayerCardTagRenderResult {
  label: VNode
  popover?: PlayerCardTagPopover
}

export interface PlayerCardTagDefinition {
  id: string
  render: (ctx: PlayerCardTagContext) => PlayerCardTagRenderResult | null
}

export interface PlayerCardTagView extends PlayerCardTagRenderResult {
  id: string
}
