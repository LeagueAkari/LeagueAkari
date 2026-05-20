import { getPidsByName } from '@main/native'

import {
  type ClientInstallationMainContext,
  LIVE_STREAMING_CLIENTS,
  LIVE_STREAMING_CLIENT_POLL_INTERVAL
} from './context'
import { shouldWatchLiveStreamingClients } from './platform'

export class LiveStreamingDetector {
  constructor(private readonly _context: ClientInstallationMainContext) {}

  watch() {
    if (!shouldWatchLiveStreamingClients()) {
      this._context.state.setDetectedLiveStreamingClients([])
      this._context.logger.info('Skip live streaming client watch on unsupported platform', {
        platform: process.platform
      })
      return null
    }

    void this.update()
    return setInterval(() => this.update(), LIVE_STREAMING_CLIENT_POLL_INTERVAL)
  }

  /**
   * try being a spyware
   */
  async update() {
    if (!shouldWatchLiveStreamingClients()) {
      this._context.state.setDetectedLiveStreamingClients([])
      return
    }

    const result: string[] = []

    for (const client of LIVE_STREAMING_CLIENTS) {
      const pids = await getPidsByName(client)
      if (pids.length) {
        result.push(client)
      }
    }

    this._context.state.setDetectedLiveStreamingClients(result)
  }
}
