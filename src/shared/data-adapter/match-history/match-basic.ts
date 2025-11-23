import { LcuOrSgpGameSummary } from '../wrapper'
import { MatchBasicInfo } from './types'

export function toBasicInfo(summary: LcuOrSgpGameSummary): MatchBasicInfo {
  const { source, data } = summary

  if (source === 'sgp') {
    return {
      dataSource: source,
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
      gameModeMutators: data.json.gameModeMutators
    }
  }

  return {
    dataSource: source,
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
    gameModeMutators: data.gameModeMutators
  }
}
