import { Shard } from '@shared/akari-shard'
import { LcuEvent } from '@shared/types/league-client/event'

import { AkariIpcMain } from '../ipc'
import { LeagueClientMain } from '../league-client'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { RendererDebugState } from './state'

@Shard(RendererDebugMain.id)
export class RendererDebugMain {
  static id = 'renderer-debug-main'

  public readonly state = new RendererDebugState()

  private readonly _logger: AkariLogger

  constructor(
    private readonly _ipc: AkariIpcMain,
    private readonly _leagueClient: LeagueClientMain,
    private readonly _mobxUtils: MobxUtilsMain,
    readonly _loggerFactory: LoggerFactoryMain
  ) {
    this._logger = _loggerFactory.create(RendererDebugMain.id)
  }

  async onInit() {
    this._mobxUtils.propSync(RendererDebugMain.id, 'state', this.state, [
      'sendAllNativeLcuEvents',
      'logAllLcuEvents'
    ])

    this._leagueClient.events.on('/**', (data: LcuEvent) => {
      if (this.state.sendAllNativeLcuEvents) {
        this._ipc.sendEvent(RendererDebugMain.id, 'lc-event', data)
      }

      if (this.state.logAllLcuEvents) {
        this._logger.info(data.uri, data.eventType, data)
      }
    })

    this._mobxUtils.reaction(
      () => this.state.logAllLcuEvents,
      (enabled) => {
        if (enabled) {
          this._logger.info('Logging all LCU events')
        } else {
          this._logger.info('Stopped logging all LCU events')
        }
      }
    )

    this._registerIpcHandlers()
  }

  private _registerIpcHandlers() {
    this._ipc.onCall(RendererDebugMain.id, 'setSendAllNativeLcuEvents', (_, enabled: boolean) => {
      this.state.setSendAllNativeLcuEvents(enabled)
    })

    this._ipc.onCall(RendererDebugMain.id, 'setLogAllLcuEvents', (_, enabled: boolean) => {
      this.state.setLogAllLcuEvents(enabled)
    })
  }
}
