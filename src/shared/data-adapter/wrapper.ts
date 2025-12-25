import { Game, GameTimeline, MatchHistory } from '@shared/types/league-client/match-history'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import {
  SgpGameDetailsLol,
  SgpGameSummaryLol,
  SgpMatchHistoryLol
} from '@shared/types/sgp/match-history'
import { SgpSummonerLol } from '@shared/types/sgp/summoner'

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

export type LcuSummoner = {
  source: 'lcu'
  puuid: string
  data: SummonerInfo
}

export type SgpSummoner = {
  source: 'sgp'
  puuid: string
  data: SgpSummonerLol
}
export type SgpOrLcuSummoner = SgpSummoner | LcuSummoner
