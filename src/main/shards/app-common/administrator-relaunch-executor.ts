import {
  ADMINISTRATOR_RELAUNCH_SWITCH,
  supportsAdministratorRelaunch
} from '@main/administrator-relaunch'
import elevateExecutablePath from '@resources/elevate.exe?asset&asarUnpack'
import { app } from 'electron'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import type { AppCommonMainContext } from './context'

const execFileAsync = promisify(execFile)

export class AdministratorRelaunchExecutor {
  private _pending: Promise<void> | null = null

  constructor(private readonly _context: AppCommonMainContext) {}

  relaunch(): Promise<void> {
    if (!supportsAdministratorRelaunch()) {
      return Promise.reject(new Error('Administrator relaunch is only supported on Windows'))
    }

    if (!this._pending) {
      this._pending = this._launch().catch((error) => {
        this._pending = null
        this._context.logger.warn('Administrator relaunch failed or was cancelled', error)
        throw error
      })
    }
    return this._pending
  }

  private async _launch() {
    // elevate.exe joins target arguments verbatim, so the development app path needs its own quotes.
    const args = process.defaultApp ? [`"${app.getAppPath()}"`] : []
    args.push(`--${ADMINISTRATOR_RELAUNCH_SWITCH}=${process.pid}`)

    this._context.logger.info('Requesting administrator relaunch')
    // Avoid cmd.exe expansion of %, &, ^ and other characters in installation paths.
    await execFileAsync(elevateExecutablePath, [process.execPath, ...args], {
      windowsHide: true
    })

    this._context.logger.info('Administrator launch accepted; shutting down the previous instance')
    // Flush settings and dispose shards. The new process waits for this process to exit before
    // acquiring the single-instance lock or opening the database.
    this._context.shared.global.quit()
  }
}
