import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
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
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import {
  SAVED_PLAYER_MAIN_NAMESPACE,
  SAVED_PLAYER_RENDERER_NAMESPACE,
  type SavedPlayerRendererContext
} from './context'
import { SavedPlayerRendererApi } from './saved-player-api'
import { useSavedPlayerStore } from './store'

@Shard(SavedPlayerRenderer.id)
export class SavedPlayerRenderer implements IAkariShardInitDispose {
  static id = SAVED_PLAYER_RENDERER_NAMESPACE

  public readonly summonerLruMap = new LRUMap<string, SummonerInfo>({
    maxSize: 200
  })

  private readonly _api: SavedPlayerRendererApi

  constructor(
    @Dep(AkariIpcRenderer) ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) private readonly _piniaMobxUtils: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) private readonly _settingUtils: SettingUtilsRenderer
  ) {
    const context: SavedPlayerRendererContext = { ipc }
    this._api = new SavedPlayerRendererApi(context)
  }

  async onInit() {
    const store = useSavedPlayerStore()
    await this._piniaMobxUtils.sync(SAVED_PLAYER_MAIN_NAMESPACE, 'settings', store.settings)
  }

  setPlayerTagPhrases(phrases: string[]) {
    return this._settingUtils.set(SAVED_PLAYER_MAIN_NAMESPACE, 'playerTagPhrases', phrases)
  }

  setPlayerTagPhrasePanelExpanded(expanded: boolean) {
    return this._settingUtils.set(
      SAVED_PLAYER_MAIN_NAMESPACE,
      'playerTagPhrasePanelExpanded',
      expanded
    )
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
