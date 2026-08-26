import { formatError } from '@shared/utils/errors'
import type { ProxyConfig } from 'electron'

import type { ExternalHttpMainContext } from './context'

type HttpProxySetting = ExternalHttpMainContext['appCommon']['settings']['httpProxy']

export function resolveExternalHttpProxyConfig(setting: HttpProxySetting): ProxyConfig {
  switch (setting.strategy) {
    case 'auto':
      return { mode: 'system' }
    case 'force':
      return {
        mode: 'fixed_servers',
        proxyRules: `${setting.host}:${setting.port}`
      }
    case 'disable':
      return { mode: 'direct' }
  }
}

export class ExternalHttpProxyController {
  private _disposeReaction: (() => void) | null = null
  private _configurationQueue: Promise<void> = Promise.resolve()
  private _latestConfiguration: Promise<void> = Promise.resolve()
  private _hasAppliedConfiguration = false

  constructor(private readonly _context: ExternalHttpMainContext) {}

  start() {
    if (this._disposeReaction) return

    this._disposeReaction = this._context.mobxUtils.reaction(
      () => this._context.appCommon.settings.httpProxy,
      (setting) => this._scheduleConfiguration(setting),
      { fireImmediately: true }
    )
  }

  waitUntilConfigured() {
    return this._latestConfiguration
  }

  dispose() {
    this._disposeReaction?.()
    this._disposeReaction = null
  }

  private _scheduleConfiguration(setting: HttpProxySetting) {
    const config = resolveExternalHttpProxyConfig(setting)
    const task = this._configurationQueue
      .catch(() => undefined)
      .then(() => this._applyConfiguration(config))

    this._configurationQueue = task
    this._latestConfiguration = task
    void task.catch((error) => {
      this._context.logger.warn('Failed to configure external HTTP proxy', formatError(error))
    })
  }

  private async _applyConfiguration(config: ProxyConfig) {
    await this._context.electronSession.setProxy(config)

    if (this._hasAppliedConfiguration) {
      try {
        await this._context.electronSession.closeAllConnections()
      } catch (error) {
        this._context.logger.warn(
          'Failed to close external HTTP connections after proxy change',
          formatError(error)
        )
      }
    }

    this._hasAppliedConfiguration = true
  }
}
