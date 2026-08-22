import type { MatchBasicInfo } from '@shared/data-adapter/match-history/match-basic'
import type { MatchParticipant } from '@shared/data-adapter/match-history/participants'
import type { LcuOrSgpGameDetails, LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import type {
  DraftOptions,
  OngoingGameAnalysis,
  OngoingGamePanelSettings,
  OngoingGamePlayerReloadOptions,
  OngoingGamePositionAssignment,
  OngoingGameSimplifiedChampMastery,
  QueryStage
} from '@shared/shards/ongoing-game'
import type { SavedInfo } from '@shared/shards/saved-player'
import type { RankedStats } from '@shared/types/league-client/ranked'
import type { SummonerInfo } from '@shared/types/league-client/summoner'

export type OngoingGamePanelPositionAssignment = OngoingGamePositionAssignment

export interface OngoingGamePanelSummonerSpellSelection {
  spell1Id: number
  spell2Id: number
}

export interface OngoingGamePanelMatchHistory {
  data: LcuOrSgpGameSummary[]
}

export interface OngoingGamePanelMatchHistoryView {
  gameId: number
  basicInfo: Pick<MatchBasicInfo, 'gameMode' | 'queueId' | 'gameCreation'>
  participant: Pick<
    MatchParticipant,
    'championId' | 'kills' | 'deaths' | 'assists' | 'winResult' | 'subteamPlacement'
  >
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
  readonly matchHistoryViews?: Record<string, OngoingGamePanelMatchHistoryView[]>
  readonly matchHistoryLoadingState: Record<string, string>

  readonly spells: Record<string, OngoingGamePanelSummonerSpellSelection>
  readonly isConnected: boolean
  readonly isSpectating: boolean
  readonly streamerMode: boolean
  readonly selfPuuid: string | null

  reloadPlayer(puuid: string, options?: OngoingGamePlayerReloadOptions): void
}
