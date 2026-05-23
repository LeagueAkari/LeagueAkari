import { IAkariShardInitDispose, Shard, SharedGlobalShard } from '@shared/akari-shard'
import {
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
import { Equal, FindOptionsOrder, FindOptionsWhere, IsNull, Not } from 'typeorm'

import { AkariIpcMain } from '../ipc'
import { StorageMain } from '../storage'
import { EncounteredGame } from '../storage/entities/EncounteredGame'
import { SavedPlayer } from '../storage/entities/SavedPlayers'
import { SAVED_PLAYER_MAIN_NAMESPACE, SavedPlayerMainContext } from './context'
import { SavedPlayerIpcHandlers } from './ipc-handlers'
import { TaggedPlayersFileService } from './tagged-players-file-service'

@Shard(SavedPlayerMain.id)
export class SavedPlayerMain implements IAkariShardInitDispose {
  static id = SAVED_PLAYER_MAIN_NAMESPACE
  static dependencies = [AkariIpcMain.id, StorageMain.id]

  static ENCOUNTERED_GAME_QUERY_DEFAULT_PAGE_SIZE = 40

  private readonly context: SavedPlayerMainContext
  private readonly taggedPlayersFileService: TaggedPlayersFileService
  private readonly ipcHandlers: SavedPlayerIpcHandlers

  constructor(
    ipc: AkariIpcMain,
    private readonly storage: StorageMain,
    shared: SharedGlobalShard
  ) {
    this.context = {
      namespace: SavedPlayerMain.id,
      ipc,
      storage,
      shared
    }

    this.taggedPlayersFileService = new TaggedPlayersFileService(this.context)
    this.ipcHandlers = new SavedPlayerIpcHandlers(this.context, this, this.taggedPlayersFileService)
  }

  async onInit() {
    this.ipcHandlers.register()
  }

  async queryEncounteredGames(query: EncounteredGameQueryDto) {
    const pageSize = query.pageSize || SavedPlayerMain.ENCOUNTERED_GAME_QUERY_DEFAULT_PAGE_SIZE
    const page = query.page || 1
    const whereClause: FindOptionsWhere<EncounteredGame> = {
      selfPuuid: Equal(query.selfPuuid),
      puuid: Equal(query.puuid)
    }

    if (query.queueType) {
      whereClause.queueType = Equal(query.queueType)
    }

    const encounteredGames = await this.storage.dataSource.manager.find(EncounteredGame, {
      where: whereClause,
      order: { updateAt: query.timeOrder || 'desc' },
      take: pageSize,
      skip: (page - 1) * pageSize
    })

    const total = await this.storage.dataSource.manager.count(EncounteredGame, {
      where: whereClause
    })

    return {
      data: encounteredGames,
      page,
      pageSize,
      total
    }
  }

  async deleteEncounteredGame(recordId: number) {
    return this.storage.dataSource.manager.delete(EncounteredGame, { id: recordId })
  }

  async saveEncounteredGame(dto: EncounteredGameSaveDto) {
    const encounteredGame = new EncounteredGame()
    encounteredGame.gameId = dto.gameId
    encounteredGame.region = dto.region
    encounteredGame.rsoPlatformId = dto.rsoPlatformId
    encounteredGame.selfPuuid = dto.selfPuuid
    encounteredGame.puuid = dto.puuid
    encounteredGame.queueType = dto.queueType || ''
    encounteredGame.updateAt = new Date()

    return this.storage.dataSource.manager.save(encounteredGame)
  }

  async queryAllSavedPlayers(query: QueryAllSavedPlayersDto) {
    const data = await this.storage.dataSource.manager.find(SavedPlayer, {
      take: query.pageSize,
      skip: (query.page - 1) * query.pageSize
    })
    const count = await this.storage.dataSource.manager.count(SavedPlayer)

    return { data, count, page: query.page, pageSize: query.pageSize }
  }

  async querySavedPlayer(query: SavedPlayerQueryDto) {
    if (!query.puuid || !query.selfPuuid) {
      throw new Error('puuid, selfPuuid cannot be empty')
    }

    return this.storage.dataSource.manager.findOneBy(SavedPlayer, {
      puuid: Equal(query.puuid),
      selfPuuid: Equal(query.selfPuuid)
    })
  }

  async querySavedPlayerWithGames(query: SavedPlayerQueryDto & WithEncounteredGamesQueryDto) {
    if (!query.puuid || !query.selfPuuid) {
      throw new Error('puuid, selfPuuid or region cannot be empty')
    }

    const savedPlayer = await this.storage.dataSource.manager.findOneBy(SavedPlayer, {
      puuid: Equal(query.puuid),
      selfPuuid: Equal(query.selfPuuid)
    })

    if (!savedPlayer) {
      return null
    }

    const encounteredGames = await this.queryEncounteredGames({
      puuid: query.puuid,
      selfPuuid: query.selfPuuid,
      queueType: query.queueType
    })

    const tags = await this.getPlayerTags({
      puuid: query.puuid,
      selfPuuid: query.selfPuuid
    })

    return { ...savedPlayer, encounteredGames, tags }
  }

  async deleteSavedPlayer(query: SavedPlayerQueryDto) {
    if (!query.puuid || !query.selfPuuid) {
      throw new Error('puuid, selfPuuid or region cannot be empty')
    }

    return this.storage.dataSource.manager.remove(SavedPlayer, query)
  }

  async saveSavedPlayer(player: SavedPlayerSaveDto) {
    if (!player.puuid || !player.selfPuuid || !player.region) {
      throw new Error('puuid, selfPuuid or region cannot be empty')
    }

    const savedPlayer = new SavedPlayer()
    const date = new Date()
    savedPlayer.puuid = player.puuid

    if (player.tag !== undefined) {
      savedPlayer.tag = player.tag
    }

    savedPlayer.selfPuuid = player.selfPuuid
    savedPlayer.rsoPlatformId = player.rsoPlatformId
    savedPlayer.region = player.region
    savedPlayer.updateAt = date

    if (player.encountered) {
      savedPlayer.lastMetAt = date
    }

    return this.storage.dataSource.manager.save(savedPlayer)
  }

  async getAllPlayerTags(query: SavedPlayerQueryDto & PaginationDto & OrderByDto) {
    const whereClause: FindOptionsWhere<SavedPlayer> = {
      tag: Not(IsNull())
    }
    const orderBy: FindOptionsOrder<SavedPlayer> = {}
    const { page = 1, pageSize = 40 } = query

    if (query.puuid !== undefined) {
      whereClause.puuid = Equal(query.puuid)
    }

    if (query.selfPuuid !== undefined) {
      whereClause.selfPuuid = Equal(query.selfPuuid)
    }

    if (query.region !== undefined) {
      whereClause.region = Equal(query.region)
    }

    if (query.rsoPlatformId !== undefined) {
      whereClause.rsoPlatformId = Equal(query.rsoPlatformId)
    }

    if (query.timeOrder) {
      orderBy.updateAt = query.timeOrder
    } else {
      orderBy.updateAt = 'desc'
    }

    const players = await this.storage.dataSource.manager.find(SavedPlayer, {
      take: pageSize || 20,
      skip: (page - 1) * pageSize,
      where: whereClause,
      order: orderBy
    })

    const total = await this.storage.dataSource.manager.count(SavedPlayer, {
      where: whereClause
    })

    return {
      data: players,
      page,
      pageSize,
      total
    }
  }

  async getPlayerTags(query: Partial<SavedPlayerQueryDto>) {
    if (!query.puuid || !query.selfPuuid) {
      throw new Error('puuid, selfPuuid or region cannot be empty')
    }

    const players = await this.storage.dataSource.manager.findBy(SavedPlayer, {
      puuid: Equal(query.puuid)
    })

    return players
      .filter((player) => player.tag)
      .map((player) => {
        return {
          ...player,
          markedBySelf: player.selfPuuid === query.selfPuuid
        }
      })
  }

  async updatePlayerTag(dto: UpdateTagDto) {
    if (!dto.puuid || !dto.selfPuuid) {
      throw new Error('puuid, selfPuuid cannot be empty')
    }

    const player = await this.storage.dataSource.manager.findOneBy(SavedPlayer, {
      puuid: Equal(dto.puuid),
      selfPuuid: Equal(dto.selfPuuid)
    })

    if (player) {
      player.tag = dto.tag
      player.updateAt = new Date()

      return this.storage.dataSource.manager.save(player)
    }

    if (dto.rsoPlatformId === undefined || dto.region === undefined) {
      throw new Error('When creating tag, rsoPlatformId, region cannot be empty')
    }

    const newPlayer = new SavedPlayer()
    const date = new Date()
    newPlayer.puuid = dto.puuid
    newPlayer.tag = dto.tag
    newPlayer.selfPuuid = dto.selfPuuid
    newPlayer.updateAt = date
    newPlayer.rsoPlatformId = dto.rsoPlatformId
    newPlayer.region = dto.region

    return this.storage.dataSource.manager.save(newPlayer)
  }
}
