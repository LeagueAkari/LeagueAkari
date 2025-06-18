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

  private readonly _log: AkariLogger
  private readonly _setting: SetterSettingService

  private _updateSgpLeagueServersTask = new IntervalTask(
    () => this._updateSgpLeagueServers(),
    2 * 60 * 60 * 1000 // 2 hours
  )

  private _updateAnnouncementTask = new IntervalTask(
    () => this._updateAnnouncement(),
    4 * 60 * 60 * 1000 // 4 hours
  )

  private _updateLatestReleaseTask = new IntervalTask(
    () => this._updateLatestRelease(),
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

  private _addMoreInfoToRelease(release: GithubApiLatestRelease): LatestReleaseWithMetadata {
    const isNew = gt(release.tag_name, app.getVersion())
    const currentVersion = app.getVersion()

    let archiveFile = release.assets.find((a) => {
      return a.content_type === 'application/x-compressed'
    })

    if (archiveFile) {
      return { ...release, archiveFile, isNew, currentVersion }
    }

    // compatibility with gitee
    archiveFile = release.assets.find((a) => {
      return a.browser_download_url.endsWith('win.7z') || a.browser_download_url.endsWith('win.zip')
    })

    if (archiveFile) {
      return { ...release, archiveFile, isNew, currentVersion }
    }

    return { ...release, isNew, archiveFile: null, currentVersion }
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
      this._log.info('Updating Sgp League Servers', this._repo.config.source)
      const config = await this._repo.getSgpLeagueServersConfig()
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
      this._log.info('Updating Announcement', this._repo.config.source)
      const content = await this._repo.getAnnouncement()
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
      this._log.info('Updating Latest Release', this._repo.config.source)
      const { data } = await this._repo.getLatestRelease()
      this.state.setLatestRelease(this._addMoreInfoToRelease(data))
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
      this._log.info('Updating Latest Release.. Manually', this._repo.config.source)
      const { data } = await this._repo.getLatestRelease()
      const release = this._addMoreInfoToRelease(data)
      this.state.setLatestRelease(release)

      return release
    } catch (error) {
      throw error
    } finally {
      this.state.setUpdatingLatestRelease(false)
      this._updateLatestReleaseTask.start() // restart the task
    }
  }

  async testLatency() {
    const [githubLatency, giteeLatency] = await Promise.all([
      this._repo.testGitHubLatency(),
      this._repo.testGiteeLatency()
    ])

    return { githubLatency, giteeLatency }
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
    this._mobx.propSync(RemoteConfigMain.id, 'settings', this.settings, ['preferredSource'])

    this._repo.setConfig({
      locale: this._app.settings.locale as 'zh-CN' | 'en',
      source: this.settings.preferredSource
    })

    this._ipc.onCall(RemoteConfigMain.id, 'testLatency', async () => {
      return await this.testLatency()
    })

    this._updateAnnouncementTask.start(true)
    this._updateSgpLeagueServersTask.start(true)
    this._updateLatestReleaseTask.start(true)

    this._mobx.reaction(
      () => this._app.settings.locale,
      (locale) => {
        this._repo.setConfig({ locale: locale as 'zh-CN' | 'en' })
        this.state.setAnnouncement(null)
        this._updateAnnouncementTask.start(true)
      },
      { delay: 1000 }
    )

    this._mobx.reaction(
      () => this.settings.preferredSource,
      (source) => {
        this._repo.setConfig({ source })
        this.state.setLatestRelease(null)
        this.state.setAnnouncement(null)
        this._updateAnnouncementTask.start(true)
        this._updateSgpLeagueServersTask.start(true)
        this._updateLatestReleaseTask.start(true)
      },
      { delay: 1000 }
    )
  }
}
