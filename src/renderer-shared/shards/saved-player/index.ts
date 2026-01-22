import { Dep, Shard } from '@shared/akari-shard'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import {
  AllTaggedPlayerQueryDto,
  EncounteredGame,
  EncounteredGameQueryDto,
  PlayerTagDto,
  SavedPlayerQueryDto,
  UpdateTagDto
} from '@shared/types/shards/saved-player'
import LRUMap from 'quick-lru'

import { AkariIpcRenderer } from '../ipc'

const MAIN_SHARD_NAMESPACE = 'saved-player-main'

@Shard(SavedPlayerRenderer.id)
export class SavedPlayerRenderer {
  static id = 'saved-player-renderer'

  public readonly summonerLruMap = new LRUMap<string, SummonerInfo>({
    maxSize: 200
  })

  constructor(@Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer) {}

  querySavedPlayerWithGames(dto: SavedPlayerQueryDto) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'querySavedPlayerWithGames', dto)
  }

  getAllPlayerTags(dto: Partial<AllTaggedPlayerQueryDto> = {}) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'getAllPlayerTags', dto)
  }

  getPlayerTags(dto: SavedPlayerQueryDto): Promise<PlayerTagDto[]> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'getPlayerTags', dto)
  }

  queryEncounteredGames(dto: EncounteredGameQueryDto): Promise<{
    data: EncounteredGame[]
    page: number
    pageSize: number
    total: number
  }> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'queryEncounteredGames', dto)
  }

  deleteEncounteredGame(recordId: number) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'deleteEncounteredGame', recordId)
  }

  updatePlayerTag<T extends UpdateTagDto>(dto: T) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'updatePlayerTag', dto)
  }

  deleteSavedPlayer(dto: SavedPlayerQueryDto) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'deleteSavedPlayer', dto)
  }

  queryAllSavedPlayers(dto: object): Promise<{
    count: number
    page: number
    pageSize: number
    data: any[]
  }> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'queryAllSavedPlayers', dto)
  }

  exportTaggedPlayersToJsonFile() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'exportTaggedPlayersToJsonFile')
  }

  importTaggedPlayersFromJsonFile() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'importTaggedPlayersFromJsonFile')
  }
}
