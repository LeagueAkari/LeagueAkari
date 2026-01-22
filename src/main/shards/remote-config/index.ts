import { IntervalTask } from '@main/utils/timer'
import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { AkariApiHttpApiAxiosHelper } from '@shared/http-api-axios-helper/akari/api'
import {
  AutoSelectGroupsV1Schema,
  LeagueServersConfigV2Schema,
  OngoingGameConfigV1Schema,
  ReleaseOverridesPlainObjectSchema,
  SupportedQueuesV1Schema
} from '@shared/schemas/remote-config'
import { LatestReleaseInfo, ReleaseArchiveFile } from '@shared/types/akari'
import { GithubApiLatestRelease } from '@shared/types/github'
import axios, { isAxiosError } from 'axios'
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
import { RemoteConfigSettings, RemoteConfigState } from './state'

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
  static AUTO_SELECT_GROUPS_RELATIVE_PATH = 'auto-select/groups.json'

  private _repo = new RemoteGitRepository()
  private _akariApi = new AkariApiHttpApiAxiosHelper(
    axios.create({
      headers: {
        'User-Agent': `LeagueAkari/${app.getVersion()} `
      }
    })
  )

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

  private _autoSelectGroupsTask = new IntervalTask(
    this._updateAutoSelectGroupsFromRemoteAndSave.bind(this),
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

  /**
   * 补全此 release 的信息
   *
   * 优先以 overrides.json 中的信息为准:
   *
   * - 对于 description，优先级 overrides.json > changelog.md >  release body
   * - 对于 publishedAt，优先级 overrides.json > release.published_at
   * - 对于 version，优先级 overrides.json > release.tag_name
   * - 对于 archiveFile，优先级 overrides.json > release.assets 中找到的文件
   */
  private async _completeReleaseInfo(release: GithubApiLatestRelease): Promise<LatestReleaseInfo> {
    const currentVersion = app.getVersion()
    const locale = this._app.settings.locale as 'zh-CN' | 'en'
    const source = this.settings.preferredSource
    const configRepoRequest = {
      source,
      repo: 'akari-config' as const,
      branch: 'main'
    }

    const [changelogResp, overridesResp] = await Promise.allSettled([
      this.repo.getRawContent(`/releases/${release.tag_name}/${locale}.md`, configRepoRequest),
      this.repo.getRawContent(`/releases/${release.tag_name}/overrides.json`, configRepoRequest)
    ])

    // 从 assets 中找到归档包文件，在没有默认覆盖的情况下就用这个
    const archiveAsset = release.assets.find((a) => {
      return (
        // for github
        ((a.content_type === 'application/x-compressed' ||
          a.content_type === 'application/x-7z-compressed') &&
          a.name.includes('win')) ||
        // for gitee，它没有 content_type 字段
        a.browser_download_url.endsWith('win.7z')
      )
    })

    // overrides
    let description = changelogResp.status === 'fulfilled' ? changelogResp.value.data : release.body
    let publishedAt = release.published_at || release.created_at
    let version = release.tag_name
    let archiveFile: ReleaseArchiveFile | null = archiveAsset
      ? {
          name: archiveAsset.name,
          size: archiveAsset.size,
          downloadUrl: archiveAsset.browser_download_url,
          contentType: archiveAsset.content_type
        }
      : null

    if (overridesResp.status === 'fulfilled') {
      const { success, data, error } = ReleaseOverridesPlainObjectSchema.safeParse(
        overridesResp.value.data
      )

      this._log.info('Got overrides.json for release ', data)

      if (success) {
        if (source === 'gitee' && data.archiveFileGitee) {
          archiveFile = data.archiveFileGitee
        } else if (source === 'github' && data.archiveFileGitHub) {
          archiveFile = data.archiveFileGitHub
        }

        if (data.descriptions && data.descriptions[locale]) {
          description = data.descriptions[locale]
        }

        if (data.version) {
          version = data.version
        }

        if (data.publishedAt) {
          publishedAt = data.publishedAt
        }
      } else {
        // 没有 overrides
        this._log.warn('Failed to parse overrides.json for release ' + release.tag_name, error)
      }
    } else {
      this._log.info('No release overrides found for release ' + release.tag_name)
    }

    // 红线：必须要有 archiveFile
    if (!archiveFile) {
      this._log.warn('No archive file found for release ' + release.tag_name)
      throw new Error('No archive file found for release ' + release.tag_name)
    }

    return {
      version,
      currentVersion,
      publishedAt,
      isNew: gt(version, currentVersion),
      source,
      description,
      archiveFile
    }
  }

  async getLatestReleaseFromLastResort(): Promise<LatestReleaseInfo> {
    const { data } = await this._akariApi.getLastResortLatestRelease()

    // 最终的希望
    if (
      !data.version ||
      !data.publishedAt ||
      !data.descriptions ||
      !data.archiveFileGitHub ||
      !data.archiveFileGitee
    ) {
      throw new Error('Invalid last resort latest release')
    }

    const currentVersion = app.getVersion()
    const locale = this._app.settings.locale as 'zh-CN' | 'en'
    const source = this.settings.preferredSource

    return {
      version: data.version,
      currentVersion,
      isNew: gt(data.version, currentVersion),
      source: 'last-resort',
      publishedAt: data.publishedAt,
      description: data.descriptions[locale] ?? '',
      archiveFile: source === 'gitee' ? data.archiveFileGitee : data.archiveFileGitHub
    }
  }

  private _checkIfReachRateLimit(error: unknown) {
    if (
      isAxiosError(error) &&
      error.status === 403 &&
      typeof error.response?.data === 'string' &&
      error.response.data.match(/rate[-_\s]?limit/i)
    ) {
      this._log.warn('Rate limit exceeded', error.config?.url, error.config?.method)
      return true
    }

    return false
  }

  /**
   * 三次平均值
   */
  async testRepoLatency() {
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

    try {
      await this._initConfigFilesFromLocal()
    } catch (error) {
      this._log.warn('Failed to init config files from local', error)
    }

    this._handleIpcCall()
    this._handlePeriodicTasksUpdate()
  }

  private _handleIpcCall() {
    this._ipc.onCall(RemoteConfigMain.id, 'testRepoLatency', () => {
      return this.testRepoLatency()
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
      const { success, data, error } = SupportedQueuesV1Schema.safeParse(rawJson)

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
      const { success, data, error } = LeagueServersConfigV2Schema.safeParse(rawJson)

      if (success) {
        this.state.setLeagueServers(data)
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
      const { success, data, error } = OngoingGameConfigV1Schema.safeParse(rawJson)

      if (success) {
        this.state.setOngoingGameConfig(data)
      } else {
        this._log.warn('Invalid ongoing game config json', error)
      }
    }

    if (
      await this._setting.jsonConfigFileExists(RemoteConfigMain.AUTO_SELECT_GROUPS_RELATIVE_PATH)
    ) {
      const rawJson = await this._setting.readFromJsonConfigFile(
        RemoteConfigMain.AUTO_SELECT_GROUPS_RELATIVE_PATH
      )
      const { success, data, error } = AutoSelectGroupsV1Schema.safeParse(rawJson)

      if (success) {
        this.state.setAutoSelectGroups(data)
      } else {
        this._log.warn('Invalid auto select groups json', error)
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

      this.state.setLatestRelease(await this._completeReleaseInfo(data))

      this._log.info('Updated Latest Release', this.settings.preferredSource)
    } catch (error) {
      if (this._checkIfReachRateLimit(error)) {
        return
      }

      // 走 last-resort 逻辑，疑似目标仓库出现问题，使用备用方案
      if (isAxiosError(error) && error.response) {
        try {
          this.state.setLatestRelease(await this.getLatestReleaseFromLastResort())

          this._log.info('Updated Latest Release from last resort')
        } catch (error) {
          this._log.warn('Failed to get latest release from last resort', error)
        }

        return
      }

      this._log.warn('Update Latest Release failed', error)
    } finally {
      this.state.setUpdatingLatestRelease(false)
    }
  }

  /**
   * 手动执行一次独立的版本更新检查
   *
   * 如果查询成功，则会立即替换当前的 latestRelease，同时重启定时任务
   */
  async updateLatestReleaseManually() {
    if (this.state.isUpdatingLatestRelease) {
      return this.state.latestRelease
    }

    this.state.setUpdatingLatestRelease(true)
    this._latestReleaseTask.cancel()

    try {
      this._log.info('Updating Latest Release.. Manually', this.settings.preferredSource)

      const { data } = await this._repo.getLatestRelease({
        source: this.settings.preferredSource,
        repo: 'akari'
      })

      const release = await this._completeReleaseInfo(data)
      this.state.setLatestRelease(release)
      this._latestReleaseTask.start()
    } catch (error) {
      if (this._checkIfReachRateLimit(error)) {
        return
      }

      // 同上
      if (isAxiosError(error) && error.response) {
        try {
          this.state.setLatestRelease(await this.getLatestReleaseFromLastResort())

          this._log.info('Updated Latest Release from last resort (manual)')
        } catch (error) {
          this._log.warn('Failed to get latest release from last resort (manual)', error)
        }
      }

      this._log.warn('Update Latest Release failed (manual)', error)
    } finally {
      this.state.setUpdatingLatestRelease(false)
    }

    return this.state.latestRelease
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

      const { success, data, error } = SupportedQueuesV1Schema.safeParse(remoteData)

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
            dayjs(this.state.supportedQueues.lastUpdate).format('YYYY-MM-DD HH:mm:ss')
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

      const { success, data, error } = LeagueServersConfigV2Schema.safeParse(remoteData)

      if (success) {
        if (data.lastUpdate > this.state.leagueServers.lastUpdate) {
          this.state.setLeagueServers(data)
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
            dayjs(this.state.leagueServers.lastUpdate).format('YYYY-MM-DD HH:mm:ss')
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

      const { success, data, error } = OngoingGameConfigV1Schema.safeParse(remoteData)

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
            dayjs(this.state.ongoingGameConfig.lastUpdate).format('YYYY-MM-DD HH:mm:ss')
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

  /**
   * 更新自动选择组配置，会缓存到本地
   */
  private async _updateAutoSelectGroupsFromRemoteAndSave() {
    if (this.state.isUpdatingAutoSelectGroups) {
      return
    }

    this.state.setUpdatingAutoSelectGroups(true)

    try {
      const { data: remoteData } = await this._repo.getAutoSelectGroups({
        source: this.settings.preferredSource,
        repo: 'akari-config',
        branch: 'main'
      })

      const { success, data, error } = AutoSelectGroupsV1Schema.safeParse(remoteData)

      if (success) {
        if (data.lastUpdate > this.state.autoSelectGroups.lastUpdate) {
          this.state.setAutoSelectGroups(data)
          await this._setting.writeToJsonConfigFile(
            RemoteConfigMain.AUTO_SELECT_GROUPS_RELATIVE_PATH,
            data
          )
          this._log.info(
            'Updated auto select groups from remote',
            dayjs(data.lastUpdate).format('YYYY-MM-DD HH:mm:ss')
          )
        } else {
          this._log.info(
            'Auto select groups is up to date',
            dayjs(this.state.autoSelectGroups.lastUpdate).format('YYYY-MM-DD HH:mm:ss')
          )
        }
      } else {
        this._log.warn('Invalid auto select groups json', error)
      }
    } catch (error) {
      if (this._checkIfReachRateLimit(error)) {
        return
      }

      this._log.warn('Update Auto Select Groups failed', error)
    } finally {
      this.state.setUpdatingAutoSelectGroups(false)
    }
  }

  private _handlePeriodicTasksUpdate() {
    // 源切换时需要重新获取支持的队列、league servers、对局模块配置和自动选择组配置
    this._mobx.reaction(
      () => this.settings.preferredSource,
      (_source) => {
        this._supportedQueuesTask.start({ runImmediately: true })
        this._leagueServersTask.start({ runImmediately: true })
        this._ongoingGameConfigTask.start({ runImmediately: true })
        this._autoSelectGroupsTask.start({ runImmediately: true })
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
