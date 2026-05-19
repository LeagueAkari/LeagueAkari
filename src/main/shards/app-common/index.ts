import { is } from '@electron-toolkit/utils'
import { i18next } from '@main/i18n'
import elevateExecutablePath from '@resources/elevate.exe?asset&asarUnpack'
import { IAkariShardInitDispose, Shard, SharedGlobalShard } from '@shared/akari-shard'
import { getThemeColorTheme, isAppThemeSetting } from '@shared/types/app-theme'
import { app, nativeTheme, shell } from 'electron'
import { clipboard } from 'electron'
import { exec } from 'node:child_process'
import os from 'node:os'
import { promisify } from 'node:util'

import { AkariProtocolMain } from '../akari-protocol'
import { AkariIpcMain } from '../ipc'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { AppCommonSettings, AppCommonState } from './state'

const execAsync = promisify(exec)

/**
 * 一些不知道如何分类的通用功能, 可以放到这里
 */
@Shard(AppCommonMain.id)
export class AppCommonMain implements IAkariShardInitDispose {
  static id = 'app-common-main'

  public readonly state = new AppCommonState()
  public readonly settings = new AppCommonSettings()

  private readonly _setting: SetterSettingService
  private readonly _log: AkariLogger

  constructor(
    private readonly _shared: SharedGlobalShard,
    private readonly _ipc: AkariIpcMain,
    private readonly _mobx: MobxUtilsMain,
    private readonly _protocol: AkariProtocolMain,
    _settingFactory: SettingFactoryMain,
    _loggerFactory: LoggerFactoryMain
  ) {
    this._log = _loggerFactory.create(AppCommonMain.id)
    this._setting = _settingFactory.register(
      AppCommonMain.id,
      {
        isInKyokoMode: { default: this.settings.isInKyokoMode },
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
  }

  private _getSystemLocale() {
    const systemLocale = Intl.DateTimeFormat().resolvedOptions().locale

    if (systemLocale.startsWith('zh')) {
      return 'zh-CN'
    }

    return 'en'
  }

  private _setDisableHardwareAccelerationAndRelaunch(s: boolean) {
    if (s) {
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

  private async _handleState() {
    await this._setting.applyToState()

    this._mobx.propSync(AppCommonMain.id, 'settings', this.settings, [
      'isInKyokoMode',
      'showFreeSoftwareDeclaration',
      'locale',
      'theme',
      'httpProxy',
      'streamerMode',
      'streamerModeUseAkariStyledName',
      'preferredLolSource'
    ])
    this._mobx.propSync(AppCommonMain.id, 'state', this.state, [
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
    await this._handleState()

    this._mobx.reaction(
      () => this.settings.locale,
      (locale) => {
        i18next.changeLanguage(locale)
      },
      { fireImmediately: true }
    )

    this._mobx.reaction(
      () => this.settings.theme,
      (theme) => {
        if (theme === 'default') {
          nativeTheme.themeSource = 'system'
          return
        }

        if (isAppThemeSetting(theme)) {
          // Electron 原生主题仅支持 light/dark/system，其他主题在渲染层做 token 覆盖。
          nativeTheme.themeSource = getThemeColorTheme(theme)
          return
        }

        this._log.warn('Invalid theme value, fallback to dark', theme)
        nativeTheme.themeSource = 'dark'
      },
      { fireImmediately: true }
    )

    nativeTheme.on('updated', () => {
      this.state.setShouldUseDarkColors(nativeTheme.shouldUseDarkColors)
    })

    this.state.setShouldUseDarkColors(nativeTheme.shouldUseDarkColors)

    this._ipc.onCall(AppCommonMain.id, 'setDisableHardwareAcceleration', (_, s: boolean) => {
      this._setDisableHardwareAccelerationAndRelaunch(s)
    })

    this._ipc.onCall(AppCommonMain.id, 'relaunchAsAdministrator', () => {
      return this.relaunchAsAdministrator()
    })

    this._ipc.onCall(AppCommonMain.id, 'getVersion', () => {
      return this._shared.global.version
    })

    this._ipc.onCall(AppCommonMain.id, 'openUserDataDir', () => {
      return this.openUserDataDir()
    })

    this._ipc.onCall(AppCommonMain.id, 'readClipboardText', () => {
      return clipboard.readText()
    })

    this._ipc.onCall(AppCommonMain.id, 'getRuntimeInfo', () => {
      return this.getRuntimeInfo()
    })

    this._ipc.onCall(AppCommonMain.id, 'exit', () => {
      app.exit()
    })

    this._protocol.registerDomain('renderer-link', (_uri: string, req: Request) => {
      this._ipc.sendEvent(AppCommonMain.id, 'renderer-link', req.url)

      const u = new URL(req.url)

      if (u.pathname === '/evaluate') {
        const target = u.searchParams.get('target')
        const code = u.searchParams.get('code')

        if (target && code) {
          this.evaluate(target, code)
        }
      }

      return new Response(null, { status: 204 })
    })

    this._logInstantiatedShards()

    app.on('browser-window-created', (_, window) => {
      this._log.info('browser-window-created', window.id, window.title)
    })

    this._handleCheckIfRunInTempDir()
  }

  private _handleCheckIfRunInTempDir() {
    // 主程序是否目录在 temp 下
    const exePath = app.getPath('exe')
    const tempPath = app.getPath('temp')

    this._log.info('exePath', exePath, tempPath)

    if (exePath.startsWith(tempPath)) {
      this.state.setRunInTempDir(true)
      this._log.warn('run in temp dir warning', exePath, tempPath)
    }
  }

  private _logInstantiatedShards() {
    // @ts-ignore
    const loadedShards = this._shared.manager._instances.keys()

    const shards: string[] = []
    for (const shard of loadedShards) {
      if (typeof shard === 'symbol') {
        shards.push(shard.description || '[unknown]')
      } else {
        shards.push(shard)
      }
    }

    this._log.info('instantiated shards', shards)
  }

  private _evaluateMainProcess(code: string) {
    if (!is.dev) {
      this._log.warn('Blocked main-process evaluate outside dev mode')
      return
    }

    this._log.warn('Evaluating code in main process')

    try {
      const fn = new Function(
        'app',
        'manager',
        'shared',
        'logger',
        'process',
        `"use strict";\nreturn (async () => {\n${code}\n})()`
      )
      const result = fn(app, this._shared.manager, this._shared, this._log, process)

      if (result instanceof Promise) {
        void result.catch((error) => {
          this._log.error('Main-process evaluate failed', error)
        })
      }
    } catch (error) {
      this._log.error('Main-process evaluate failed', error)
    }
  }

  /**
   * execute code in certain renderer window
   * very dangerous, should be used only in some extreme cases. e.g opt-in bugfixes
   * @param target certain renderer window
   * @param code pure js code
   * @returns
   */
  evaluate(target: string, code: string) {
    if (target === 'main') {
      this._evaluateMainProcess(code)
      return
    }

    const wm = this._shared.manager.getInstance('window-manager-main')

    if (!wm) {
      return
    }

    switch (target) {
      case 'main-window':
        wm.mainWindow.window?.webContents.executeJavaScript(code)
        break

      case 'aux-window':
        wm.auxWindow.window?.webContents.executeJavaScript(code)
        break

      case 'cd-timer-window':
        wm.cdTimerWindow.window?.webContents.executeJavaScript(code)
        break

      case 'ongoing-game-window':
        wm.ongoingGameWindow.window?.webContents.executeJavaScript(code)
        break

      case 'opgg-window':
        wm.opggWindow.window?.webContents.executeJavaScript(code)
        break
    }
  }
}
