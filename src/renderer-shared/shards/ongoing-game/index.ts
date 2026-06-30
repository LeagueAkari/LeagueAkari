import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { SetupInAppScopeRenderer } from '../setup-in-app-scope'
import {
  type DraftOptions,
  MAIN_SHARD_NAMESPACE,
  ONGOING_GAME_RENDERER_NAMESPACE,
  type OngoingGameAllData,
  type OngoingGameMatchHistoryQueryTagParams,
  type OngoingGameRendererContext
} from './context'
import { useOngoingGameStore } from './store'
import { OngoingGameStoreEventHandlers } from './store-event-handlers'

@Shard(OngoingGameRenderer.id)
export class OngoingGameRenderer implements IAkariShardInitDispose {
  static id = ONGOING_GAME_RENDERER_NAMESPACE

  private readonly _context: OngoingGameRendererContext
  private readonly _storeEventHandlers: OngoingGameStoreEventHandlers

  constructor(
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) private readonly _piniaMobxUtils: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) private readonly _settingUtils: SettingUtilsRenderer,
    @Dep(SetupInAppScopeRenderer) readonly _setupInAppScope: SetupInAppScopeRenderer
  ) {
    this._context = {
      namespace: OngoingGameRenderer.id,
      mainShardNamespace: MAIN_SHARD_NAMESPACE,
      ipc: this._ipc,
      piniaMobxUtils: this._piniaMobxUtils,
      settingUtils: this._settingUtils,
      setupInAppScope: this._setupInAppScope
    }
    this._storeEventHandlers = new OngoingGameStoreEventHandlers(this._context)
  }

  setConcurrency(value: number) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'concurrency', value)
  }

  setEnabled(value: boolean) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'enabled', value)
  }

  setMatchHistoryLoadCount(value: number) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'matchHistoryLoadCount', value)
  }

  setMatchHistoryTagParams(value: OngoingGameMatchHistoryQueryTagParams) {
    this._ipc.call(MAIN_SHARD_NAMESPACE, 'setMatchHistoryTagParams', value)
  }

  setDraft(value: DraftOptions) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'setDraft', value)
  }

  clearDraft() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'clearDraft')
  }

  setMatchHistoryTagPreference(value: 'current' | 'all') {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'matchHistoryTagPreference', value)
  }

  setGameDetailsLoadCount(value: number) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'gameDetailsLoadCount', value)
  }

  setOrderPlayerBy(
    value: 'win-rate' | 'kda' | 'default' | 'akari-score' | 'position' | 'premade-team'
  ) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'orderPlayerBy', value)
  }

  setShowChampionUsage(value: 'recent' | 'mastery' | 'none') {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'showChampionUsage', value)
  }

  setShowMatchHistoryItemBorder(value: boolean) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'showMatchHistoryItemBorder', value)
  }

  setShowJunglePathing(value: boolean) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'showJunglePathing', value)
  }

  setShowJunglePathingForAllPlayers(value: boolean) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'showJunglePathingForAllPlayers', value)
  }

  setAutoRouteWhenGameStarts(value: boolean) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'autoRouteWhenGameStarts', value)
  }

  setPlayerCardTags(value: object) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'playerCardTags', value)
  }

  setQueryInLobbyPhase(value: boolean) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'queryInLobbyPhase', value)
  }

  setPremadeTeamInferMatchCountThreshold(value: number) {
    return this._settingUtils.set(
      MAIN_SHARD_NAMESPACE,
      'premadeTeamInferMatchCountThreshold',
      value
    )
  }

  reload() {
    this._ipc.call(MAIN_SHARD_NAMESPACE, 'reload')
  }

  reloadPlayer(puuid: string) {
    this._ipc.call(MAIN_SHARD_NAMESPACE, 'reloadPlayer', puuid)
  }

  getAll() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'getAll') as Promise<OngoingGameAllData>
  }

  async onInit() {
    const store = useOngoingGameStore()

    await this._piniaMobxUtils.sync(MAIN_SHARD_NAMESPACE, 'settings', store.settings)
    await this._piniaMobxUtils.sync(MAIN_SHARD_NAMESPACE, 'state', store)

    this._storeEventHandlers.register()
    await this._storeEventHandlers.loadInitialData(await this.getAll())
  }

  async onDispose() {}
}
