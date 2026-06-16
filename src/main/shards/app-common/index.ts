import elevateExecutablePath from '@resources/elevate.exe?asset&asarUnpack'
import { IAkariShardInitDispose, Shard, SharedGlobalShard } from '@shared/akari-shard'
import { app, clipboard, shell } from 'electron'
import { exec } from 'node:child_process'
import os from 'node:os'
import { promisify } from 'node:util'

import { AkariProtocolMain } from '../akari-protocol'
import { AkariIpcMain } from '../ipc'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { APP_COMMON_MAIN_NAMESPACE, type AppCommonMainContext } from './context'
import { AppCommonDiagnosticsController } from './diagnostics-controller'
import { AppCommonIpcHandlers } from './ipc-handlers'
import { RendererLinkProtocol } from './renderer-link-protocol'
import { AppCommonSettings, AppCommonState } from './state'
import { AppCommonThemeController } from './theme-controller'

const execAsync = promisify(exec)

/**
 * 一些不知道如何分类的通用功能, 可以放到这里
 */
@Shard(AppCommonMain.id)
export class AppCommonMain implements IAkariShardInitDispose {
  static id = APP_COMMON_MAIN_NAMESPACE

  public readonly state = new AppCommonState()
  public readonly settings = new AppCommonSettings()

  private readonly _settingService: SetterSettingService
  private readonly _logger: AkariLogger
  private readonly _context: AppCommonMainContext
  private readonly _ipcHandlers: AppCommonIpcHandlers
  private readonly _themeController: AppCommonThemeController
  private readonly _rendererLinkProtocol: RendererLinkProtocol
  private readonly _diagnosticsController: AppCommonDiagnosticsController

  constructor(
    private readonly _shared: SharedGlobalShard,
    private readonly _ipc: AkariIpcMain,
    private readonly _mobxUtils: MobxUtilsMain,
    private readonly _protocol: AkariProtocolMain,
    _settingFactory: SettingFactoryMain,
    _loggerFactory: LoggerFactoryMain
  ) {
    this._logger = _loggerFactory.create(AppCommonMain.id)
    this._settingService = _settingFactory.register(
      AppCommonMain.id,
      {
        showFreeSoftwareDeclaration: { default: this.settings.showFreeSoftwareDeclaration },
        locale: { default: this._getSystemLocale() },
        theme: { default: this.settings.theme },
        httpProxy: { default: this.settings.httpProxy },
        streamerMode: { default: this.settings.streamerMode },
        streamerModeUseAkariStyledName: { default: this.settings.streamerModeUseAkariStyledName },
        preferredLolSource: { default: this.settings.preferredLolSource }
      },
      this.settings
    )

    this.state.setElevated(this._shared.global.isElevated)
    this.state.setPlatform(this._shared.global.platform)
    this.state.setStartupDeepLink(this._shared.global.startupDeepLink)

    this._shared.global.events.on('second-instance', (commandLine, workingDirectory) => {
      this._ipc.sendEvent(AppCommonMain.id, 'second-instance', commandLine, workingDirectory)
    })

    this._shared.global.events.on('second-instance-deep-link', (url) => {
      this._ipc.sendEvent(AppCommonMain.id, 'second-instance-deep-link', url)
    })

    this.state.setBaseConfig(this._shared.global.baseConfig.value)

    this._context = {
      namespace: AppCommonMain.id,
      shared: this._shared,
      ipc: this._ipc,
      mobxUtils: this._mobxUtils,
      protocol: this._protocol,
      logger: this._logger,
      state: this.state,
      settings: this.settings
    }
    this._ipcHandlers = new AppCommonIpcHandlers(this._context, this)
    this._themeController = new AppCommonThemeController(this._context)
    this._rendererLinkProtocol = new RendererLinkProtocol(this._context)
    this._diagnosticsController = new AppCommonDiagnosticsController(this._context)
  }

  private _getSystemLocale() {
    const systemLocale = Intl.DateTimeFormat().resolvedOptions().locale

    if (systemLocale.startsWith('zh')) {
      return 'zh-CN'
    }

    return 'en'
  }

  setDisableHardwareAccelerationAndRelaunch(disabled: boolean) {
    if (disabled) {
      if (this.state.disableHardwareAcceleration) {
        return
      }

      this._shared.global.baseConfig.write({
        disableHardwareAcceleration: true
      })
    } else {
      if (!this.state.disableHardwareAcceleration) {
        return
      }

      this._shared.global.baseConfig.write({
        disableHardwareAcceleration: false
      })
    }

    this._shared.global.restart()
  }

  openUserDataDir() {
    return shell.openPath(app.getPath('userData'))
  }

  readClipboardText() {
    return clipboard.readText()
  }

  async relaunchAsAdministrator() {
    const appPath = process.execPath

    await execAsync(`"${elevateExecutablePath}" "${appPath}"`, {
      shell: 'cmd'
    })

    app.exit()
  }

  async getRuntimeInfo() {
    const processMemoryInfo = await process.getProcessMemoryInfo()

    return {
      version: app.getVersion(),
      platform: process.platform,
      arch: process.arch,
      execPath: process.execPath,
      pid: process.pid,
      title: process.title,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      uptime: process.uptime(),
      type: process.type,
      resourcesPath: process.resourcesPath,
      versions: process.versions,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PATH: process.env.PATH
      },
      gpuStatus: app.getGPUFeatureStatus(),
      os: {
        type: os.type(),
        release: os.release(),
        totalmem: os.totalmem(),
        freemem: os.freemem(),
        cpus: os.cpus(),
        homedir: os.homedir(),
        tmpdir: os.tmpdir()
      },
      argv: process.argv,
      processMemoryInfo
    }
  }

  evaluate(target: string, code: string) {
    this._rendererLinkProtocol.evaluate(target, code)
  }

  private async _setupState() {
    await this._settingService.applyToState()

    this._mobxUtils.propSync(AppCommonMain.id, 'settings', this.settings, [
      'showFreeSoftwareDeclaration',
      'locale',
      'theme',
      'httpProxy',
      'streamerMode',
      'streamerModeUseAkariStyledName',
      'preferredLolSource'
    ])
    this._mobxUtils.propSync(AppCommonMain.id, 'state', this.state, [
      'isElevated',
      'platform',
      'disableHardwareAcceleration',
      'baseConfig',
      'startupDeepLink',
      'isRunInTempDir',
      'nativeSupport'
    ])

    // 状态指示, 是否禁用硬件加速
    this.state.setDisableHardwareAcceleration(
      this._shared.global.baseConfig.value?.disableHardwareAcceleration || false
    )
  }

  async onInit() {
    await this._setupState()

    this._themeController.watch()
    this._ipcHandlers.register()
    this._rendererLinkProtocol.register()
    this._diagnosticsController.start()
  }
}
