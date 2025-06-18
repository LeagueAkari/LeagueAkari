import { SgpServersConfig } from '@shared/data-sources/sgp'
import { GithubApiAsset, GithubApiLatestRelease } from '@shared/types/github'
import { makeAutoObservable, observable } from 'mobx'

interface Announcement {
  content: string
  uniqueId: string
}

export interface LatestReleaseWithMetadata extends GithubApiLatestRelease {
  isNew: boolean
  currentVersion: string
  archiveFile: GithubApiAsset | null
}

export class RemoteConfigState {
  sgpServerConfig: SgpServersConfig
  latestReleaseValue = observable.box<LatestReleaseWithMetadata | null>(null, {
    equals: RemoteConfigState.versionEquals
  })
  announcement: Announcement | null = null

  get latestRelease() {
    return this.latestReleaseValue.get()
  }

  // loading state
  isUpdatingLatestRelease: boolean = false
  isUpdatingAnnouncement: boolean = false
  isUpdatingSgpLeagueServers: boolean = false

  setSgpServerConfig(sgpServerConfig: SgpServersConfig) {
    this.sgpServerConfig = sgpServerConfig
  }

  setLatestRelease(latestRelease: LatestReleaseWithMetadata | null) {
    this.latestReleaseValue.set(latestRelease)
  }

  setAnnouncement(announcement: Announcement | null) {
    this.announcement = announcement
  }

  setUpdatingLatestRelease(isUpdatingLatestRelease: boolean) {
    this.isUpdatingLatestRelease = isUpdatingLatestRelease
  }

  setUpdatingAnnouncement(isUpdatingAnnouncement: boolean) {
    this.isUpdatingAnnouncement = isUpdatingAnnouncement
  }

  setUpdatingSgpLeagueServers(isUpdatingSgpLeagueServers: boolean) {
    this.isUpdatingSgpLeagueServers = isUpdatingSgpLeagueServers
  }

  setEmptySgpLeagueServers() {
    this.sgpServerConfig = {
      version: 0,
      lastUpdate: 0,
      servers: {},
      serverNames: {},
      tencentServerMatchHistoryInteroperability: [],
      tencentServerSpectatorInteroperability: [],
      tencentServerSummonerInteroperability: []
    }
  }

  constructor() {
    this.setEmptySgpLeagueServers()

    makeAutoObservable(this, {
      sgpServerConfig: observable.ref
    })
  }

  static versionEquals(a: LatestReleaseWithMetadata | null, b: LatestReleaseWithMetadata | null) {
    if (a === null && b === null) {
      return true
    }

    if (a === null || b === null) {
      return false
    }

    if (a.isNew !== b.isNew) {
      return false
    }

    return a.currentVersion === b.currentVersion && a.tag_name === b.tag_name
  }
}

export class RemoteConfigSettings {
  preferredSource: 'github' | 'gitee' = 'github'

  setPreferredSource(source: 'github' | 'gitee') {
    this.preferredSource = source
  }

  constructor() {
    makeAutoObservable(this)
  }
}
