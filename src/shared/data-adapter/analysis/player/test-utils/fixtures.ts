import {
  API_QUEUE_FIXTURES,
  readLcuMatchHistoryGameFixture,
  readLcuMatchHistoryTimelineFixture,
  readLcuMatchHistoryFixture as readRawLcuMatchHistoryFixture,
  readSgpMatchHistoryQueryFixture
} from '@shared/test-fixtures/api'
import type { Game, GameTimeline, MatchHistory } from '@shared/types/league-client/match-history'
import type { SgpGameSummaryLol, SgpMatchHistoryLol } from '@shared/types/sgp/match-history'

import type {
  LcuGameSummary,
  LcuGameTimeline,
  LcuOrSgpGameSummary,
  SgpGameSummary
} from '../../../wrapper'

export const SGP_QUEUE_FIXTURES = API_QUEUE_FIXTURES
export const LCU_GAME_FIXTURES = API_QUEUE_FIXTURES

export function readSgpMatchHistoryFixture(name: string): SgpMatchHistoryLol {
  return readSgpMatchHistoryQueryFixture(name)
}

export function readLcuMatchHistoryFixture(): MatchHistory {
  return readRawLcuMatchHistoryFixture()
}

export function readLcuGameFixture(name: string): Game {
  return readLcuMatchHistoryGameFixture(name)
}

export function readLcuTimelineFixture(name: string): GameTimeline {
  return readLcuMatchHistoryTimelineFixture(name)
}

export function getSgpGames(data: SgpMatchHistoryLol): SgpGameSummaryLol[] {
  return data.games
}

export function getOnlySgpGame(name: string): SgpGameSummaryLol {
  const games = getSgpGames(readSgpMatchHistoryFixture(name))

  if (games.length !== 1) {
    throw new Error(`Expected fixture ${name} to contain exactly 1 SGP game, got ${games.length}`)
  }

  return games[0]
}

export function wrapSgpSummary(game: SgpGameSummaryLol): SgpGameSummary {
  return {
    gameId: game.json.gameId,
    source: 'sgp',
    data: game
  }
}

export function wrapLcuGame(game: Game): LcuGameSummary {
  return {
    gameId: game.gameId,
    source: 'lcu',
    data: game
  }
}

export function wrapLcuTimeline(gameId: number, data: GameTimeline): LcuGameTimeline {
  return {
    gameId,
    source: 'lcu',
    data
  }
}

export function wrapSummary(game: Game | SgpGameSummaryLol): LcuOrSgpGameSummary {
  if ('json' in game) {
    return wrapSgpSummary(game)
  }

  return wrapLcuGame(game)
}
