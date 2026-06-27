import { Config, Dep, Shard } from '@shared/akari-shard'
import { LeagueClientHttpApiAxiosHelper } from '@shared/http-api-axios-helper/league-client'
import { UxCommandLine } from '@shared/shards/league-client-ux'
import type { LcuEvent } from '@shared/types/league-client/event'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import { RadixEventEmitter } from '@shared/utils/event-emitter'
import axios from 'axios'
import axiosRetry from 'axios-retry'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { SettingUtilsRenderer } from '../setting-utils'
import { SetupInAppScopeRenderer } from '../setup-in-app-scope'
import {
  LEAGUE_CLIENT_RENDERER_NAMESPACE,
  type LeagueClientRendererConfig,
  type LeagueClientRendererContext,
  MAIN_SHARD_NAMESPACE
} from './context'
import { watchLeagueClientInitializationProgress } from './initialization-progress-watcher'
import { LeagueClientLcuEventSubscription } from './lcu-event-subscription'
import { syncLeagueClientState } from './state-sync'

export { MAIN_SHARD_NAMESPACE }
export type { LeagueClientRendererConfig }

@Shard(LeagueClientRenderer.id)
export class LeagueClientRenderer {
  static id = LEAGUE_CLIENT_RENDERER_NAMESPACE

  /** 这里只用于当作一个普通的静态事件分发器 */
  private readonly _emitter = new RadixEventEmitter()
  private readonly _context: LeagueClientRendererContext
  private readonly _lcuEventSubscription: LeagueClientLcuEventSubscription

  public readonly httpClient = axios.create({
    baseURL: 'akari://league-client',
    adapter: 'fetch',
    paramsSerializer: { indexes: null }
  })
  public readonly api: LeagueClientHttpApiAxiosHelper

  constructor(
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) private readonly _piniaMobxUtils: PiniaMobxUtilsRenderer,
    @Dep(SettingUtilsRenderer) private readonly _settingUtils: SettingUtilsRenderer,
    @Dep(SetupInAppScopeRenderer) private readonly _setupInAppScope: SetupInAppScopeRenderer,
    @Config() private _config?: LeagueClientRendererConfig
  ) {
    axiosRetry(this.httpClient, {
      retries: 2
    })

    this.api = new LeagueClientHttpApiAxiosHelper(this.httpClient)
    this._context = {
      namespace: LeagueClientRenderer.id,
      mainShardNamespace: MAIN_SHARD_NAMESPACE,
      ipc: this._ipc,
      piniaMobxUtils: this._piniaMobxUtils,
      settingUtils: this._settingUtils,
      setupInAppScope: this._setupInAppScope,
      emitter: this._emitter,
      httpClient: this.httpClient,
      api: this.api,
      config: this._config
    }
    this._lcuEventSubscription = new LeagueClientLcuEventSubscription(this._context)
  }

  async onInit() {
    await syncLeagueClientState(this._context)
    this._lcuEventSubscription.registerDispatch()
    this._setupInAppScope.addSetupFn(() => watchLeagueClientInitializationProgress())

    // @ts-ignore
    window.lcuApi = this.api
  }

  onLcuEventVue<T = any, P = Record<string, any>>(
    uri: string,
    listener: (data: LcuEvent<T>, params: P) => void
  ) {
    return this._lcuEventSubscription.onLcuEventVue(uri, listener)
  }

  static url(uri: string) {
    return new URL(uri, 'akari://league-client').href
  }

  setAutoConnect(enabled: boolean) {
    return this._settingUtils.set(MAIN_SHARD_NAMESPACE, 'autoConnect', enabled)
  }

  disconnect() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'disconnect')
  }

  connect(auth: UxCommandLine) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'connect', auth)
  }

  writeItemSetsToDisk(items: any[] | null, clearPrevious?: boolean) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'writeItemSetsToDisk', items, clearPrevious)
  }

  fixWindowMethodA(config?: { baseHeight: number; baseWidth: number }) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'fixWindowMethodA', config)
  }

  peekClient(auth: UxCommandLine): Promise<{ summoner: SummonerInfo; profileIcon: string } | null> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'peekClient', auth)
  }
}
