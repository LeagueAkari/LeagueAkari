import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import type {
  OngoingGameMatchHistoryTagPreference,
  OngoingGamePanelChampionUsage,
  OngoingGamePanelOrderPlayerBy,
  OngoingGamePanelPlayerCardTagSettings
} from '@shared/shards/ongoing-game'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { SetupInAppScopeRenderer } from '../setup-in-app-scope'
import {
  type DraftOptions,
  ONGOING_GAME_MAIN_NAMESPACE,
  ONGOING_GAME_RENDERER_NAMESPACE,
  type OngoingGameAllData,
  type OngoingGameMatchHistoryQueryTagParams,
  type OngoingGamePlayerReloadOptions,
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
      mainShardNamespace: ONGOING_GAME_MAIN_NAMESPACE,
      ipc: this._ipc,
      piniaMobxUtils: this._piniaMobxUtils,
      settingUtils: this._settingUtils,
      setupInAppScope: this._setupInAppScope
    }
    this._storeEventHandlers = new OngoingGameStoreEventHandlers(this._context)
  }

  setConcurrency(value: number) {
    return this._settingUtils.set(ONGOING_GAME_MAIN_NAMESPACE, 'concurrency', value)
  }

  setEnabled(value: boolean) {
    return this._settingUtils.set(ONGOING_GAME_MAIN_NAMESPACE, 'enabled', value)
  }

  setMatchHistoryLoadCount(value: number) {
    return this._settingUtils.set(ONGOING_GAME_MAIN_NAMESPACE, 'matchHistoryLoadCount', value)
  }

  setMatchHistoryTagParams(value: OngoingGameMatchHistoryQueryTagParams) {
    this._ipc.call(ONGOING_GAME_MAIN_NAMESPACE, 'setMatchHistoryTagParams', value)
  }

  setDraft(value: DraftOptions) {
    return this._ipc.call(ONGOING_GAME_MAIN_NAMESPACE, 'setDraft', value)
  }

  clearDraft() {
    return this._ipc.call(ONGOING_GAME_MAIN_NAMESPACE, 'clearDraft')
  }

  setMatchHistoryTagPreference(value: OngoingGameMatchHistoryTagPreference) {
    return this._settingUtils.set(ONGOING_GAME_MAIN_NAMESPACE, 'matchHistoryTagPreference', value)
  }

  setGameDetailsLoadCount(value: number) {
    return this._settingUtils.set(ONGOING_GAME_MAIN_NAMESPACE, 'gameDetailsLoadCount', value)
  }

  setOrderPlayerBy(value: OngoingGamePanelOrderPlayerBy) {
    return this._settingUtils.set(ONGOING_GAME_MAIN_NAMESPACE, 'orderPlayerBy', value)
  }

  setShowChampionUsage(value: OngoingGamePanelChampionUsage) {
    return this._settingUtils.set(ONGOING_GAME_MAIN_NAMESPACE, 'showChampionUsage', value)
  }

  setShowMatchHistoryItemBorder(value: boolean) {
    return this._settingUtils.set(ONGOING_GAME_MAIN_NAMESPACE, 'showMatchHistoryItemBorder', value)
  }

  setShowJunglePathing(value: boolean) {
    return this._settingUtils.set(ONGOING_GAME_MAIN_NAMESPACE, 'showJunglePathing', value)
  }

  setShowJunglePathingForAllPlayers(value: boolean) {
    return this._settingUtils.set(
      ONGOING_GAME_MAIN_NAMESPACE,
      'showJunglePathingForAllPlayers',
      value
    )
  }

  setAutoRouteWhenGameStarts(value: boolean) {
    return this._settingUtils.set(ONGOING_GAME_MAIN_NAMESPACE, 'autoRouteWhenGameStarts', value)
  }

  setPlayerCardTags(value: OngoingGamePanelPlayerCardTagSettings) {
    return this._settingUtils.set(ONGOING_GAME_MAIN_NAMESPACE, 'playerCardTags', value)
  }

  setQueryInLobbyPhase(value: boolean) {
    return this._settingUtils.set(ONGOING_GAME_MAIN_NAMESPACE, 'queryInLobbyPhase', value)
  }

  setPremadeTeamInferMatchCountThreshold(value: number) {
    return this._settingUtils.set(
      ONGOING_GAME_MAIN_NAMESPACE,
      'premadeTeamInferMatchCountThreshold',
      value
    )
  }

  reload() {
    this._ipc.call(ONGOING_GAME_MAIN_NAMESPACE, 'reload')
  }

  reloadPlayer(puuid: string, options?: OngoingGamePlayerReloadOptions) {
    this._ipc.call(ONGOING_GAME_MAIN_NAMESPACE, 'reloadPlayer', puuid, options)
  }

  getAll() {
    return this._ipc.call(ONGOING_GAME_MAIN_NAMESPACE, 'getAll') as Promise<OngoingGameAllData>
  }

  async onInit() {
    const store = useOngoingGameStore()

    await this._piniaMobxUtils.sync(ONGOING_GAME_MAIN_NAMESPACE, 'settings', store.settings)
    await this._piniaMobxUtils.sync(ONGOING_GAME_MAIN_NAMESPACE, 'state', store)

    this._storeEventHandlers.register()
    await this._storeEventHandlers.loadInitialData(await this.getAll())
  }

  async onDispose() {}
}
