import { Shard } from '@shared/akari-shard'

import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { RENDERER_DEBUG_MAIN_NAMESPACE, type RendererDebugMainContext } from './context'
import { RendererDebugIpcHandlers } from './ipc-handlers'
import { LcuEventDebugger } from './lcu-event-debugger'
import { RendererDebugState } from './state'

@Shard(RendererDebugMain.id)
export class RendererDebugMain {
  static id = RENDERER_DEBUG_MAIN_NAMESPACE

  public readonly state = new RendererDebugState()

  private readonly _logger: AkariLogger
  private readonly _context: RendererDebugMainContext
  private readonly _ipcHandlers: RendererDebugIpcHandlers
  private readonly _lcuEventDebugger: LcuEventDebugger

  constructor(
    private readonly _ipc: AkariIpcMain,
    private readonly _leagueClient: LeagueClientMain,
    private readonly _mobxUtils: MobxUtilsMain,
    _loggerFactory: LoggerFactoryMain
  ) {
    this._logger = _loggerFactory.create(RendererDebugMain.id)
    this._context = {
      namespace: RendererDebugMain.id,
      ipc: this._ipc,
      leagueClient: this._leagueClient,
      logger: this._logger,
      mobxUtils: this._mobxUtils,
      state: this.state
    }
    this._ipcHandlers = new RendererDebugIpcHandlers(this._context)
    this._lcuEventDebugger = new LcuEventDebugger(this._context)
  }

  async onInit() {
    this._mobxUtils.propSync(RendererDebugMain.id, 'state', this.state, [
      'sendAllNativeLcuEvents',
      'logAllLcuEvents'
    ])

    this._lcuEventDebugger.watch()
    this._ipcHandlers.register()
  }
}
