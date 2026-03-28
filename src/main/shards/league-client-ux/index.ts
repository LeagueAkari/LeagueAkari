import { getCommandLine, getPidsByName, isElevated } from '@main/native'
import elevateExecutablePath from '@resources/elevate.exe?asset&asarUnpack'
import wmiRebuildScriptPath from '@resources/rebuild_WMI.bat?asset&asarUnpack'
import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { UxCommandLine } from '@shared/types/shards/league-client-ux'
import cp from 'node:child_process'
import util from 'node:util'

import { AkariIpcMain } from '../ipc'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { LeagueClientUxSettings, LeagueClientUxState } from './state'
import { parseCommandLine } from './ux-cmd-utils'

const execAsync = util.promisify(cp.exec)

/**
 * 对于 League Client Ux 进程的相关工具集, 比如检测命令行
 */
@Shard(LeagueClientUxMain.id)
export class LeagueClientUxMain implements IAkariShardInitDispose {
  static id = 'league-client-ux-main'

  static UX_PROCESS_NAME = process.platform === 'win32' ? 'LeagueClientUx.exe' : 'LeagueClientUx'
  static CLIENT_CMD_DEFAULT_POLL_INTERVAL = 2000
  static CLIENT_CMD_LONG_POLL_INTERVAL = 60 * 1000

  public readonly settings = new LeagueClientUxSettings()
  public readonly state = new LeagueClientUxState()

  private readonly _log: AkariLogger
  private readonly _setting: SetterSettingService

  private _pollTimerId: NodeJS.Timeout | null = null

  private _hasClientButNoCommandLineCount = 0

  constructor(
    private readonly _ipc: AkariIpcMain,
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
      if (!isElevated) {
        return []
      }

      const pids = await getPidsByName(LeagueClientUxMain.UX_PROCESS_NAME)

      const cmds = await Promise.all(
        pids.map((pid) => getCommandLine(pid, { win32QueryType: 'shell' }))
      )

      this.state.setHasClientButNoCommandLine(false)
      this._hasClientButNoCommandLineCount = 0

      return cmds.map((cmd) => parseCommandLine(cmd)).filter((cmd) => cmd !== null)
    } else {
      const pids = await getPidsByName(LeagueClientUxMain.UX_PROCESS_NAME)
      const auths: UxCommandLine[] = []

      for (const p of pids) {
        try {
          const cmd = await getCommandLine(p, { win32QueryType: 'native' })

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

  /**
   * 仅限 win32
   */
  private async _rebuildWmi() {
    if (process.platform !== 'win32') {
      return
    }

    const cmd = `"${elevateExecutablePath}" cmd /c start cmd /k "${wmiRebuildScriptPath}"`
    this._log.info('Rebuilding WMI...', cmd)
    await execAsync(cmd, { shell: 'cmd', windowsHide: false })
  }
}
