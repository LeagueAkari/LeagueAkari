import { IAkariShardInitDispose, Shard, SharedGlobalShard } from '@shared/akari-shard'
import { app, shell } from 'electron'
import path from 'node:path'
import { Logger } from 'winston'

import { AkariIpcMain } from '../ipc'
import { MobxUtilsMain } from '../mobx-utils'
import { LOGGER_FACTORY_MAIN_NAMESPACE, type LoggerFactoryMainContext } from './context'
import { LoggerFactoryIpcHandlers } from './ipc-handlers'
import { LogMessageFormatter } from './log-message-formatter'
import { LoggerFactoryState } from './state'

export class AkariLogger {
  constructor(
    private readonly _loggerFactory: LoggerFactoryMain,
    private readonly _namespace: string
  ) {}

  info(...args: any[]) {
    return this._loggerFactory.info(this._namespace, ...args)
  }

  warn(...args: any[]) {
    return this._loggerFactory.warn(this._namespace, ...args)
  }

  error(...args: any[]) {
    return this._loggerFactory.error(this._namespace, ...args)
  }

  debug(...args: any[]) {
    return this._loggerFactory.debug(this._namespace, ...args)
  }
}

/**
 * 创建日志记录器的工厂, 供给其他模块使用
 */
@Shard(LoggerFactoryMain.id)
export class LoggerFactoryMain implements IAkariShardInitDispose {
  static id = LOGGER_FACTORY_MAIN_NAMESPACE

  public readonly state = new LoggerFactoryState()

  // 从全局注入的 logger 实例
  private readonly _logger: Logger
  private readonly _logsDir: string
  private readonly _appDir: string
  private readonly _formatter = new LogMessageFormatter()
  private readonly _context: LoggerFactoryMainContext
  private readonly _ipcHandlers: LoggerFactoryIpcHandlers

  constructor(
    private readonly _shared: SharedGlobalShard,
    private readonly _ipc: AkariIpcMain,
    private readonly _mobxUtils: MobxUtilsMain
  ) {
    this._appDir = path.join(app.getPath('exe'), '..')
    // macOS 下写入 .app bundle 会导致权限/签名问题，日志目录应位于用户目录。
    this._logsDir =
      process.platform === 'darwin' ? app.getPath('logs') : path.join(this._appDir, 'logs')
    this._logger = this._shared.global.logger

    this.state.setLogLevel(this._shared.global.getLogLevel())

    this._shared.global.events.on('log-level-changed', (level) => {
      this.state.setLogLevel(level)
    })

    this._context = {
      namespace: LoggerFactoryMain.id,
      shared: this._shared,
      ipc: this._ipc,
      mobxUtils: this._mobxUtils,
      loggerFactory: this,
      state: this.state
    }
    this._ipcHandlers = new LoggerFactoryIpcHandlers(this._context)
  }

  openLogsDir() {
    return shell.showItemInFolder(path.join(this._logsDir, this._shared.global.logFilename))
  }

  /**
   * 创建一个日志记录器实例, 应该用于每个对应模块中
   * @param namespace
   * @returns
   */
  create(namespace: string) {
    return new AkariLogger(this, namespace)
  }

  info(namespace: string, ...args: any[]) {
    return this._logger.info({
      namespace: namespace,
      message: this._formatter.objectsToString(...args)
    })
  }

  warn(namespace: string, ...args: any[]) {
    return this._logger.warn({
      namespace: namespace,
      message: this._formatter.objectsToString(...args)
    })
  }

  error(namespace: string, ...args: any[]) {
    return this._logger.error({
      namespace: namespace,
      message: this._formatter.objectsToString(...args)
    })
  }

  debug(namespace: string, ...args: any[]) {
    return this._logger.debug({
      namespace: namespace,
      message: this._formatter.objectsToString(...args)
    })
  }

  async onInit() {
    this._mobxUtils.propSync(LoggerFactoryMain.id, 'state', this.state, 'logLevel')
    this._ipcHandlers.register()
  }
}
