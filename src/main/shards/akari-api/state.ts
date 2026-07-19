import type {
  AkariAutoSelectGroupsConfig,
  AkariLeagueServersConfig,
  AkariNotice,
  AkariOngoingGameConfig,
  AkariRelease,
  AkariSupportedQueuesConfig
} from '@shared/shards/akari-api'
import { makeAutoObservable, observable } from 'mobx'

import {
  BUILTIN_AUTO_SELECT_GROUPS,
  BUILTIN_ONGOING_GAME_CONFIG,
  BUILTIN_SGP_LEAGUE_SERVERS_CONFIG,
  BUILTIN_SUPPORTED_QUEUES
} from './builtin'

export class AkariApiState {
  leagueServers = BUILTIN_SGP_LEAGUE_SERVERS_CONFIG
  supportedQueues = BUILTIN_SUPPORTED_QUEUES
  ongoingGameConfig = BUILTIN_ONGOING_GAME_CONFIG
  autoSelectGroups = BUILTIN_AUTO_SELECT_GROUPS

  notice: AkariNotice | null = null
  latestRelease: AkariRelease | null = null

  setLatestRelease(value: AkariRelease | null) {
    this.latestRelease = value
  }

  isUpdatingNotice = false
  isUpdatingLeagueServers = false
  isUpdatingSupportedQueues = false
  isUpdatingOngoingGameConfig = false
  isUpdatingAutoSelectGroups = false

  setLeagueServers(value: AkariLeagueServersConfig) {
    this.leagueServers = value
  }

  setSupportedQueues(value: AkariSupportedQueuesConfig) {
    this.supportedQueues = value
  }

  setOngoingGameConfig(value: AkariOngoingGameConfig) {
    this.ongoingGameConfig = value
  }

  setAutoSelectGroups(value: AkariAutoSelectGroupsConfig) {
    this.autoSelectGroups = value
  }

  setNotice(value: AkariNotice | null) {
    this.notice = value
  }

  setUpdatingNotice(value: boolean) {
    this.isUpdatingNotice = value
  }

  setUpdatingLeagueServers(value: boolean) {
    this.isUpdatingLeagueServers = value
  }

  setUpdatingSupportedQueues(value: boolean) {
    this.isUpdatingSupportedQueues = value
  }

  setUpdatingOngoingGameConfig(value: boolean) {
    this.isUpdatingOngoingGameConfig = value
  }

  setUpdatingAutoSelectGroups(value: boolean) {
    this.isUpdatingAutoSelectGroups = value
  }

  constructor() {
    makeAutoObservable(this, {
      leagueServers: observable.ref,
      supportedQueues: observable.ref,
      ongoingGameConfig: observable.ref,
      autoSelectGroups: observable.ref,
      latestRelease: observable.ref
    })
  }
}
