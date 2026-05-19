import { AggregatedAnalysis } from '@shared/data-adapter/analysis/player'
import { AggregatedTeamAnalysis } from '@shared/data-adapter/analysis/team'
import { ParsedRole } from '@shared/utils/ranked'

export interface OngoingGameAnalysis {
  players: Record<string, AggregatedAnalysis>
  teams: Record<string, AggregatedTeamAnalysis>
}

export interface OngoingGameSimplifiedChampMastery {
  championId: number
  championLevel: number
  championPoints: number
  championSeasonMilestone: number
  highestGrade: string
  lastPlayTime: number
}

export interface AdditionalResult {
  teams: Record<string, string[]>
  selections: Record<string, number>
  teamParticipantGroups: Record<string, number>
  spells: Record<string, { spell1Id: number; spell2Id: number }>
  positions: Record<string, { position: string; role: ParsedRole | null }>
}

interface QueryStageGameInfo {
  queueId: number
  queueType: string
  gameMode: string
  gameId: number
}

export interface QueryStageChampSelect {
  phase: 'champ-select'
  gameInfo: QueryStageGameInfo
}

export interface QueryStageInGame {
  phase: 'in-game'
  gameInfo: QueryStageGameInfo
}

export interface QueryStageLobby {
  phase: 'lobby'
  gameInfo: {
    queueId: number
    queueType: string
  }
}

export interface QueryStageDraft {
  phase: 'draft'
  gameInfo: {
    queueId: number
    queueType: string
  }
}

export interface QueryStageUnavailable {
  phase: 'unavailable'
  gameInfo: null
}

export type QueryStage =
  | QueryStageChampSelect
  | QueryStageLobby
  | QueryStageInGame
  | QueryStageLobby
  | QueryStageUnavailable
  | QueryStageDraft

export interface DraftOptions {
  gameModeKind: 'cherry' | 'normal'
  queueId: number
  puuid: string | null
  teams: Record<string, string[]>
  championSelections: Record<string, number>
  positions: Record<
    string,
    {
      selected: string
      primary: string
      secondary: string
    }
  > | null
}
