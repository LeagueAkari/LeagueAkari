import { SgpServersConfig } from '@shared/data-sources/sgp'
import { GithubApiLatestRelease } from '@shared/types/github'
import { makeAutoObservable, observable } from 'mobx'

interface Announcement {
  content: string
  sha: string
}

export class RemoteConfigState {
  sgpLeagueServers: SgpServersConfig

  latestRelease: GithubApiLatestRelease | null = null

  announcement: Announcement | null = null

  setSgpLeagueServers(sgpLeagueServers: SgpServersConfig) {
    this.sgpLeagueServers = sgpLeagueServers
  }

  setLatestRelease(latestRelease: GithubApiLatestRelease) {
    this.latestRelease = latestRelease
  }

  setAnnouncement(announcement: Announcement | null) {
    this.announcement = announcement
  }

  setEmptySgpLeagueServers() {
    this.sgpLeagueServers = {
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
      sgpLeagueServers: observable.ref,
      latestRelease: observable.ref
    })
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
