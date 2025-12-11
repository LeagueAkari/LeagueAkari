import { USER_AGENT } from '@shared/constants/common'
import { GithubApiFile, GithubApiLatestRelease } from '@shared/types/github'
import { SgpServersConfig } from '@shared/types/shards/sgp'
import axios from 'axios'
import crypto from 'crypto'
import matter from 'gray-matter'

import { InGameSendTemplateCatalog, OngoingGameConfig, SupportedQueues } from './validation'

export type RemoteRepositorySource = 'github' | 'gitee'

export interface RepositoryRequest {
  source: RemoteRepositorySource
  repo: 'akari-config' | 'akari'
}

export interface RepositoryBranchRequest extends RepositoryRequest {
  branch: string
}

export interface AnnouncementRequest extends RepositoryBranchRequest {
  locale: 'zh-CN' | 'en'
}

export interface ReleaseRequest extends RepositoryRequest {
  page?: number
  perPage?: number
}

/**
 * 连接到 LeagueAkari/LeagueAkari-Config 或 LeagueAkari/LeagueAkari 仓库
 */
export class RemoteGitRepository {
  private _http = axios.create({
    headers: { 'User-Agent': USER_AGENT }
  })

  /**
   * 获取 API 地址
   */
  private _apiUrl(uri: string, { source, repo }: RepositoryRequest) {
    if (uri.startsWith('/')) {
      uri = uri.slice(1)
    }

    const r = repo === 'akari-config' ? 'LeagueAkari-Config' : 'LeagueAkari'

    if (source === 'github') {
      return `https://api.github.com/repos/LeagueAkari/${r}/${uri}`
    }

    return `https://gitee.com/api/v5/repos/LeagueAkari/${r}/${uri}`
  }

  private _rawContentUrl(uri: string, { source, repo, branch }: RepositoryBranchRequest) {
    if (uri.startsWith('/')) {
      uri = uri.slice(1)
    }

    const r = repo === 'akari-config' ? 'LeagueAkari-Config' : 'LeagueAkari'

    if (source === 'github') {
      return `https://raw.githubusercontent.com/LeagueAkari/${r}/refs/heads/${branch}/${uri}`
    }

    return `https://gitee.com/LeagueAkari/${r}/raw/${branch}/${uri}`
  }

  static getGitHubApiFileBase64Content(data: GithubApiFile) {
    const { content, encoding } = data

    if (encoding !== 'base64' || !content) {
      throw new Error('Unsupported encoding format')
    }

    return Buffer.from(content, 'base64').toString('utf-8')
  }

  async getAnnouncement(request: AnnouncementRequest) {
    const { locale, ...repoRequest } = request
    const { data: rawData } = await this._http.get<string>(
      this._rawContentUrl(`/announcement/${locale}.md`, repoRequest)
    )

    const { data, content } = matter(rawData)

    return {
      content,
      frontMatter: data,
      uniqueId: crypto.createHash('md5').update(rawData, 'utf8').digest('hex')
    }
  }

  async getSgpLeagueServersConfig(request: RepositoryBranchRequest) {
    const { data } = await this._http.get<SgpServersConfig>(
      this._rawContentUrl(`/config/sgp/league-servers.json`, request)
    )

    return data
  }

  async getInGameSendTemplateCatalog(request: RepositoryBranchRequest) {
    const { data } = await this._http.get<InGameSendTemplateCatalog>(
      this._rawContentUrl(`/config/in-game-send/templates/catalog.json`, request)
    )

    return data
  }

  async getSupportedQueues(request: RepositoryBranchRequest) {
    const { data } = await this._http.get<SupportedQueues>(
      this._rawContentUrl(`/config/sgp/supported-queues.json`, request)
    )

    return data
  }

  async getOngoingGameConfig(request: RepositoryBranchRequest) {
    const { data } = await this._http.get<OngoingGameConfig>(
      this._rawContentUrl(`/config/ongoing-game/config.json`, request)
    )

    return data
  }

  /**
   *
   * @param uri
   * @param request
   * @returns
   */
  getRawContent(uri: string, request: RepositoryBranchRequest) {
    return this._http.get(this._rawContentUrl(uri, request))
  }

  getReleases({ page = 1, perPage = 20, ...request }: ReleaseRequest) {
    return this._http.get<GithubApiLatestRelease[]>(this._apiUrl(`/releases`, request), {
      params: {
        page,
        per_page: perPage
      }
    })
  }

  getLatestRelease(request: RepositoryRequest) {
    return this._http.get<GithubApiLatestRelease>(this._apiUrl(`/releases/latest`, request))
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
