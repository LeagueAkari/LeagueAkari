import { IntervalTask } from '@main/utils/timer'
import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { isAxiosError } from 'axios'

import { AppCommonMain } from '../app-common'
import { AkariIpcMain } from '../ipc'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { RemoteGitRepository } from './repository'
import { RemoteConfigSettings, RemoteConfigState } from './state'

/**
 * 从远程服务器拉取配置
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
    20 * 60 * 1000
  )

  private _updateAnnouncementTask = new IntervalTask(
    () => this._updateAnnouncement(),
    10 * 60 * 1000
  )

  private _updateLatestReleaseTask = new IntervalTask(
    () => this._updateLatestRelease(),
    10 * 60 * 1000
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
      this._log.info('Updating Sgp League Servers', this._repo.config.source)
      const config = await this._repo.getSgpLeagueServersConfig()
      this.state.setSgpLeagueServers(config)
    } catch (error) {
      if (this._checkIfReachRateLimit(error)) {
        return
      }

      this._log.warn('Update Sgp League Servers failed', error)
    }
  }

  private async _updateAnnouncement() {
    try {
      this._log.info('Updating Announcement', this._repo.config.source)
      const content = await this._repo.getAnnouncement()
      this.state.setAnnouncement(content)
    } catch (error) {
      if (this._checkIfReachRateLimit(error)) {
        return
      }

      this._log.warn('Update Announcement failed', error)
    }
  }

  private async _updateLatestRelease() {
    try {
      this._log.info('Updating Latest Release', this._repo.config.source)
      const { data } = await this._repo.getLatestRelease()
      this.state.setLatestRelease(data)
    } catch (error) {
      if (this._checkIfReachRateLimit(error)) {
        return
      }

      this._log.warn('Update Latest Release failed', error)
    }
  }

  async onInit() {
    await this._setting.applyToState()

    this._mobx.propSync(RemoteConfigMain.id, 'state', this.state, ['announcement', 'latestRelease'])
    this._mobx.propSync(RemoteConfigMain.id, 'settings', this.settings, ['preferredSource'])

    this._repo.setConfig({
      locale: this._app.settings.locale as 'zh-CN' | 'en',
      source: this.settings.preferredSource
    })

    this._updateAnnouncementTask.start(true)
    this._updateSgpLeagueServersTask.start(true)
    this._updateLatestReleaseTask.start(true)

    this._mobx.reaction(
      () => this._app.settings.locale,
      (locale) => {
        this._repo.setConfig({ locale: locale as 'zh-CN' | 'en' })
        this._updateAnnouncementTask.start(true)
      },
      { delay: 1000 }
    )

    this._mobx.reaction(
      () => this.settings.preferredSource,
      (source) => {
        this._repo.setConfig({ source })
        this._updateAnnouncementTask.start(true)
        this._updateSgpLeagueServersTask.start(true)
        this._updateLatestReleaseTask.start(true)
      },
      { delay: 1000 }
    )
  }
}
