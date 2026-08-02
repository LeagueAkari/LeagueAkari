import { IntervalTask } from '@main/utils/timer'
import type { AkariApiLanguage } from '@shared/shards/akari-api'
import type { SelfUpdateReleaseInfo } from '@shared/shards/self-update'
import { compareShallow } from 'mobx'

import {
  PLATFORM_UNSUPPORTED_REASON,
  type SelfUpdateMainContext,
  UPDATE_CHECK_INTERVAL
} from './context'
import { shouldRunSelfUpdateLifecycle } from './platform'
import type { SelfUpdateExecutor } from './update-executor'

export class SelfUpdateController {
  private readonly _releaseCheckTask = new IntervalTask(
    () => void this._checkLatestReleaseAutomatically(),
    { interval: UPDATE_CHECK_INTERVAL }
  )
  private _releaseCheckPromise: Promise<SelfUpdateReleaseInfo | null> | null = null
  private _isDisposed = false

  constructor(
    private readonly _context: SelfUpdateMainContext,
    private readonly _executor: SelfUpdateExecutor
  ) {}

  watchLatestRelease() {
    if (!shouldRunSelfUpdateLifecycle()) {
      return
    }

    this._context.mobxUtils.reaction(
      () => ({
        locale: this._context.appCommon.settings.locale,
        autoCheckUpdates: this._context.settings.autoCheckUpdates
      }),
      ({ autoCheckUpdates }) => {
        if (autoCheckUpdates) {
          this._releaseCheckTask.start({ runImmediately: true })
        } else {
          this._releaseCheckTask.cancel()
        }
      },
      { fireImmediately: true, equals: compareShallow }
    )
  }

  checkLatestRelease() {
    if (!shouldRunSelfUpdateLifecycle()) {
      return Promise.reject(new Error(PLATFORM_UNSUPPORTED_REASON))
    }

    if (this._releaseCheckPromise) {
      return this._releaseCheckPromise
    }

    this._releaseCheckTask.cancel()
    this._context.state.setCheckingUpdates(true)

    const releaseCheckPromise = this._context.akariApi
      .updateLatestRelease(this._context.appCommon.settings.locale as AkariApiLanguage)
      .then(() => this._context.state.releaseInfo)
      .finally(() => {
        if (this._releaseCheckPromise !== releaseCheckPromise) {
          return
        }

        this._releaseCheckPromise = null
        this._context.state.setCheckingUpdates(false)

        if (!this._isDisposed && this._context.settings.autoCheckUpdates) {
          this._releaseCheckTask.start()
        }
      })

    this._releaseCheckPromise = releaseCheckPromise
    return releaseCheckPromise
  }

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
          this._context.state.releaseInfo
        ] as const,
      ([yes, ignoreVersion, release]) => {
        if (
          yes &&
          release?.isNew &&
          release.isUpdateSupported &&
          release.version !== ignoreVersion
        ) {
          void this._executor.start(release)
        }
      },
      { equals: compareShallow }
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

  dispose() {
    this._isDisposed = true
    this._releaseCheckTask.cancel()
  }

  private async _checkLatestReleaseAutomatically() {
    try {
      await this.checkLatestRelease()
    } catch (error) {
      this._context.logger.warn('Automatic update check failed', error)
    }
  }
}
