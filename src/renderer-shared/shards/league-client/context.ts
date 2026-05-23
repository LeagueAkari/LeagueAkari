import type { LeagueClientHttpApiAxiosHelper } from '@shared/http-api-axios-helper/league-client'
import type { LcuEvent } from '@shared/types/league-client/event'
import type { RadixEventEmitter } from '@shared/utils/event-emitter'
import type { AxiosInstance } from 'axios'

import type { AkariIpcRenderer } from '../ipc'
import type { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import type { SettingUtilsRenderer } from '../setting-utils'
import type { SetupInAppScopeRenderer } from '../setup-in-app-scope'

export const LEAGUE_CLIENT_RENDERER_NAMESPACE = 'league-client-renderer'
export const MAIN_SHARD_NAMESPACE = 'league-client-main'

export interface LeagueClientRendererConfig {
  subscribeState?: {
    gameData?: boolean
    honor?: boolean
    champSelect?: boolean
    chat?: boolean
    matchmaking?: boolean
    gameflow?: boolean
    lobby?: boolean
    login?: boolean
    summoner?: boolean
    lobbyTeamBuilder?: boolean
  }
}

export interface LeagueClientRendererContext {
  namespace: string
  mainShardNamespace: string
  ipc: AkariIpcRenderer
  piniaMobxUtils: PiniaMobxUtilsRenderer
  settingUtils: SettingUtilsRenderer
  setupInAppScope: SetupInAppScopeRenderer
  emitter: RadixEventEmitter
  httpClient: AxiosInstance
  api: LeagueClientHttpApiAxiosHelper
  config?: LeagueClientRendererConfig
}

export interface SubscribedLcuEvent<T = any, P = Record<string, any>> {
  event: LcuEvent<T>
  params: P
}
