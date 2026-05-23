import type {
  EncounteredGameQueryDto,
  EncounteredGameSaveDto,
  OrderByDto,
  PaginationDto,
  QueryAllSavedPlayersDto,
  SavedPlayerQueryDto,
  SavedPlayerSaveDto,
  UpdateTagDto,
  WithEncounteredGamesQueryDto
} from '@shared/types/shards/saved-player'
import { dialog } from 'electron'

import { AkariIpcError } from '../ipc'
import { WindowManagerMain } from '../window-manager'
import type { SavedPlayerMainContext } from './context'
import type { SavedPlayerMain } from './index'
import type { TaggedPlayersFileService } from './tagged-players-file-service'

export class SavedPlayerIpcHandlers {
  constructor(
    private readonly context: SavedPlayerMainContext,
    private readonly savedPlayer: SavedPlayerMain,
    private readonly taggedPlayersFileService: TaggedPlayersFileService
  ) {}

  register() {
    const { ipc, namespace } = this.context

    ipc.onCall(namespace, 'querySavedPlayer', (_, query: SavedPlayerQueryDto) => {
      return this.savedPlayer.querySavedPlayer(query)
    })

    ipc.onCall(
      namespace,
      'querySavedPlayerWithGames',
      (_, query: SavedPlayerQueryDto & WithEncounteredGamesQueryDto) => {
        return this.savedPlayer.querySavedPlayerWithGames(query)
      }
    )

    ipc.onCall(namespace, 'saveSavedPlayer', (_, player: SavedPlayerSaveDto) => {
      return this.savedPlayer.saveSavedPlayer(player)
    })

    ipc.onCall(namespace, 'deleteSavedPlayer', (_, query: SavedPlayerQueryDto) => {
      return this.savedPlayer.deleteSavedPlayer(query)
    })

    ipc.onCall(namespace, 'queryEncounteredGames', (_, query: EncounteredGameQueryDto) => {
      return this.savedPlayer.queryEncounteredGames(query)
    })

    ipc.onCall(namespace, 'deleteEncounteredGame', (_, recordId: number) => {
      return this.savedPlayer.deleteEncounteredGame(recordId)
    })

    ipc.onCall(namespace, 'saveEncounteredGame', (_, dto: EncounteredGameSaveDto) => {
      return this.savedPlayer.saveEncounteredGame(dto)
    })

    ipc.onCall(namespace, 'getPlayerTags', (_, query: SavedPlayerQueryDto) => {
      return this.savedPlayer.getPlayerTags(query)
    })

    ipc.onCall(namespace, 'updatePlayerTag', (_, dto: UpdateTagDto) => {
      return this.savedPlayer.updatePlayerTag(dto)
    })

    ipc.onCall(namespace, 'queryAllSavedPlayers', (_, query: QueryAllSavedPlayersDto) => {
      return this.savedPlayer.queryAllSavedPlayers(query)
    })

    ipc.onCall(
      namespace,
      'getAllPlayerTags',
      (_, query: SavedPlayerQueryDto & PaginationDto & OrderByDto) => {
        return this.savedPlayer.getAllPlayerTags(query)
      }
    )

    ipc.onCall(namespace, 'exportTaggedPlayersToJsonFile', async () => {
      const result = await dialog.showSaveDialog(this._getMainWindow(), {
        defaultPath: 'league-akari-tagged-players.json',
        filters: [{ name: 'JSON', extensions: ['json'] }]
      })

      if (result.canceled) {
        return
      }

      const filePath = result.filePath
      return await this.taggedPlayersFileService.writeToJsonFile(filePath)
    })

    ipc.onCall(namespace, 'importTaggedPlayersFromJsonFile', async () => {
      const result = await dialog.showOpenDialog(this._getMainWindow(), {
        defaultPath: 'league-akari-tagged-players.json',
        filters: [{ name: 'JSON', extensions: ['json'] }]
      })

      if (result.canceled) {
        return
      }

      const filePath = result.filePaths[0]
      return await this.taggedPlayersFileService.readFromJsonFile(filePath)
    })
  }

  private _getMainWindow() {
    const windowManager = this.context.shared.manager.getInstance(
      'window-manager-main'
    ) as WindowManagerMain

    if (!windowManager || !windowManager.mainWindow.window) {
      throw new AkariIpcError('WindowManagerMain not found', 'WindowManagerMainNotFound')
    }

    return windowManager.mainWindow.window
  }
}
