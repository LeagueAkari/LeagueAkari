import { getSgpServerId } from '@shared/utils/sgp'
import { makeAutoObservable } from 'mobx'

import { LeagueClientState } from '../league-client/state'
import { RemoteConfigMain } from '../remote-config'

export class SgpState {
  get leagueServers() {
    return this._remoteConfig.state.leagueServers
  }

  get availability() {
    if (!this._lcState.auth) {
      return {
        region: '',
        rsoPlatform: '',
        sgpServerId: '',
        serversSupported: {
          matchHistory: false,
          common: false
        }
      }
    }

    const sgpServerId = getSgpServerId(this._lcState.auth.region, this._lcState.auth.rsoPlatformId)
    const supported = this.leagueServers.servers[sgpServerId.toUpperCase()] || {
      matchHistory: false,
      common: false
    }

    return {
      region: this._lcState.auth.region,
      rsoPlatform: this._lcState.auth.rsoPlatformId,
      sgpServerId,
      serversSupported: {
        matchHistory: supported.matchHistory,
        common: supported.common
      }
    }
  }

  // 用一个标记位来延迟更新
  isEntitlementsTokenSet = false
  isLeagueSessionTokenSet = false

  get supportedQueues() {
    return this._remoteConfig.state.supportedQueues.queues
  }

  connectionSuccessesCounted = 0
  connectionFailuresCounted = 0

  setEntitlementsTokenSet(value: boolean) {
    this.isEntitlementsTokenSet = value
  }

  setLeagueSessionTokenSet(value: boolean) {
    this.isLeagueSessionTokenSet = value
  }

  setConnectionSuccessesCount(value: number) {
    this.connectionSuccessesCounted = value
  }

  setConnectionFailuresCount(value: number) {
    this.connectionFailuresCounted = value
  }

  get isTokenReady() {
    return this.isEntitlementsTokenSet && this.isLeagueSessionTokenSet
  }

  constructor(
    private _lcState: LeagueClientState,
    private _remoteConfig: RemoteConfigMain
  ) {
    makeAutoObservable(this)
  }
}
