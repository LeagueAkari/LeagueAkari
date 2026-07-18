import type { AkariLogger } from '../logger-factory'
import type { RiotClientProcessAuth, RiotClientProcessAuthReaderLike } from './process-auth'

export class RiotClientProcessAuthController {
  private _activeAuth: RiotClientProcessAuth | null = null
  private _pollInFlight: Promise<void> | null = null
  private _pollTimer: NodeJS.Timeout | null = null
  private _running = false

  constructor(
    private readonly _reader: RiotClientProcessAuthReaderLike,
    private readonly _onAuthChanged: (auth: RiotClientProcessAuth | null) => void,
    private readonly _logger: Pick<AkariLogger, 'debug' | 'info' | 'warn'>,
    private readonly _pollInterval: number
  ) {}

  async start() {
    if (this._running) return
    this._running = true
    await this.updateNow()
  }

  stop() {
    this._running = false
    if (this._pollTimer) {
      clearTimeout(this._pollTimer)
      this._pollTimer = null
    }
  }

  async updateNow() {
    if (!this._running) return
    if (this._pollInFlight) return this._pollInFlight

    this._pollInFlight = this._poll()
    try {
      await this._pollInFlight
    } finally {
      this._pollInFlight = null
      this._scheduleNextPoll()
    }
  }

  private async _poll() {
    try {
      const result = await this._reader.read()
      if (!this._running) return

      if (result.status === 'unreadable') {
        this._logger.debug('Riot Client is running but its local API credentials are unavailable')
        return
      }

      if (result.status === 'not-running') {
        if (this._activeAuth) {
          this._activeAuth = null
          this._onAuthChanged(null)
        }
        return
      }

      if (
        this._activeAuth?.pid === result.auth.pid &&
        this._activeAuth.port === result.auth.port &&
        this._activeAuth.authToken === result.auth.authToken
      ) {
        return
      }

      this._activeAuth = result.auth
      this._logger.info('Riot Client local API credentials discovered', {
        pid: result.auth.pid,
        port: result.auth.port
      })
      this._onAuthChanged(result.auth)
    } catch (error) {
      this._logger.warn('Failed to inspect Riot Client process', error)
    }
  }

  private _scheduleNextPoll() {
    if (!this._running) return
    if (this._pollTimer) clearTimeout(this._pollTimer)

    this._pollTimer = setTimeout(() => {
      this._pollTimer = null
      void this.updateNow()
    }, this._pollInterval)
  }
}
