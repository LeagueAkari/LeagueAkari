import { tools } from '@leagueakari/league-akari-addons'
import { UxCommandLine, parseCommandLine, queryUxCommandLine } from '@main/utils/ux-cmd'
import elevateExecutablePath from '@resources/elevate.exe?asset&asarUnpack'
import wmiRebuildScriptPath from '@resources/rebuild_WMI.bat?asset&asarUnpack'
import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import cp from 'node:child_process'
import util from 'node:util'

import { AppCommonMain } from '../app-common'
import { AkariIpcMain } from '../ipc'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { LeagueClientUxSettings, LeagueClientUxState } from './state'

const execAsync = util.promisify(cp.exec)

/**
 * 对于 League Client Ux 进程的相关工具集, 比如检测命令行
 */
@Shard(LeagueClientUxMain.id)
export class LeagueClientUxMain implements IAkariShardInitDispose {
  static id = 'league-client-ux-main'

  static UX_PROCESS_NAME = 'LeagueClientUx.exe'
  static CLIENT_CMD_DEFAULT_POLL_INTERVAL = 2000
  static CLIENT_CMD_LONG_POLL_INTERVAL = 15000

  public readonly settings = new LeagueClientUxSettings()
  public readonly state = new LeagueClientUxState()

  private readonly _log: AkariLogger
  private readonly _setting: SetterSettingService

  private _pollTimerId: NodeJS.Timeout | null = null

  private _hasClientButNoCommandLineCount = 0

  constructor(
    private readonly _ipc: AkariIpcMain,
    private readonly _common: AppCommonMain,
    readonly _loggerFactory: LoggerFactoryMain,
    readonly _settingFactory: SettingFactoryMain,
    private readonly _mobx: MobxUtilsMain
  ) {
    this._log = _loggerFactory.create(LeagueClientUxMain.id)
    this._setting = _settingFactory.register(
      LeagueClientUxMain.id,
      {
        useWmi: { default: this.settings.useWmi }
      },
      this.settings
    )
  }

  async onInit() {
    await this._setting.applyToState()

    this._handlePollExistingUx()

    this._mobx.propSync(LeagueClientUxMain.id, 'settings', this.settings, ['useWmi'])
    this._mobx.propSync(LeagueClientUxMain.id, 'state', this.state, [
      'launchedClients',
      'hasClientButNoCommandLine'
    ])

    this._ipc.onCall(LeagueClientUxMain.id, 'update', () => this.update())
    this._ipc.onCall(LeagueClientUxMain.id, 'rebuildWmi', () => this._rebuildWmi())
  }

  async onDispose() {
    if (this._pollTimerId) {
      clearInterval(this._pollTimerId)
      this._pollTimerId = null
    }
  }

  setPollInterval(interval: number, immediate = false) {
    if (this._pollTimerId) {
      clearInterval(this._pollTimerId)

      if (immediate) {
        this.update()
      }

      this._pollTimerId = setInterval(() => this.update(), interval)
    }
  }

  private _handlePollExistingUx() {
    this.update()
    this._pollTimerId = setInterval(
      () => this.update(),
      LeagueClientUxMain.CLIENT_CMD_DEFAULT_POLL_INTERVAL
    )
  }

  /**
   * 立即更新状态
   */
  async update() {
    try {
      this.state.setLaunchedClients(await this._updateUxCommandLine())

      if (this._pollTimerId) {
        clearInterval(this._pollTimerId)
      }
      this._pollTimerId = setInterval(
        () => this.update(),
        LeagueClientUxMain.CLIENT_CMD_DEFAULT_POLL_INTERVAL
      )
    } catch (error) {
      this._ipc.sendEvent(LeagueClientUxMain.id, 'error-polling')
      this._log.error(`Failed to get Ux command line`, error)
    }
  }

  private async _updateUxCommandLine() {
    if (this.settings.useWmi) {
      if (!this._common.state.isAdministrator) {
        return []
      }

      const cmds = await queryUxCommandLine(LeagueClientUxMain.UX_PROCESS_NAME)

      this.state.setHasClientButNoCommandLine(false)
      this._hasClientButNoCommandLineCount = 0

      return cmds
    } else {
      const pids = tools.getPidsByName(LeagueClientUxMain.UX_PROCESS_NAME)
      const auths: UxCommandLine[] = []

      for (const p of pids) {
        try {
          const cmd = tools.getCommandLine1(p)
          const parsed = parseCommandLine(cmd)
          if (parsed) {
            auths.push(parsed)
          }
        } catch {}
      }

      if (pids.length !== 0 && auths.length === 0) {
        this._hasClientButNoCommandLineCount++
      }

      if (this._hasClientButNoCommandLineCount >= 5) {
        this.state.setHasClientButNoCommandLine(true)
      }

      return auths
    }
  }

  private async _rebuildWmi() {
    const cmd = `"${elevateExecutablePath}" cmd /c start cmd /k "${wmiRebuildScriptPath}"`
    this._log.info('Rebuilding WMI...', cmd)
    await execAsync(cmd, { shell: 'cmd', windowsHide: false })
  }
}
