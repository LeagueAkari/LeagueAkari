import { Dep, Shard } from '@shared/akari-shard'
import {
  AllTaggedPlayerQueryDto,
  EncounteredGame,
  EncounteredGameQueryDto,
  PlayerTagDto,
  SavedPlayerQueryDto,
  UpdateTagDto
} from '@shared/shards/saved-player'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import LRUMap from 'quick-lru'

import { AkariIpcRenderer } from '../ipc'
import { SAVED_PLAYER_RENDERER_NAMESPACE, type SavedPlayerRendererContext } from './context'
import { SavedPlayerRendererApi } from './saved-player-api'

@Shard(SavedPlayerRenderer.id)
export class SavedPlayerRenderer {
  static id = SAVED_PLAYER_RENDERER_NAMESPACE

  public readonly summonerLruMap = new LRUMap<string, SummonerInfo>({
    maxSize: 200
  })

  private readonly _api: SavedPlayerRendererApi

  constructor(@Dep(AkariIpcRenderer) ipc: AkariIpcRenderer) {
    const context: SavedPlayerRendererContext = { ipc }
    this._api = new SavedPlayerRendererApi(context)
  }

  querySavedPlayerWithGames(dto: SavedPlayerQueryDto) {
    return this._api.querySavedPlayerWithGames(dto)
  }

  getAllPlayerTags(dto: Partial<AllTaggedPlayerQueryDto> = {}) {
    return this._api.getAllPlayerTags(dto)
  }

  getPlayerTags(dto: SavedPlayerQueryDto): Promise<PlayerTagDto[]> {
    return this._api.getPlayerTags(dto)
  }

  queryEncounteredGames(dto: EncounteredGameQueryDto): Promise<{
    data: EncounteredGame[]
    page: number
    pageSize: number
    total: number
  }> {
    return this._api.queryEncounteredGames(dto)
  }

  deleteEncounteredGame(recordId: number) {
    return this._api.deleteEncounteredGame(recordId)
  }

  updatePlayerTag<T extends UpdateTagDto>(dto: T) {
    return this._api.updatePlayerTag(dto)
  }

  deleteSavedPlayer(dto: SavedPlayerQueryDto) {
    return this._api.deleteSavedPlayer(dto)
  }

  queryAllSavedPlayers(dto: object): Promise<{
    count: number
    page: number
    pageSize: number
    data: any[]
  }> {
    return this._api.queryAllSavedPlayers(dto)
  }

  exportTaggedPlayersToJsonFile() {
    return this._api.exportTaggedPlayersToJsonFile()
  }

  importTaggedPlayersFromJsonFile() {
    return this._api.importTaggedPlayersFromJsonFile()
  }
}
