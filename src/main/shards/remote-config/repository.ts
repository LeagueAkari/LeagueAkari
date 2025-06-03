import { SgpServersConfig } from '@shared/data-sources/sgp'
import { GithubApiFile, GithubApiLatestRelease } from '@shared/types/github'
import axios from 'axios'
import crypto from 'crypto'

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

  private _http = axios.create({
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0 OPR/105.0.0.0'
    }
  })

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

  private static _getGitHubApiFileBase64Content(data: GithubApiFile) {
    const { content, encoding } = data

    if (encoding !== 'base64' || !content) {
      throw new Error('Unsupported encoding format')
    }

    return Buffer.from(content, 'base64').toString('utf-8')
  }

  async getAnnouncement() {
    const { data } = await this._http.get<GithubApiFile>(
      `/repos/LeagueAkari/LeagueAkari-Config/contents/announcement/${this._config.locale}.md`
    )

    const content = RemoteGitRepository._getGitHubApiFileBase64Content(data)

    return {
      content,
      uniqueId: crypto.createHash('md5').update(content, 'utf8').digest('hex')
    }
  }

  async getSgpLeagueServersConfig() {
    const { data } = await this._http.get<GithubApiFile>(
      `/repos/LeagueAkari/LeagueAkari-Config/contents/config/sgp/league-servers.json`
    )

    const raw = RemoteGitRepository._getGitHubApiFileBase64Content(data)
    const json = JSON.parse(raw)

    return json as SgpServersConfig
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

  async testGitHubLatency() {
    try {
      const start = Date.now()
      await this._http.head(RemoteGitRepository.GITHUB_API_BASE_URL, {
        timeout: 2000,
        validateStatus: () => true
      })

      return Date.now() - start
    } catch (error) {
      return -1
    }
  }

  async testGiteeLatency() {
    try {
      const start = Date.now()
      await this._http.head(RemoteGitRepository.GITEE_API_BASE_URL, {
        timeout: 2000,
        validateStatus: () => true
      })

      return Date.now() - start
    } catch (error) {
      return -1
    }
  }
}
