import { getSgpServerId } from '@shared/utils/sgp'
import { makeAutoObservable } from 'mobx'

import type { LeagueClientMain } from '../league-client'
import { RemoteConfigMain } from '../remote-config'

export class SgpState {
  get leagueServers() {
    return this._remoteConfig.state.leagueServers
  }

  get availability() {
    if (!this._leagueClient.state.auth) {
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

    const sgpServerId = getSgpServerId(
      this._leagueClient.state.auth.region,
      this._leagueClient.state.auth.rsoPlatformId
    )
    const supported = this.leagueServers.servers[sgpServerId.toUpperCase()] || {
      matchHistory: false,
      common: false
    }

    return {
      region: this._leagueClient.state.auth.region,
      rsoPlatform: this._leagueClient.state.auth.rsoPlatformId,
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
    const configuredQueues = this._remoteConfig.state.supportedQueues.queues
    const currentQueueId = [
      this._leagueClient.data.lobby.lobby?.gameConfig.queueId,
      this._leagueClient.data.gameflow.session?.gameData.queue.id
    ].find((queueId) => queueId !== undefined && queueId > 0)

    if (
      currentQueueId === undefined ||
      !this._leagueClient.data.gameData.queues[currentQueueId] ||
      configuredQueues.includes(currentQueueId)
    ) {
      return configuredQueues
    }

    return [currentQueueId, ...configuredQueues]
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
    private _leagueClient: LeagueClientMain,
    private _remoteConfig: RemoteConfigMain
  ) {
    makeAutoObservable(this)
  }
}
