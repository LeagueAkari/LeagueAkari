import { IntervalTask } from '@main/utils/timer'
import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { GithubApiLatestRelease } from '@shared/types/github'
import { isAxiosError } from 'axios'
import { app } from 'electron'
import { gt } from 'semver'

import { AppCommonMain } from '../app-common'
import { AkariIpcMain } from '../ipc'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { RemoteGitRepository } from './repository'
import { LatestReleaseWithMetadata, RemoteConfigSettings, RemoteConfigState } from './state'

export interface RemoteTaskConfig {
  /** 间隔毫秒数 */
  interval: number

  /**
   * 当 persist 为 true 是，此选项有效
   */
  updateOnStartup: boolean

  /** 是否需要持久化 */
  persist: boolean

  /** 当数据更新时进行同步 */
  onUpdate: (value: unknown) => void

  /** 更新时发生错误回调 */
  onError: (error: unknown) => void
}

/**
 * 从 GitHub / Gitee 获取数据, 并提供给其他模块使用
 *
 * TODO NEED MIGRATION
 */
@Shard(RemoteConfigMain.id)
export class RemoteConfigMain implements IAkariShardInitDispose {
  static readonly id = 'remote-config-main'

  public readonly state = new RemoteConfigState()
  public readonly settings = new RemoteConfigSettings()

  private _repo = new RemoteGitRepository()

  get repo() {
    return this._repo
  }

  private readonly _log: AkariLogger
  private readonly _setting: SetterSettingService

  // only source changed will trigger this task
  private _updateSgpLeagueServersTask = new IntervalTask(
    this._updateSgpLeagueServers.bind(this),
    2 * 60 * 60 * 1000 // 2 hours
  )

  // locale / source changed will trigger this task
  private _updateAnnouncementTask = new IntervalTask(
    this._updateAnnouncement.bind(this),
    4 * 60 * 60 * 1000 // 4 hours
  )

  // locale / source changed will trigger this task
  private _updateLatestReleaseTask = new IntervalTask(
    this._updateLatestRelease.bind(this),
    4 * 60 * 60 * 1000 // 4 hours
  )

  constructor(
    _loggerFactory: LoggerFactoryMain,
    _settingFactory: SettingFactoryMain,
    private readonly _mobx: MobxUtilsMain,
    private readonly _ipc: AkariIpcMain,
    private readonly _app: AppCommonMain
  ) {
    this._log = _loggerFactory.create(RemoteConfigMain.id)
    this._setting = _settingFactory.register(
      RemoteConfigMain.id,
      {
        // China mainland use gitee for better performance
        // due to Great Food Wallet
        preferredSource: {
          default: Intl.DateTimeFormat()
            .resolvedOptions()
            .locale.toLocaleLowerCase()
            .includes('zh-cn')
            ? 'gitee'
            : 'github'
        }
      },
      this.settings
    )
  }

  private async _addMoreInfoToRelease(
    release: GithubApiLatestRelease
  ): Promise<LatestReleaseWithMetadata> {
    const isNew = gt(release.tag_name, app.getVersion())
    const currentVersion = app.getVersion()
    const locale = this._app.settings.locale as 'zh-CN' | 'en'
    const configRepoRequest = {
      source: this.settings.preferredSource,
      repo: 'akari-config' as const,
      branch: 'main'
    }

    let detailedChangelog: string | null = null
    try {
      const { data } = await this.repo.getRawContent(
        `/releases/${release.tag_name}/${locale}.md`,
        configRepoRequest
      )

      detailedChangelog = data
    } catch (error) {
      this._log.warn('Failed to get changelog', error)
    }

    let archiveFile = release.assets.find((a) => {
      return a.content_type === 'application/x-compressed'
    })

    if (archiveFile) {
      return { ...release, archiveFile, isNew, currentVersion, detailedChangelog }
    }

    // compatibility with gitee
    archiveFile = release.assets.find((a) => {
      return a.browser_download_url.endsWith('win.7z') || a.browser_download_url.endsWith('win.zip')
    })

    if (archiveFile) {
      return { ...release, archiveFile, isNew, currentVersion, detailedChangelog }
    }

    return { ...release, isNew, archiveFile: null, currentVersion, detailedChangelog }
  }

  private _checkIfReachRateLimit(error: unknown) {
    if (
      isAxiosError(error) &&
      error.status === 403 &&
      typeof error.response?.data === 'string' &&
      error.response?.data.toLowerCase().includes('rate limit exceeded')
    ) {
      this._log.warn('Rate limit exceeded', error.config?.url, error.config?.method)
      return true
    }

    return false
  }

  private async _updateSgpLeagueServers() {
    try {
      this.state.setUpdatingSgpLeagueServers(true)
      const source = this.settings.preferredSource
      this._log.info('Updating Sgp League Servers', source)
      const config = await this._repo.getSgpLeagueServersConfig({
        source,
        repo: 'akari-config',
        branch: 'main'
      })
      this.state.setSgpServerConfig(config)
    } catch (error) {
      if (this._checkIfReachRateLimit(error)) {
        return
      }

      this._log.warn('Update Sgp League Servers failed', error)
    } finally {
      this.state.setUpdatingSgpLeagueServers(false)
    }
  }

  private async _updateAnnouncement() {
    try {
      this.state.setUpdatingAnnouncement(true)
      const source = this.settings.preferredSource
      const locale = this._app.settings.locale as 'zh-CN' | 'en'
      this._log.info('Updating Announcement', source)
      const content = await this._repo.getAnnouncement({
        source,
        repo: 'akari-config',
        branch: 'main',
        locale
      })
      this.state.setAnnouncement(content)
    } catch (error) {
      if (this._checkIfReachRateLimit(error)) {
        return
      }

      this._log.warn('Update Announcement failed', error)
    } finally {
      this.state.setUpdatingAnnouncement(false)
    }
  }

  private async _updateLatestRelease() {
    try {
      this.state.setUpdatingLatestRelease(true)
      const source = this.settings.preferredSource
      this._log.info('Updating Latest Release', source)
      const { data } = await this._repo.getLatestRelease({ source, repo: 'akari' })
      this.state.setLatestRelease(await this._addMoreInfoToRelease(data))
    } catch (error) {
      if (this._checkIfReachRateLimit(error)) {
        return
      }

      this._log.warn('Update Latest Release failed', error)
    } finally {
      this.state.setUpdatingLatestRelease(false)
    }
  }

  async updateLatestReleaseManually() {
    this._updateLatestReleaseTask.cancel()

    try {
      this.state.setUpdatingLatestRelease(true)
      const source = this.settings.preferredSource
      this._log.info('Updating Latest Release.. Manually', source)
      const { data } = await this._repo.getLatestRelease({ source, repo: 'akari' })
      const release = await this._addMoreInfoToRelease(data)
      this.state.setLatestRelease(release)

      return release
    } catch (error) {
      throw error
    } finally {
      this.state.setUpdatingLatestRelease(false)
      this._updateLatestReleaseTask.start() // restart the task
    }
  }

  /**
   * 三次平均值
   */
  async testLatency() {
    const githubLatencies: number[] = []
    const giteeLatencies: number[] = []

    for (let i = 0; i < 3; i++) {
      const [gh, gi] = await Promise.all([
        this._repo.testGitHubLatency().catch(() => -1),
        this._repo.testGiteeLatency().catch(() => -1)
      ])

      if (gh !== -1) {
        githubLatencies.push(gh)
      }

      if (gi !== -1) {
        giteeLatencies.push(gi)
      }
    }

    return {
      githubLatency: githubLatencies.reduce((a, b) => a + b, 0) / githubLatencies.length,
      giteeLatency: giteeLatencies.reduce((a, b) => a + b, 0) / giteeLatencies.length
    }
  }

  async onInit() {
    await this._setting.applyToState()

    this._mobx.propSync(RemoteConfigMain.id, 'state', this.state, [
      'announcement',
      'latestRelease',
      // 'sgpServerConfig', // 目前仅涉及到主进程内数据共享, 无需发送到渲染进程
      'isUpdatingLatestRelease',
      'isUpdatingAnnouncement',
      'isUpdatingSgpLeagueServers'
    ])
    this._mobx.propSync(RemoteConfigMain.id, 'settings', this.settings, [
      'preferredSource',
      'updateLatestRelease'
    ])

    this._handleIpcCall()

    this._updateAnnouncementTask.start(true)
    this._updateSgpLeagueServersTask.start(true)

    this._mobx.reaction(
      () => this.settings.updateLatestRelease,
      (updateLatestRelease) => {
        if (updateLatestRelease) {
          this._updateLatestReleaseTask.start(true)
        } else {
          this._updateLatestReleaseTask.cancel()
        }
      },
      { fireImmediately: true }
    )

    this._mobx.reaction(
      () => this._app.settings.locale,
      (locale) => {
        this.state.setAnnouncement(null)
        this._updateAnnouncementTask.start(true)

        if (this.settings.updateLatestRelease) {
          this._updateLatestReleaseTask.start(true)
        }
      },
      { delay: 1000 }
    )

    this._mobx.reaction(
      () => this.settings.preferredSource,
      (source) => {
        this.state.setLatestRelease(null)
        this.state.setAnnouncement(null)
        this._updateAnnouncementTask.start(true)
        this._updateSgpLeagueServersTask.start(true)

        if (this.settings.updateLatestRelease) {
          this._updateLatestReleaseTask.start(true)
        }
      },
      { delay: 1000 }
    )
  }

  private _handleIpcCall() {
    this._ipc.onCall(RemoteConfigMain.id, 'testLatency', async () => {
      return await this.testLatency()
    })
  }
}
