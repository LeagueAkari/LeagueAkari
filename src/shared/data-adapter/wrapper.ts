import { Game, GameTimeline, MatchHistory } from '@shared/types/league-client/match-history'
import {
  SgpGameDetailsLol,
  SgpGameSummaryLol,
  SgpMatchHistoryLol
} from '@shared/types/sgp/match-history'

export type LcuGameSummary = {
  gameId: number
  source: 'lcu'
  data: Game
}

export type SgpGameSummary = {
  gameId: number
  source: 'sgp'
  data: SgpGameSummaryLol
}

export type LcuOrSgpGameSummary = LcuGameSummary | SgpGameSummary

export type LcuGameTimeline = {
  gameId: number
  source: 'lcu'
  data: GameTimeline
}

export type SgpGameDetails = {
  gameId: number
  source: 'sgp'
  data: SgpGameDetailsLol
}

export type LcuOrSgpGameDetails = LcuGameTimeline | SgpGameDetails

export type LcuMatchHistory = {
  source: 'lcu'
  data: MatchHistory
}

export type SgpMatchHistory = {
  source: 'sgp'
  data: SgpMatchHistoryLol
}

export type LcuOrSgpMatchHistory = LcuMatchHistory | SgpMatchHistory
