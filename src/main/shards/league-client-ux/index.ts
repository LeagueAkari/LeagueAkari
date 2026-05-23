import elevateExecutablePath from '@resources/elevate.exe?asset&asarUnpack'
import wmiRebuildScriptPath from '@resources/rebuild_WMI.bat?asset&asarUnpack'
import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import cp from 'node:child_process'
import util from 'node:util'

import { AkariIpcMain } from '../ipc'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import {
  CLIENT_CMD_DEFAULT_POLL_INTERVAL as DEFAULT_POLL_INTERVAL,
  LEAGUE_CLIENT_UX_MAIN_NAMESPACE,
  LEAGUE_CLIENT_UX_PROCESS_NAME,
  CLIENT_CMD_LONG_POLL_INTERVAL as LONG_POLL_INTERVAL,
  type LeagueClientUxMainContext
} from './context'
import { LeagueClientUxIpcHandlers } from './ipc-handlers'
import { LeagueClientUxSettings, LeagueClientUxState } from './state'
import { LeagueClientUxCommandLineReader } from './ux-command-line-reader'

const execAsync = util.promisify(cp.exec)

/**
 * 对于 League Client Ux 进程的相关工具集, 比如检测命令行
 */
@Shard(LeagueClientUxMain.id)
export class LeagueClientUxMain implements IAkariShardInitDispose {
  static id = LEAGUE_CLIENT_UX_MAIN_NAMESPACE

  static UX_PROCESS_NAME = LEAGUE_CLIENT_UX_PROCESS_NAME
  static CLIENT_CMD_DEFAULT_POLL_INTERVAL = DEFAULT_POLL_INTERVAL
  static CLIENT_CMD_LONG_POLL_INTERVAL = LONG_POLL_INTERVAL

  public readonly settings = new LeagueClientUxSettings()
  public readonly state = new LeagueClientUxState()

  private readonly _logger: AkariLogger
  private readonly _settingService: SetterSettingService
  private readonly _context: LeagueClientUxMainContext
  private readonly _ipcHandlers: LeagueClientUxIpcHandlers
  private readonly _commandLineReader: LeagueClientUxCommandLineReader

  private _pollTimerId: NodeJS.Timeout | null = null

  constructor(
    private readonly _ipc: AkariIpcMain,
    _loggerFactory: LoggerFactoryMain,
    _settingFactory: SettingFactoryMain,
    private readonly _mobxUtils: MobxUtilsMain
  ) {
    this._logger = _loggerFactory.create(LeagueClientUxMain.id)
    this._settingService = _settingFactory.register(
      LeagueClientUxMain.id,
      {
        useWmi: { default: this.settings.useWmi }
      },
      this.settings
    )

    this._context = {
      namespace: LeagueClientUxMain.id,
      ipc: this._ipc,
      logger: this._logger,
      mobxUtils: this._mobxUtils,
      settings: this.settings,
      settingService: this._settingService,
      state: this.state
    }
    this._ipcHandlers = new LeagueClientUxIpcHandlers(this._context, this)
    this._commandLineReader = new LeagueClientUxCommandLineReader(this._context)
  }

  async onInit() {
    await this._setupState()
    this._watchExistingUx()
    this._ipcHandlers.register()
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

  /**
   * 立即更新状态
   */
  async update() {
    try {
      this.state.setLaunchedClients(await this._commandLineReader.read())

      if (this._pollTimerId) {
        clearInterval(this._pollTimerId)
      }
      this._pollTimerId = setInterval(
        () => this.update(),
        LeagueClientUxMain.CLIENT_CMD_DEFAULT_POLL_INTERVAL
      )
    } catch (error) {
      this._ipc.sendEvent(LeagueClientUxMain.id, 'error-polling')
      this._logger.error(`Failed to get Ux command line`, error)
    }
  }

  /**
   * 仅限 win32
   */
  async rebuildWmi() {
    if (process.platform !== 'win32') {
      return
    }

    const cmd = `"${elevateExecutablePath}" cmd /c start cmd /k "${wmiRebuildScriptPath}"`
    this._logger.info('Rebuilding WMI...', cmd)
    await execAsync(cmd, { shell: 'cmd', windowsHide: false })
  }

  private async _setupState() {
    await this._settingService.applyToState()

    this._mobxUtils.propSync(LeagueClientUxMain.id, 'settings', this.settings, ['useWmi'])
    this._mobxUtils.propSync(LeagueClientUxMain.id, 'state', this.state, [
      'launchedClients',
      'hasClientButNoCommandLine'
    ])
  }

  private _watchExistingUx() {
    this.update()
    this._pollTimerId = setInterval(
      () => this.update(),
      LeagueClientUxMain.CLIENT_CMD_DEFAULT_POLL_INTERVAL
    )
  }
}
