import { SgpServersConfig } from '@shared/data-sources/sgp'
import { GithubApiFile, GithubApiLatestRelease } from '@shared/types/github'
import axios from 'axios'
import crypto from 'crypto'

export interface RemoteConfigRepositoryConfig {
  locale: 'zh-CN' | 'en'
  source: 'github' | 'gitee'
}

export interface InGameSendTemplateCatalog {
  templates: Array<{
    id: string
    name: string
    type: string
    description: string
    version: number
    path: string
  }>
}

/**
 * 连接到 LeagueAkari/LeagueAkari-Config 或 LeagueAkari/LeagueAkari 仓库
 */
export class RemoteGitRepository {
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

  /**
   * 获取 API 地址
   */
  private _apiUrl(uri: string, repo: 'akari-config' | 'akari' = 'akari-config') {
    if (uri.startsWith('/')) {
      uri = uri.slice(1)
    }

    const r = repo === 'akari-config' ? 'LeagueAkari-Config' : 'LeagueAkari'

    if (this._config.source === 'github') {
      return `https://api.github.com/repos/LeagueAkari/${r}/${uri}`
    }

    return `https://gitee.com/api/v5/repos/LeagueAkari/${r}/${uri}`
  }

  private _rawContentUrl(
    uri: string,
    repo: 'akari-config' | 'akari' = 'akari-config',
    branch = 'main'
  ) {
    if (uri.startsWith('/')) {
      uri = uri.slice(1)
    }

    const r = repo === 'akari-config' ? 'LeagueAkari-Config' : 'LeagueAkari'

    if (this._config.source === 'github') {
      return `https://raw.githubusercontent.com/LeagueAkari/${r}/refs/heads/${branch}/${uri}`
    }

    return `https://gitee.com/LeagueAkari/${r}/raw/${branch}/${uri}`
  }

  setConfig(config: Partial<RemoteConfigRepositoryConfig>) {
    this._config = {
      ...this._config,
      ...config
    }
  }

  get config() {
    return this._config
  }

  static getGitHubApiFileBase64Content(data: GithubApiFile) {
    const { content, encoding } = data

    if (encoding !== 'base64' || !content) {
      throw new Error('Unsupported encoding format')
    }

    return Buffer.from(content, 'base64').toString('utf-8')
  }

  async getAnnouncement() {
    const { data } = await this._http.get<string>(
      this._rawContentUrl(`/announcement/${this._config.locale}.md`)
    )

    return {
      content: data,
      uniqueId: crypto.createHash('md5').update(data, 'utf8').digest('hex')
    }
  }

  async getSgpLeagueServersConfig() {
    const { data } = await this._http.get<SgpServersConfig>(
      this._rawContentUrl(`/config/sgp/league-servers.json`)
    )

    return data
  }

  async getInGameSendTemplateCatalog() {
    const { data } = await this._http.get<InGameSendTemplateCatalog>(
      this._rawContentUrl(`/config/in-game-send/templates/catalog.json`)
    )

    return data
  }

  /**
   *
   * @param uri
   * @param repo default is akari-config
   * @param branch default is main
   * @returns
   */
  getRawContent(uri: string, repo: 'akari-config' | 'akari' = 'akari-config', branch = 'main') {
    return this._http.get(this._rawContentUrl(uri, repo, branch))
  }

  getReleases(page = 1, perPage = 20) {
    return this._http.get<GithubApiLatestRelease[]>(this._apiUrl(`/releases`, 'akari'), {
      params: {
        page,
        per_page: perPage
      }
    })
  }

  getLatestRelease() {
    return this._http.get<GithubApiLatestRelease>(this._apiUrl(`/releases/latest`, 'akari'))
  }

  async testGitHubLatency() {
    try {
      const start = Date.now()
      await this._http.head('https://api.github.com', {
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
      await this._http.head('https://gitee.com/api/v5', {
        timeout: 2000,
        validateStatus: () => true
      })

      return Date.now() - start
    } catch (error) {
      return -1
    }
  }
}
