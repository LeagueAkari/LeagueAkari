import type { AxiosInstance } from 'axios'

import type { AkariProtocolMain } from '../akari-protocol'
import type { AppCommonMain } from '../app-common'
import type { LeagueClientMain } from '../league-client'
import type { AkariLogger } from '../logger-factory'
import type { MobxUtilsMain } from '../mobx-utils'
import type { RemoteConfigMain } from '../remote-config'
import type { SgpState } from './state'

export const SGP_MAIN_NAMESPACE = 'sgp-main'

export interface SgpMainContext {
  namespace: string
  appCommon: AppCommonMain
  httpClient: AxiosInstance
  leagueClient: LeagueClientMain
  logger: AkariLogger
  mobxUtils: MobxUtilsMain
  protocol: AkariProtocolMain
  remoteConfig: RemoteConfigMain
  state: SgpState
}
