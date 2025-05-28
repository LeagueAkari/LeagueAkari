import { SgpServersConfig } from '@shared/data-sources/sgp'
import { GithubApiFile, GithubApiLatestRelease } from '@shared/types/github'
import axios from 'axios'

export interface RemoteConfigRepositoryConfig {
  locale: 'zh-CN' | 'en'
  source: 'github' | 'gitee'
}

export class RemoteGitRepository {
  static readonly GITHUB_API_BASE_URL = 'https://api.github.com'
  static readonly GITEE_API_BASE_URL = 'https://gitee.com/api/v5'

  private _config = {
    locale: 'zh-CN',
    source: 'github'
  }

  private _http = axios.create({})

  constructor(config: Partial<RemoteConfigRepositoryConfig> = {}) {
    this.setConfig(config)
  }

  setConfig(config: Partial<RemoteConfigRepositoryConfig>) {
    this._config = {
      ...this._config,
      ...config
    }

    if (config.source !== undefined) {
      this._http.defaults.baseURL =
        config.source === 'github'
          ? RemoteGitRepository.GITHUB_API_BASE_URL
          : RemoteGitRepository.GITEE_API_BASE_URL
    }
  }

  get config() {
    return this._config
  }

  getAnnouncementContent() {
    return this._http.get<GithubApiFile>(
      `/repos/LeagueAkari/LeagueAkari-Config/contents/announcement/${this._config.locale}.md`
    )
  }

  getSgpLeagueServersConfig() {
    return this._http.get<SgpServersConfig>(
      `/repos/LeagueAkari/LeagueAkari-Config/contents/config/sgp/league-servers.json`
    )
  }

  getReleases(page = 1, perPage = 20) {
    return this._http.get<GithubApiLatestRelease[]>(`/repos/LeagueAkari/LeagueAkari/releases`, {
      params: {
        page,
        per_page: perPage
      }
    })
  }

  getLatestRelease() {
    return this._http.get<GithubApiLatestRelease>(`/repos/LeagueAkari/LeagueAkari/releases/latest`)
  }
}
