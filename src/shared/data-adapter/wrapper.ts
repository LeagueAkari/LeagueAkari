import { Game, GameTimeline, MatchHistory } from '@shared/types/league-client/match-history'
import {
  SgpGameDetailsLol,
  SgpGameSummaryLol,
  SgpMatchHistoryLol
} from '@shared/types/sgp/match-history'

export type LcuOrSgpGameSummary =
  | {
      source: 'lcu'
      data: Game
    }
  | {
      source: 'sgp'
      data: SgpGameSummaryLol
    }

export type LcuOrSgpGameDetails =
  | {
      source: 'lcu'
      data: GameTimeline
    }
  | {
      source: 'sgp'
      data: SgpGameDetailsLol
    }

export type LcuOrSgpMatchHistory =
  | {
      source: 'lcu'
      data: MatchHistory
    }
  | {
      source: 'sgp'
      data: SgpMatchHistoryLol
    }
