import type { RendererDebugLcuEvent, RendererDebugMainContext } from './context'

export class LcuEventDebugger {
  constructor(private readonly context: RendererDebugMainContext) {}

  watch() {
    this._forwardLcuEvents()
    this._logLcuEventStateChanges()
  }

  private _forwardLcuEvents() {
    const { ipc, leagueClient, logger, namespace, state } = this.context

    leagueClient.events.on('/**', (data: RendererDebugLcuEvent) => {
      if (state.sendAllNativeLcuEvents) {
        ipc.sendEvent(namespace, 'lc-event', data)
      }

      if (state.logAllLcuEvents) {
        logger.info(data.uri, data.eventType, data)
      }
    })
  }

  private _logLcuEventStateChanges() {
    const { logger, mobxUtils, state } = this.context

    mobxUtils.reaction(
      () => state.logAllLcuEvents,
      (enabled) => {
        if (enabled) {
          logger.info('Logging all LCU events')
        } else {
          logger.info('Stopped logging all LCU events')
        }
      }
    )
  }
}
