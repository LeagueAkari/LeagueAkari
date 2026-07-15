import type {
  AkariAutoSelectGroupsConfig,
  AkariLeagueServersConfig,
  AkariNotice,
  AkariOngoingGameConfig,
  AkariSupportedQueuesConfig
} from '@shared/shards/akari-api'
import type { LatestReleaseInfo } from '@shared/types/akari'
import { makeAutoObservable, observable } from 'mobx'

import {
  BUILTIN_AUTO_SELECT_GROUPS,
  BUILTIN_ONGOING_GAME_CONFIG,
  BUILTIN_SGP_LEAGUE_SERVERS_CONFIG,
  BUILTIN_SUPPORTED_QUEUES
} from './builtin'

function releaseEquals(left: LatestReleaseInfo | null, right: LatestReleaseInfo | null) {
  if (left === null || right === null) {
    return left === right
  }

  return (
    left.isNew === right.isNew &&
    left.currentVersion === right.currentVersion &&
    left.version === right.version
  )
}

export class AkariApiState {
  leagueServers = BUILTIN_SGP_LEAGUE_SERVERS_CONFIG
  supportedQueues = BUILTIN_SUPPORTED_QUEUES
  ongoingGameConfig = BUILTIN_ONGOING_GAME_CONFIG
  autoSelectGroups = BUILTIN_AUTO_SELECT_GROUPS

  notice: AkariNotice | null = null

  readonly latestReleaseValue = observable.box<LatestReleaseInfo | null>(null, {
    equals: releaseEquals
  })

  isUpdatingLatestRelease = false
  isUpdatingNotice = false
  isUpdatingLeagueServers = false
  isUpdatingSupportedQueues = false
  isUpdatingOngoingGameConfig = false
  isUpdatingAutoSelectGroups = false

  get latestRelease() {
    return this.latestReleaseValue.get()
  }

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

  setLatestRelease(value: LatestReleaseInfo | null) {
    this.latestReleaseValue.set(value)
  }

  setUpdatingLatestRelease(value: boolean) {
    this.isUpdatingLatestRelease = value
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
      latestReleaseValue: observable.ref
    })
  }
}

export class AkariApiSettings {
  updateLatestRelease = true

  setUpdateLatestRelease(value: boolean) {
    this.updateLatestRelease = value
  }

  constructor() {
    makeAutoObservable(this)
  }
}
