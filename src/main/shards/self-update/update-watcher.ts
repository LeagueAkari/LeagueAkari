import { comparer } from 'mobx'

import type { SelfUpdateMainContext } from './context'
import { shouldRunSelfUpdateLifecycle } from './platform'
import type { SelfUpdateExecutor } from './update-executor'

export class SelfUpdateWatcher {
  constructor(
    private readonly _context: SelfUpdateMainContext,
    private readonly _executor: SelfUpdateExecutor
  ) {}

  watchUpdateProcess() {
    if (!shouldRunSelfUpdateLifecycle()) {
      this._context.logger.info('Skip self-update watcher on unsupported platform', {
        platform: process.platform
      })
      return
    }

    this._context.mobxUtils.reaction(
      () =>
        [
          this._context.settings.autoDownloadUpdates,
          this._context.settings.ignoreVersion,
          this._context.remoteConfig.state.latestRelease
        ] as const,
      ([yes, ignoreVersion, release]) => {
        if (yes && release && release.isNew && release.version !== ignoreVersion) {
          void this._executor.start(release)
        }
      },
      { equals: comparer.shallow }
    )
  }

  registerHttpProxy() {
    if (!shouldRunSelfUpdateLifecycle()) {
      return
    }

    this._context.mobxUtils.reaction(
      () => this._context.appCommon.settings.httpProxy,
      (httpProxy) => {
        if (httpProxy.strategy === 'force') {
          this._context.httpClient.defaults.proxy = {
            host: httpProxy.host,
            port: httpProxy.port
          }
        } else if (httpProxy.strategy === 'auto') {
          this._context.httpClient.defaults.proxy = undefined
        } else if (httpProxy.strategy === 'disable') {
          this._context.httpClient.defaults.proxy = false
        }
      },
      { fireImmediately: true }
    )
  }
}
