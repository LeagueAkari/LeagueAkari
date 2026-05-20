import { app } from 'electron'
import ofs from 'node:original-fs'
import path from 'node:path'
import { gte, valid } from 'semver'

import { NEW_VERSION_FLAG, type SelfUpdateMainContext } from './context'
import { shouldRunSelfUpdateLifecycle } from './platform'

export class LastUpdateChecker {
  constructor(private readonly _context: SelfUpdateMainContext) {}

  async check() {
    if (!shouldRunSelfUpdateLifecycle()) {
      return
    }

    const { logger, state } = this._context
    const newVersionFlagPath = path.join(app.getPath('userData'), NEW_VERSION_FLAG)

    logger.info(`Checking auto-update result`, newVersionFlagPath)

    try {
      await ofs.promises.access(newVersionFlagPath)
    } catch {
      return
    }

    try {
      const targetVersion = JSON.parse(
        await ofs.promises.readFile(newVersionFlagPath, {
          encoding: 'utf-8'
        })
      )

      if (valid(targetVersion)) {
        if (gte(app.getVersion(), targetVersion)) {
          logger.info(
            `Looks like it has been successfully updated`,
            targetVersion,
            newVersionFlagPath
          )
          state.setLastUpdateResult({
            success: true,
            reason: 'Successfully updated'
          })
        } else {
          logger.info(`Last auto-update seems to have failed`, targetVersion, newVersionFlagPath)
          state.setLastUpdateResult({
            success: false,
            reason: 'Something wrong...'
          })
        }
      } else {
        logger.warn('Update flag is not a normal version number', targetVersion)
      }

      await ofs.promises.unlink(newVersionFlagPath)
    } catch (error) {
      logger.warn('Error checking update flag', error)
    }
  }
}
