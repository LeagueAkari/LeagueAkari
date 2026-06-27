import type {
  AllTaggedPlayerQueryDto,
  EncounteredGame,
  EncounteredGameQueryDto,
  PlayerTagDto,
  SavedPlayerQueryDto,
  UpdateTagDto
} from '@shared/shards/saved-player'

import { SAVED_PLAYER_MAIN_NAMESPACE, type SavedPlayerRendererContext } from './context'

export class SavedPlayerRendererApi {
  constructor(private readonly _context: SavedPlayerRendererContext) {}

  querySavedPlayerWithGames(dto: SavedPlayerQueryDto) {
    return this._context.ipc.call(SAVED_PLAYER_MAIN_NAMESPACE, 'querySavedPlayerWithGames', dto)
  }

  getAllPlayerTags(dto: Partial<AllTaggedPlayerQueryDto> = {}) {
    return this._context.ipc.call(SAVED_PLAYER_MAIN_NAMESPACE, 'getAllPlayerTags', dto)
  }

  getPlayerTags(dto: SavedPlayerQueryDto): Promise<PlayerTagDto[]> {
    return this._context.ipc.call(SAVED_PLAYER_MAIN_NAMESPACE, 'getPlayerTags', dto)
  }

  queryEncounteredGames(dto: EncounteredGameQueryDto): Promise<{
    data: EncounteredGame[]
    page: number
    pageSize: number
    total: number
  }> {
    return this._context.ipc.call(SAVED_PLAYER_MAIN_NAMESPACE, 'queryEncounteredGames', dto)
  }

  deleteEncounteredGame(recordId: number) {
    return this._context.ipc.call(SAVED_PLAYER_MAIN_NAMESPACE, 'deleteEncounteredGame', recordId)
  }

  updatePlayerTag<T extends UpdateTagDto>(dto: T) {
    return this._context.ipc.call(SAVED_PLAYER_MAIN_NAMESPACE, 'updatePlayerTag', dto)
  }

  deleteSavedPlayer(dto: SavedPlayerQueryDto) {
    return this._context.ipc.call(SAVED_PLAYER_MAIN_NAMESPACE, 'deleteSavedPlayer', dto)
  }

  queryAllSavedPlayers(dto: object): Promise<{
    count: number
    page: number
    pageSize: number
    data: any[]
  }> {
    return this._context.ipc.call(SAVED_PLAYER_MAIN_NAMESPACE, 'queryAllSavedPlayers', dto)
  }

  exportTaggedPlayersToJsonFile() {
    return this._context.ipc.call(SAVED_PLAYER_MAIN_NAMESPACE, 'exportTaggedPlayersToJsonFile')
  }

  importTaggedPlayersFromJsonFile() {
    return this._context.ipc.call(SAVED_PLAYER_MAIN_NAMESPACE, 'importTaggedPlayersFromJsonFile')
  }
}
