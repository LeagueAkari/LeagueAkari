import {
  AutoSelectGroups,
  LeagueServersConfig,
  OngoingGameConfig,
  SupportedQueues
} from '@shared/schemas/remote-config'
import { LatestReleaseInfo } from '@shared/types/akari'
import { makeAutoObservable, observable } from 'mobx'

import {
  BUILTIN_AUTO_SELECT_GROUPS,
  BUILTIN_ONGOING_GAME_CONFIG,
  BUILTIN_SGP_LEAGUE_SERVERS_CONFIG,
  BUILTIN_SUPPORTED_QUEUES
} from './builtin'

interface Announcement {
  content: string
  uniqueId: string
}

function releaseEquals(a: LatestReleaseInfo | null, b: LatestReleaseInfo | null) {
  if (a === null && b === null) {
    return true
  }

  if (a === null || b === null) {
    return false
  }

  if (a.isNew !== b.isNew) {
    return false
  }

  if (a.source !== b.source) {
    return false
  }

  return a.currentVersion === b.currentVersion && a.version === b.version
}
export class RemoteConfigState {
  /**
   * 可用的关于 league servers 的配置
   */
  leagueServers = BUILTIN_SGP_LEAGUE_SERVERS_CONFIG

  /**
   * 预定义的可查询队列设置
   */
  supportedQueues = BUILTIN_SUPPORTED_QUEUES

  /**
   * 对局模块的一些元信息指导
   */
  ongoingGameConfig = BUILTIN_ONGOING_GAME_CONFIG

  /**
   * 自动选择组配置
   */
  autoSelectGroups = BUILTIN_AUTO_SELECT_GROUPS

  /**
   * latestRelease 的值，用于添加自定义 equals 方法
   */
  latestReleaseValue = observable.box<LatestReleaseInfo | null>(null, {
    equals: releaseEquals
  })

  /**
   * 公告内容
   */
  announcement: Announcement | null = null

  get latestRelease() {
    return this.latestReleaseValue.get()
  }

  // loading state
  isUpdatingLatestRelease: boolean = false
  isUpdatingAnnouncement: boolean = false
  isUpdatingLeagueServers: boolean = false
  isUpdatingSupportedQueues: boolean = false
  isUpdatingOngoingGameConfig: boolean = false
  isUpdatingAutoSelectGroups: boolean = false

  setLeagueServers(leagueServers: LeagueServersConfig) {
    this.leagueServers = leagueServers
  }

  setLatestRelease(latestRelease: LatestReleaseInfo | null) {
    this.latestReleaseValue.set(latestRelease)
  }

  setAnnouncement(announcement: Announcement | null) {
    this.announcement = announcement
  }

  setSupportedQueues(supportedQueues: SupportedQueues) {
    this.supportedQueues = supportedQueues
  }

  setOngoingGameConfig(ongoingGameConfig: OngoingGameConfig) {
    this.ongoingGameConfig = ongoingGameConfig
  }

  setAutoSelectGroups(autoSelectGroups: AutoSelectGroups) {
    this.autoSelectGroups = autoSelectGroups
  }

  setUpdatingLatestRelease(isUpdatingLatestRelease: boolean) {
    this.isUpdatingLatestRelease = isUpdatingLatestRelease
  }

  setUpdatingAnnouncement(isUpdatingAnnouncement: boolean) {
    this.isUpdatingAnnouncement = isUpdatingAnnouncement
  }

  setUpdatingLeagueServers(isUpdating: boolean) {
    this.isUpdatingLeagueServers = isUpdating
  }

  setUpdatingSupportedQueues(isUpdating: boolean) {
    this.isUpdatingSupportedQueues = isUpdating
  }

  setUpdatingOngoingGameConfig(isUpdating: boolean) {
    this.isUpdatingOngoingGameConfig = isUpdating
  }

  setUpdatingAutoSelectGroups(isUpdating: boolean) {
    this.isUpdatingAutoSelectGroups = isUpdating
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

export class RemoteConfigSettings {
  preferredSource: 'github' | 'gitee' = 'github'

  updateLatestRelease: boolean = true

  setPreferredSource(source: 'github' | 'gitee') {
    this.preferredSource = source
  }

  setUpdateLatestRelease(updateLatestRelease: boolean) {
    this.updateLatestRelease = updateLatestRelease
  }

  constructor() {
    makeAutoObservable(this)
  }
}
