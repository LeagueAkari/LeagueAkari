import type { LcuOrSgpGameDetails, LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import type {
  DraftOptions,
  OngoingGameAnalysis,
  OngoingGamePanelSettings,
  OngoingGameSimplifiedChampMastery,
  QueryStage
} from '@shared/shards/ongoing-game'
import type { SavedInfo } from '@shared/shards/saved-player'
import type { RankedStats } from '@shared/types/league-client/ranked'
import type { SummonerInfo } from '@shared/types/league-client/summoner'
import type { ParsedRole } from '@shared/utils/ranked'

export interface OngoingGamePanelPositionAssignment {
  position: string
  role: ParsedRole | null
}

export interface OngoingGamePanelSummonerSpellSelection {
  spell1Id: number
  spell2Id: number
}

export interface OngoingGamePanelMatchHistory {
  data: LcuOrSgpGameSummary[]
}

export interface OngoingGameProviderValue {
  readonly settings: OngoingGamePanelSettings
  readonly queryStage: QueryStage
  readonly draft: DraftOptions | null
  readonly teams: Record<string, string[]>
  readonly championSelections: Record<string, number>
  readonly positionAssignments: Record<string, OngoingGamePanelPositionAssignment>
  readonly mergedPremadeTeamMap: Record<string, number>
  readonly analysis: OngoingGameAnalysis | null

  readonly summoner: Record<string, SummonerInfo>
  readonly rankedStats: Record<string, RankedStats>
  readonly championMastery: Record<string, Record<number, OngoingGameSimplifiedChampMastery>>
  readonly savedInfo: Record<string, SavedInfo>

  readonly cachedGames: Record<number, LcuOrSgpGameSummary>
  readonly gameDetails: Record<number, LcuOrSgpGameDetails>
  readonly matchHistory: Record<string, OngoingGamePanelMatchHistory>
  readonly matchHistoryLoadingState: Record<string, string>

  readonly spells: Record<string, OngoingGamePanelSummonerSpellSelection>
  readonly isConnected: boolean
  readonly isSpectating: boolean
  readonly streamerMode: boolean
  readonly selfPuuid: string | null

  reloadPlayer(puuid: string): void
}
