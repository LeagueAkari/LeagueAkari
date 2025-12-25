import { GithubApiAsset, GithubApiLatestRelease } from '@shared/types/github'
import {
  LeagueServersConfig,
  OngoingGameConfig,
  SupportedQueues
} from '@shared/validators/remote-config'
import { makeAutoObservable, observable } from 'mobx'

import {
  BUILTIN_ONGOING_GAME_CONFIG,
  BUILTIN_SGP_LEAGUE_SERVERS_CONFIG,
  BUILTIN_SUPPORTED_QUEUES
} from './builtin'

interface Announcement {
  content: string
  uniqueId: string
}

export interface LatestReleaseWithMetadata extends GithubApiLatestRelease {
  source: 'github' | 'gitee'
  isNew: boolean
  currentVersion: string
  detailedChangelog: string | null
  archiveFile: GithubApiAsset | null
}

function releaseEquals(a: LatestReleaseWithMetadata | null, b: LatestReleaseWithMetadata | null) {
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

  return a.currentVersion === b.currentVersion && a.tag_name === b.tag_name
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
   * 对局分析模块的一些元信息指导
   */
  ongoingGameConfig = BUILTIN_ONGOING_GAME_CONFIG

  /**
   * latestRelease 的值，用于添加自定义 equals 方法
   */
  latestReleaseValue = observable.box<LatestReleaseWithMetadata | null>(null, {
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

  setLeagueServers(leagueServers: LeagueServersConfig) {
    this.leagueServers = leagueServers
  }

  setLatestRelease(latestRelease: LatestReleaseWithMetadata | null) {
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

  constructor() {
    makeAutoObservable(this, {
      leagueServers: observable.ref,
      supportedQueues: observable.ref,
      ongoingGameConfig: observable.ref,
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
