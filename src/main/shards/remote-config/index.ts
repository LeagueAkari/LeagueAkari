import { IntervalTask } from '@main/utils/timer'
import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { GithubApiLatestRelease } from '@shared/types/github'
import {
  leagueServersConfigV1Schema,
  ongoingGameConfigV1Schema,
  supportedQueuesV1Schema
} from '@shared/validators/remote-config'
import { isAxiosError } from 'axios'
import dayjs from 'dayjs'
import { app } from 'electron'
import { comparer } from 'mobx'
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

  static SUPPORTED_QUEUES_RELATIVE_PATH = 'sgp/supported-queues.json'
  static LEAGUE_SERVERS_RELATIVE_PATH = 'sgp/league-servers.json'
  static ONGOING_GAME_CONFIG_RELATIVE_PATH = 'ongoing-game/config.json'

  private _repo = new RemoteGitRepository()

  get repo() {
    return this._repo
  }

  private readonly _log: AkariLogger
  private readonly _setting: SetterSettingService

  // locale / source changed will trigger this task
  private _announcementTask = new IntervalTask(
    this._updateAnnouncementFromRemote.bind(this),
    { interval: 4 * 60 * 60 * 1000 } // 4 hours
  )

  // locale / source changed will trigger this task
  private _latestReleaseTask = new IntervalTask(
    this._updateLatestReleaseFromRemote.bind(this),
    { interval: 4 * 60 * 60 * 1000 } // 4 hours
  )

  // only source changed will trigger this task
  private _leagueServersTask = new IntervalTask(
    this._updateLeagueServersFromRemoteAndSave.bind(this),
    { interval: 2 * 60 * 60 * 1000 } // 2 hours
  )

  private _supportedQueuesTask = new IntervalTask(
    this._updateSupportedQueuesFromRemoteAndSave.bind(this),
    { interval: 2 * 60 * 60 * 1000 } // 2 hours
  )

  private _ongoingGameConfigTask = new IntervalTask(
    this._updateOngoingGameConfigFromRemoteAndSave.bind(this),
    { interval: 2 * 60 * 60 * 1000 } // 2 hours
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
      'leagueServers',
      'supportedQueues',
      'ongoingGameConfig',
      'isUpdatingLatestRelease',
      'isUpdatingAnnouncement',
      'isUpdatingLeagueServers',
      'isUpdatingSupportedQueues',
      'isUpdatingOngoingGameConfig'
    ])

    this._mobx.propSync(RemoteConfigMain.id, 'settings', this.settings, [
      'preferredSource',
      'updateLatestRelease'
    ])

    await this._initConfigFilesFromLocal()

    this._handleIpcCall()
    this._handlePeriodicTasksUpdate()
  }

  private _handleIpcCall() {
    this._ipc.onCall(RemoteConfigMain.id, 'testLatency', () => {
      return this.testLatency()
    })
  }

  /**
   * 从已缓存的数据中获取部分配置
   */
  private async _initConfigFilesFromLocal() {
    if (await this._setting.jsonConfigFileExists(RemoteConfigMain.SUPPORTED_QUEUES_RELATIVE_PATH)) {
      const rawJson = await this._setting.readFromJsonConfigFile(
        RemoteConfigMain.SUPPORTED_QUEUES_RELATIVE_PATH
      )
      const { success, data, error } = supportedQueuesV1Schema.safeParse(rawJson)

      if (success) {
        this.state.setSupportedQueues(data)
      } else {
        this._log.warn('Invalid supported queues json', error)
      }
    }

    if (await this._setting.jsonConfigFileExists(RemoteConfigMain.LEAGUE_SERVERS_RELATIVE_PATH)) {
      const rawJson = await this._setting.readFromJsonConfigFile(
        RemoteConfigMain.LEAGUE_SERVERS_RELATIVE_PATH
      )
      const { success, data, error } = leagueServersConfigV1Schema.safeParse(rawJson)

      if (success) {
        this.state.setSgpServerConfig(data)
      } else {
        this._log.warn('Invalid sgp league servers json', error)
      }
    }

    if (
      await this._setting.jsonConfigFileExists(RemoteConfigMain.ONGOING_GAME_CONFIG_RELATIVE_PATH)
    ) {
      const rawJson = await this._setting.readFromJsonConfigFile(
        RemoteConfigMain.ONGOING_GAME_CONFIG_RELATIVE_PATH
      )
      const { success, data, error } = ongoingGameConfigV1Schema.safeParse(rawJson)

      if (success) {
        this.state.setOngoingGameConfig(data)
      } else {
        this._log.warn('Invalid ongoing game config json', error)
      }
    }
  }

  /**
   * 更新公告，不会保存到本地
   */
  private async _updateAnnouncementFromRemote() {
    if (this.state.isUpdatingAnnouncement) {
      return
    }

    this.state.setUpdatingAnnouncement(true)

    try {
      const locale = this._app.settings.locale as 'zh-CN' | 'en'
      const content = await this._repo.getAnnouncement({
        source: this.settings.preferredSource,
        repo: 'akari-config',
        branch: 'main',
        locale
      })
      this.state.setAnnouncement(content)
      this._log.info('Updated Announcement', this.settings.preferredSource)
    } catch (error) {
      if (this._checkIfReachRateLimit(error)) {
        return
      }

      this._log.warn('Update Announcement failed', error)
    } finally {
      this.state.setUpdatingAnnouncement(false)
    }
  }

  /**
   * 更新最新版本，不会保存到本地
   */
  private async _updateLatestReleaseFromRemote() {
    if (this.state.isUpdatingLatestRelease) {
      return
    }

    this.state.setUpdatingLatestRelease(true)

    try {
      const { data } = await this._repo.getLatestRelease({
        source: this.settings.preferredSource,
        repo: 'akari'
      })
      this.state.setLatestRelease(await this._addMoreInfoToRelease(data))

      this._log.info('Updated Latest Release', this.settings.preferredSource)
    } catch (error) {
      if (this._checkIfReachRateLimit(error)) {
        return
      }

      this._log.warn('Update Latest Release failed', error)
    } finally {
      this.state.setUpdatingLatestRelease(false)
    }
  }

  /**
   * 手动执行一次独立的版本更新检查。这不会计入到全局的 loading 状态中
   *
   * 但是如果查询成功，则会立即替换当前的 latestRelease，同时重启定时任务
   */
  async updateLatestReleaseManually() {
    this._latestReleaseTask.cancel()

    this._log.info('Updating Latest Release.. Manually', this.settings.preferredSource)

    const { data } = await this._repo.getLatestRelease({
      source: this.settings.preferredSource,
      repo: 'akari'
    })

    const release = await this._addMoreInfoToRelease(data)
    this.state.setLatestRelease(release)
    this._latestReleaseTask.start()

    return release
  }

  /**
   * 更新支持的队列，会缓存到本地
   */
  private async _updateSupportedQueuesFromRemoteAndSave() {
    if (this.state.isUpdatingSupportedQueues) {
      return
    }

    this.state.setUpdatingSupportedQueues(true)

    try {
      const { data: remoteData } = await this._repo.getSupportedQueues({
        repo: 'akari-config',
        source: this.settings.preferredSource
      })

      const { success, data, error } = supportedQueuesV1Schema.safeParse(remoteData)

      if (success) {
        if (data.lastUpdate > this.state.supportedQueues.lastUpdate) {
          this.state.setSupportedQueues(data)
          await this._setting.writeToJsonConfigFile(
            RemoteConfigMain.SUPPORTED_QUEUES_RELATIVE_PATH,
            data
          )
          this._log.info(
            'Updated supported queues from remote',
            dayjs(data.lastUpdate).format('YYYY-MM-DD HH:mm:ss')
          )
        } else {
          this._log.info(
            'Supported queues is up to date',
            dayjs(data.lastUpdate).format('YYYY-MM-DD HH:mm:ss')
          )
        }
      } else {
        this._log.warn('Invalid supported queues json', error)
      }
    } catch (error) {
      if (this._checkIfReachRateLimit(error)) {
        return
      }

      this._log.warn('Update Supported Queues from remote failed', error)
    } finally {
      this.state.setUpdatingSupportedQueues(false)
    }
  }

  /**
   * 更新 SGP 联赛服务器，会缓存到本地
   */
  private async _updateLeagueServersFromRemoteAndSave() {
    if (this.state.isUpdatingLeagueServers) {
      return
    }

    this.state.setUpdatingLeagueServers(true)

    try {
      const { data: remoteData } = await this._repo.getSgpLeagueServersConfig({
        source: this.settings.preferredSource,
        repo: 'akari-config',
        branch: 'main'
      })

      const { success, data, error } = leagueServersConfigV1Schema.safeParse(remoteData)

      if (success) {
        if (data.lastUpdate > this.state.leagueServers.lastUpdate) {
          this.state.setSgpServerConfig(data)
          await this._setting.writeToJsonConfigFile(
            RemoteConfigMain.LEAGUE_SERVERS_RELATIVE_PATH,
            data
          )
          this._log.info(
            'Updated sgp league servers from remote',
            dayjs(data.lastUpdate).format('YYYY-MM-DD HH:mm:ss')
          )
        } else {
          this._log.info(
            'Sgp league servers is up to date',
            dayjs(data.lastUpdate).format('YYYY-MM-DD HH:mm:ss')
          )
        }
      } else {
        this._log.warn('Invalid sgp league servers json', error)
      }
    } catch (error) {
      if (this._checkIfReachRateLimit(error)) {
        return
      }

      this._log.warn('Update Sgp League Servers failed', error)
    } finally {
      this.state.setUpdatingLeagueServers(false)
    }
  }

  /**
   * 更新对局模块的配置，会缓存到本地
   */
  private async _updateOngoingGameConfigFromRemoteAndSave() {
    if (this.state.isUpdatingOngoingGameConfig) {
      return
    }

    this.state.setUpdatingOngoingGameConfig(true)

    try {
      const { data: remoteData } = await this._repo.getOngoingGameConfig({
        source: this.settings.preferredSource,
        repo: 'akari-config',
        branch: 'main'
      })

      const { success, data, error } = ongoingGameConfigV1Schema.safeParse(remoteData)

      if (success) {
        if (data.lastUpdate > this.state.ongoingGameConfig.lastUpdate) {
          this.state.setOngoingGameConfig(data)
          await this._setting.writeToJsonConfigFile(
            RemoteConfigMain.ONGOING_GAME_CONFIG_RELATIVE_PATH,
            data
          )
          this._log.info(
            'Updated ongoing game config from remote',
            dayjs(data.lastUpdate).format('YYYY-MM-DD HH:mm:ss')
          )
        } else {
          this._log.info(
            'Ongoing game config is up to date',
            dayjs(data.lastUpdate).format('YYYY-MM-DD HH:mm:ss')
          )
        }
      } else {
        this._log.warn('Invalid ongoing game config json', error)
      }
    } catch (error) {
      if (this._checkIfReachRateLimit(error)) {
        return
      }

      this._log.warn('Update Ongoing Game Config failed', error)
    } finally {
      this.state.setUpdatingOngoingGameConfig(false)
    }
  }

  private _handlePeriodicTasksUpdate() {
    // 源切换时需要重新获取支持的队列、league servers 和对局模块配置
    this._mobx.reaction(
      () => this.settings.preferredSource,
      (_source) => {
        this._supportedQueuesTask.start({ runImmediately: true })
        this._leagueServersTask.start({ runImmediately: true })
        this._ongoingGameConfigTask.start({ runImmediately: true })
      },
      { fireImmediately: true }
    )

    // 语言和源切换时需要重新获取公告
    this._mobx.reaction(
      () => ({
        source: this.settings.preferredSource,
        locale: this._app.settings.locale
      }),
      () => {
        this._announcementTask.start({ runImmediately: true })
      },
      { fireImmediately: true, equals: comparer.shallow }
    )

    // 版本更新开关切换时需要重新获取版本更新
    this._mobx.reaction(
      () => ({
        source: this.settings.preferredSource,
        locale: this._app.settings.locale,
        updateLatestRelease: this.settings.updateLatestRelease
      }),
      ({ updateLatestRelease }) => {
        if (updateLatestRelease) {
          this._latestReleaseTask.start({ runImmediately: true })
        } else {
          this._latestReleaseTask.cancel()
        }
      },
      { fireImmediately: true, equals: comparer.shallow }
    )
  }
}
