import { DEEP_LINK_PROTOCOL_DEV, DEEP_LINK_PROTOCOL_PROD } from '@main/utils/deep-link'
import updateExecutablePath from '@resources/akari-updater.exe?asset'
import { app } from 'electron'
import cp from 'node:child_process'
import ofs from 'node:original-fs'
import path from 'node:path'

import {
  EXECUTABLE_NAME,
  PLATFORM_UNSUPPORTED_REASON,
  type SelfUpdateActionResult,
  type SelfUpdateMainContext,
  UPDATE_EXECUTABLE_NAME
} from './context'
import { shouldUninstallWithUpdater } from './platform'

export class SelfUpdateUninstaller {
  constructor(private readonly _context: SelfUpdateMainContext) {}

  async uninstallApp(): Promise<SelfUpdateActionResult> {
    if (!shouldUninstallWithUpdater()) {
      this._context.logger.info('Skip updater uninstall on unsupported platform', {
        platform: process.platform
      })
      return { result: 'failed', reason: PLATFORM_UNSUPPORTED_REASON }
    }

    const appPath = path.dirname(app.getPath('exe'))
    const dataPath = app.getPath('userData')

    const copiedExecutablePath = path.join(app.getPath('temp'), UPDATE_EXECUTABLE_NAME)

    await ofs.promises.copyFile(
      updateExecutablePath.replace('app.asar', 'app.asar.unpacked'),
      copiedExecutablePath
    )

    const c = cp.spawn(
      copiedExecutablePath,
      [
        `--lang=${this._context.appCommon.settings.locale}`,
        `--executable="${EXECUTABLE_NAME}"`,
        'uninstall',
        `--app-id=${DEEP_LINK_PROTOCOL_PROD}`,
        `--app-id=${DEEP_LINK_PROTOCOL_DEV}`,
        `--dirs-to-remove="${appPath}"`,
        `--dirs-to-remove="${dataPath}"`
      ],
      {
        detached: true,
        stdio: 'ignore',
        shell: true,
        cwd: app.getPath('temp')
      }
    )

    c.unref()

    app.exit()
    return { result: 'ok' }
  }
}
