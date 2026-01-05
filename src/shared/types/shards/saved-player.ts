/**
 * 遇到的对局记录
 */
export interface EncounteredGame {
  id: number
  gameId: number
  puuid: string
  selfPuuid: string
  region: string
  rsoPlatformId: string
  updateAt: Date
  queueType: string
}
