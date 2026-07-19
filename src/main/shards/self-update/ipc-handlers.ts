import { app, shell } from 'electron'
import path from 'node:path'

import {
  DOWNLOAD_DIR_NAME,
  PLATFORM_UNSUPPORTED_REASON,
  type SelfUpdateMainContext
} from './context'
import { shouldRunSelfUpdateLifecycle } from './platform'
import type { SelfUpdateUninstaller } from './uninstaller'
import type { SelfUpdateController } from './update-controller'
import type { SelfUpdateExecutor } from './update-executor'

export class SelfUpdateIpcHandlers {
  constructor(
    private readonly _context: SelfUpdateMainContext,
    private readonly _executor: SelfUpdateExecutor,
    private readonly _uninstaller: SelfUpdateUninstaller,
    private readonly _controller: SelfUpdateController
  ) {}

  register() {
    this._context.ipc.onCall(this._context.namespace, 'checkUpdates', async () => {
      if (!shouldRunSelfUpdateLifecycle()) {
        return this._unsupported()
      }

      return await this._checkUpdates()
    })

    this._context.ipc.onCall(this._context.namespace, 'startUpdate', async () => {
      if (!shouldRunSelfUpdateLifecycle()) {
        return this._unsupported()
      }

      const release = this._context.state.releaseInfo
      if (release?.isNew && release.isUpdateSupported) {
        return await this._executor.start(release)
      }

      return { result: 'no-op' }
    })

    // 仅仅用于 debug
    this._context.ipc.onCall(this._context.namespace, 'forceStartUpdate', async () => {
      if (!shouldRunSelfUpdateLifecycle()) {
        return this._unsupported()
      }

      const release = this._context.state.releaseInfo
      if (release?.isUpdateSupported) {
        this._context.logger.info('Force start update, target:', release.version)
        return await this._executor.start(release)
      } else {
        this._context.logger.warn('No latest release found, cannot force start update')
        return { result: 'no-op' }
      }
    })

    this._context.ipc.onCall(this._context.namespace, 'cancelUpdate', () => {
      if (!shouldRunSelfUpdateLifecycle()) {
        return this._unsupported()
      }

      return this._executor.cancel()
    })

    this._context.ipc.onCall(this._context.namespace, 'openNewUpdatesDir', () => {
      if (!shouldRunSelfUpdateLifecycle()) {
        return this._unsupported()
      }

      const p = path.join(app.getPath('userData'), DOWNLOAD_DIR_NAME)
      return shell.openPath(p)
    })

    this._context.ipc.onCall(this._context.namespace, 'uninstallApp', async () => {
      if (!shouldRunSelfUpdateLifecycle()) {
        return this._unsupported()
      }

      return await this._uninstaller.uninstallApp()
    })
  }

  private _unsupported() {
    return { result: 'failed', reason: PLATFORM_UNSUPPORTED_REASON }
  }

  private async _checkUpdates() {
    try {
      const release = await this._controller.checkLatestRelease()

      if (release?.isNew && release.isUpdateSupported) {
        return { result: 'new-updates' }
      } else {
        return { result: 'no-updates' }
      }
    } catch (error) {
      return { result: 'failed', reason: error instanceof Error ? error.message : String(error) }
    }
  }
}
