import {
  NATIVE_SUPPORT,
  getPidsByName,
  isProcessForeground,
  isProcessRunning,
  terminateProcess
} from '@main/native'
import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { GameClientHttpApiAxiosHelper } from '@shared/http-api-axios-helper/game-client'
import axios from 'axios'
import https from 'https'

import { ClientInstallationMain } from '../client-installation'
import { AkariIpcMain } from '../ipc'
import { KeyboardShortcutsMain } from '../keyboard-shortcuts'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import {
  GAME_CLIENT_BASE_URL,
  GAME_CLIENT_MAIN_NAMESPACE,
  GAME_CLIENT_PROCESS_NAME,
  type GameClientMainContext,
  type SettingsFileMode
} from './context'
import { GameClientIpcHandlers } from './ipc-handlers'
import { GameClientSettingsFileController } from './settings-file-controller'
import { GameClientShortcutController } from './shortcut-controller'
import { GameClientSettings } from './state'

/**
 * 处理游戏端相关的功能
 */
@Shard(GameClientMain.id)
export class GameClientMain implements IAkariShardInitDispose {
  static id = GAME_CLIENT_MAIN_NAMESPACE

  static GAME_CLIENT_PROCESS_NAME = GAME_CLIENT_PROCESS_NAME
  static GAME_CLIENT_BASE_URL = GAME_CLIENT_BASE_URL

  private readonly _logger: AkariLogger
  private readonly _settingService: SetterSettingService<GameClientSettings>
  private readonly _context: GameClientMainContext
  private readonly _ipcHandlers: GameClientIpcHandlers
  private readonly _shortcutController: GameClientShortcutController
  private readonly _settingsFileController: GameClientSettingsFileController

  private readonly _httpClient = axios.create({
    baseURL: GameClientMain.GAME_CLIENT_BASE_URL,
    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
      keepAlive: true,
      maxFreeSockets: 1024,
      maxCachedSessions: 2048
    })
  })
  private readonly _gameClientApi: GameClientHttpApiAxiosHelper

  public readonly settings = new GameClientSettings()

  private _gameClientCachedRunningPids: number[] = []

  constructor(
    private readonly _ipc: AkariIpcMain,
    _loggerFactory: LoggerFactoryMain,
    _settingFactory: SettingFactoryMain,
    private readonly _leagueClient: LeagueClientMain,
    private readonly _keyboardShortcuts: KeyboardShortcutsMain,
    private readonly _mobxUtils: MobxUtilsMain,
    private readonly _clientInstallation: ClientInstallationMain
  ) {
    this._logger = _loggerFactory.create(GameClientMain.id)
    this._gameClientApi = new GameClientHttpApiAxiosHelper(this._httpClient)

    this._settingService = _settingFactory.register(
      GameClientMain.id,
      {
        terminateGameClientWithShortcut: { default: this.settings.terminateGameClientWithShortcut },
        terminateShortcut: {
          default: this.settings.terminateShortcut,
          sideEffect: ({ value }) =>
            this._shortcutController.applyTerminateShortcutSettingSideEffect(value)
        }
      },
      this.settings
    )

    this._context = {
      namespace: GameClientMain.id,
      clientInstallation: this._clientInstallation,
      gameClient: this,
      keyboardShortcuts: this._keyboardShortcuts,
      leagueClient: this._leagueClient,
      logger: this._logger,
      mobxUtils: this._mobxUtils,
      ipc: this._ipc,
      settings: this.settings,
      settingService: this._settingService
    }
    this._ipcHandlers = new GameClientIpcHandlers(this._context, this)
    this._shortcutController = new GameClientShortcutController(this._context)
    this._settingsFileController = new GameClientSettingsFileController(this._context)
  }

  get http() {
    return this._httpClient
  }

  get api() {
    return this._gameClientApi
  }

  async onInit() {
    await this._setupState()
    this._ipcHandlers.register()
    this._shortcutController.watch()
  }

  async terminateGameClient() {
    this._logger.info('Try to terminate game client process')
    const pids = await getPidsByName(GameClientMain.GAME_CLIENT_PROCESS_NAME)

    pids.forEach((pid) => {
      this._logger.info('Process exists', pid)
      if (NATIVE_SUPPORT.isProcessForeground && !isProcessForeground(pid)) {
        this._logger.info('Process is not in foreground', pid)
        return
      }

      this._logger.info(`Terminate game client process ${pid}`)
      terminateProcess(pid)
    })
  }

  async setSettingsFileReadonlyOrWritable(mode: SettingsFileMode = 'readonly') {
    await this._settingsFileController.setMode(mode)
  }

  async getSettingsFileReadonlyOrWritable() {
    return this._settingsFileController.getMode()
  }

  static async isGameClientForeground() {
    if (!NATIVE_SUPPORT.isProcessForeground) {
      return false
    }

    const pids = await getPidsByName(GameClientMain.GAME_CLIENT_PROCESS_NAME)

    return pids.some((pid) => isProcessForeground(pid))
  }

  async isGameClientForegroundCached() {
    if (!NATIVE_SUPPORT.isProcessForeground) {
      return false
    }

    if (this._gameClientCachedRunningPids.length === 0) {
      this._gameClientCachedRunningPids = await getPidsByName(
        GameClientMain.GAME_CLIENT_PROCESS_NAME
      )
    } else {
      this._gameClientCachedRunningPids = this._gameClientCachedRunningPids.filter((pid) =>
        isProcessRunning(pid)
      )

      if (this._gameClientCachedRunningPids.length === 0) {
        this._gameClientCachedRunningPids = await getPidsByName(
          GameClientMain.GAME_CLIENT_PROCESS_NAME
        )
      }
    }

    return this._gameClientCachedRunningPids.some((pid) => isProcessForeground(pid))
  }

  private async _setupState() {
    await this._settingService.applyToState()
    this._mobxUtils.propSync(GameClientMain.id, 'settings', this.settings, [
      'terminateGameClientWithShortcut',
      'terminateShortcut'
    ])
  }
}
