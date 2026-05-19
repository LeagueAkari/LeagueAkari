import type { Game, GameTimeline, MatchHistory } from '@shared/types/league-client/match-history'
import type { SgpMatchHistoryLol } from '@shared/types/sgp/match-history'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const DEFAULT_API_FIXTURE_SNAPSHOT_ID = '2026-05-16-tencent-hn10'

export const API_QUEUE_FIXTURES = [
  ['q_420', 420],
  ['q_430', 430],
  ['q_440', 440],
  ['q_450', 450],
  ['q_480', 480],
  ['q_900', 900],
  ['q_1700', 1700],
  ['q_1750', 1750],
  ['q_2300', 2300],
  ['q_2400', 2400],
  ['q_4210', 4210],
  ['q_4220', 4220],
  ['q_4240', 4240],
  ['q_4250', 4250],
  ['q_4260', 4260]
] as const

export const SGP_MATCH_HISTORY_QUERY_FIXTURES = [
  'all',
  'ranked',
  'normal',
  ...API_QUEUE_FIXTURES.map(([name]) => name)
] as const

export interface ApiFixtureManifest {
  schemaVersion: number
  id: string
  capturedDate: string
  timezone: string
  environment: {
    server: string
    regionFamily: string
    note: string
  }
  players: Array<{
    gameName: string
    tagLine: string
    puuid: string
    purpose: string
  }>
  sgp: {
    matchHistoryQuery: {
      path: string
      endpoint: string
      fixtures: string[]
      missingQueuesSearched: number[]
    }
  }
  lcu: {
    matchHistory: {
      path: string
      currentSummonerMatches: string
      gameFixtures: string[]
      timelineFixtures: string[]
    }
  }
}

function getSnapshotRoot(snapshotId = DEFAULT_API_FIXTURE_SNAPSHOT_ID) {
  return join(__dirname, 'snapshots', snapshotId)
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

export function readApiFixtureManifest(
  snapshotId = DEFAULT_API_FIXTURE_SNAPSHOT_ID
): ApiFixtureManifest {
  return readJson<ApiFixtureManifest>(join(getSnapshotRoot(snapshotId), 'manifest.json'))
}

export function readSgpMatchHistoryQueryFixture(
  name: string,
  snapshotId = DEFAULT_API_FIXTURE_SNAPSHOT_ID
): SgpMatchHistoryLol {
  return readJson<SgpMatchHistoryLol>(
    join(getSnapshotRoot(snapshotId), 'sgp', 'match-history-query', `${name}.json`)
  )
}

export function readLcuMatchHistoryFixture(
  snapshotId = DEFAULT_API_FIXTURE_SNAPSHOT_ID
): MatchHistory {
  return readJson<MatchHistory>(
    join(getSnapshotRoot(snapshotId), 'lcu', 'match-history', 'current-summoner-matches.json')
  )
}

export function readLcuMatchHistoryGameFixture(
  name: string,
  snapshotId = DEFAULT_API_FIXTURE_SNAPSHOT_ID
): Game {
  return readJson<Game>(
    join(getSnapshotRoot(snapshotId), 'lcu', 'match-history', 'games', `${name}.json`)
  )
}

export function readLcuMatchHistoryTimelineFixture(
  name: string,
  snapshotId = DEFAULT_API_FIXTURE_SNAPSHOT_ID
): GameTimeline {
  return readJson<GameTimeline>(
    join(getSnapshotRoot(snapshotId), 'lcu', 'match-history', 'timelines', `${name}.json`)
  )
}
