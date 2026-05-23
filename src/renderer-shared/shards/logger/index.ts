import { Dep, Shard } from '@shared/akari-shard'

import { AkariIpcRenderer } from '../ipc'
import { PiniaMobxUtilsRenderer } from '../pinia-mobx-utils'
import { RendererConsoleLogEmitter } from './console-log-emitter'
import { LOGGER_RENDERER_NAMESPACE, MAIN_SHARD_NAMESPACE, type RendererLogLevel } from './context'
import { RendererLogMessageFormatter } from './log-message-formatter'
import { useLoggerStore } from './store'

export { MAIN_SHARD_NAMESPACE }

@Shard(LoggerRenderer.id)
export class LoggerRenderer {
  static id = LOGGER_RENDERER_NAMESPACE

  private readonly _formatter = new RendererLogMessageFormatter()
  private readonly _consoleEmitter = new RendererConsoleLogEmitter()

  constructor(
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer,
    @Dep(PiniaMobxUtilsRenderer) private readonly _piniaMobxUtils: PiniaMobxUtilsRenderer
  ) {}

  info(namespace: string, ...args: any[]) {
    return this._log('info', namespace, ...args)
  }

  warn(namespace: string, ...args: any[]) {
    return this._log('warn', namespace, ...args)
  }

  error(namespace: string, ...args: any[]) {
    return this._log('error', namespace, ...args)
  }

  debug(namespace: string, ...args: any[]) {
    return this._log('debug', namespace, ...args)
  }

  infoRenderer(namespace: string, ...args: any[]) {
    this._consoleEmitter.emit('info', namespace, ...args)
  }

  warnRenderer(namespace: string, ...args: any[]) {
    this._consoleEmitter.emit('warn', namespace, ...args)
  }

  errorRenderer(namespace: string, ...args: any[]) {
    this._consoleEmitter.emit('error', namespace, ...args)
  }

  debugRenderer(namespace: string, ...args: any[]) {
    this._consoleEmitter.emit('debug', namespace, ...args)
  }

  createLogger(namespace: string) {
    return {
      info: (...args: any[]) => this.info(namespace, ...args),
      warn: (...args: any[]) => this.warn(namespace, ...args),
      error: (...args: any[]) => this.error(namespace, ...args),
      debug: (...args: any[]) => this.debug(namespace, ...args)
    }
  }

  openLogsDir() {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'openLogsDir')
  }

  setLogLevel(level: string) {
    this._ipc.call(MAIN_SHARD_NAMESPACE, 'setLogLevel', level)
  }

  async onInit() {
    const store = useLoggerStore()

    await this._piniaMobxUtils.sync(MAIN_SHARD_NAMESPACE, 'state', store)
  }

  private _log(level: RendererLogLevel, namespace: string, ...args: any[]) {
    this._consoleEmitter.emit(level, namespace, ...args)

    return this._ipc.call(
      MAIN_SHARD_NAMESPACE,
      'log',
      namespace,
      level,
      this._formatter.objectsToString(...args)
    )
  }
}
