import { IntervalTask } from '@main/utils/timer'
import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'

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
        preferredSource: { default: this.settings.preferredSource }
      },
      this.settings
    )
  }

  private async _updateSgpLeagueServers() {
    try {
      const { data } = await this._repo.getSgpLeagueServersConfig()
      this.state.setSgpLeagueServers(data)
    } catch (error) {
      this._log.warn('Update Sgp League Servers failed', error)
    }
  }

  private async _updateAnnouncement() {
    try {
      const { data } = await this._repo.getAnnouncementContent()
      this.state.setAnnouncement(data)
    } catch (error) {
      this._log.warn('Update Announcement failed', error)
    }
  }

  private async _updateLatestRelease() {
    try {
      const { data } = await this._repo.getLatestRelease()
      this.state.setLatestRelease(data)
    } catch (error) {
      this._log.warn('Update Latest Release failed', error)
    }
  }

  async onInit() {
    await this._setting.applyToState()

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
