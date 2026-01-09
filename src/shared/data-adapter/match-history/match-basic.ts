import { LcuOrSgpGameSummary } from '../wrapper'

export type MatchBasicInfo = {
  dataSource: LcuOrSgpGameSummary['source']
  gameVersion: string
  gameId: number
  isTwoTeam: boolean
  isCherrySubteam: boolean
  endOfGameResult?: string
  gameCreation: number
  gameDuration: number
  gameType: string
  queueId: number
  gameMode: string
  mapId: number
  gameModeMutators: string[] | null
}

export function toBasicInfo(summary: LcuOrSgpGameSummary): MatchBasicInfo {
  const { source, data } = summary

  if (source === 'sgp') {
    if (!data.json) {
      throw new Error(`SGP game summary data is not valid: ${summary.gameId}`)
    }

    return {
      dataSource: source,
      gameVersion: data.json.gameVersion,
      gameId: data.json.gameId,
      isTwoTeam: data.json.gameMode !== 'CHERRY',
      isCherrySubteam: data.json.gameMode === 'CHERRY',
      endOfGameResult: data.json.endOfGameResult,
      gameCreation: data.json.gameCreation,
      gameDuration: data.json.gameDuration,
      gameType: data.json.gameType,
      queueId: data.json.queueId,
      gameMode: data.json.gameMode,
      mapId: data.json.mapId,
      gameModeMutators: data.json.gameModeMutators ?? null
    }
  }

  return {
    dataSource: source,
    gameVersion: data.gameVersion,
    gameId: data.gameId,
    isTwoTeam: data.gameMode !== 'CHERRY',
    isCherrySubteam: data.gameMode === 'CHERRY',
    endOfGameResult: data.endOfGameResult,
    gameCreation: data.gameCreation,
    gameDuration: data.gameDuration,
    gameType: data.gameType,
    queueId: data.queueId,
    gameMode: data.gameMode,
    mapId: data.mapId,
    gameModeMutators: data.gameModeMutators ?? null
  }
}
