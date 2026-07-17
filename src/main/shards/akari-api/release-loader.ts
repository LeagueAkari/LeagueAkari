import { IntervalTask } from '@main/utils/timer'
import {
  type AkariApiLanguage,
  AkariLastResortReleaseSchema,
  type AkariRelease,
  AkariReleaseSchema
} from '@shared/shards/akari-api'
import type { LatestReleaseInfo } from '@shared/types/akari'
import { isAxiosError } from 'axios'
import { app } from 'electron'
import { comparer } from 'mobx'
import { gt } from 'semver'

import { AKARI_API_VOLATILE_RESOURCE_UPDATE_INTERVAL, type AkariApiMainContext } from './context'

export class AkariApiReleaseLoader {
  private readonly _task = new IntervalTask(this._update.bind(this), {
    interval: AKARI_API_VOLATILE_RESOURCE_UPDATE_INTERVAL
  })

  constructor(private readonly _context: AkariApiMainContext) {}

  watch() {
    const { appCommon, mobxUtils, settings } = this._context

    mobxUtils.reaction(
      () => ({
        locale: appCommon.settings.locale,
        updateLatestRelease: settings.updateLatestRelease
      }),
      ({ updateLatestRelease }) => {
        if (updateLatestRelease) {
          this._task.start({ runImmediately: true })
        } else {
          this._task.cancel()
        }
      },
      { fireImmediately: true, equals: comparer.shallow }
    )
  }

  dispose() {
    this._task.cancel()
  }

  async updateLatestReleaseManually() {
    const { logger, settings, state } = this._context

    if (state.isUpdatingLatestRelease) {
      return state.latestRelease
    }

    state.setUpdatingLatestRelease(true)
    this._task.cancel()

    try {
      state.setLatestRelease(await this._fetchLatestRelease())
      this._task.start()
      logger.info('Updated latest release manually')
    } catch (error) {
      logger.warn('Update latest release failed manually', error)
      if (settings.updateLatestRelease) {
        this._task.start()
      }
    } finally {
      state.setUpdatingLatestRelease(false)
    }

    return state.latestRelease
  }

  private async _fetchLatestRelease(): Promise<LatestReleaseInfo> {
    const { api, appCommon, logger } = this._context
    const language = appCommon.settings.locale as AkariApiLanguage

    try {
      const response = await api.getLatestRelease(language)
      return this._toLatestReleaseInfo(AkariReleaseSchema.parse(response.data))
    } catch (error) {
      if (!isAxiosError(error) || !error.response) {
        throw error
      }

      logger.info('Falling back to the last-resort release endpoint')
      const response = await api.getLastResortLatestRelease()
      const release = AkariLastResortReleaseSchema.parse(response.data)
      const artifact = release.archiveFileGitHub ?? release.archiveFileGitee

      if (!artifact) {
        throw new Error(`Release ${release.version} has no archive file`)
      }

      const currentVersion = app.getVersion()

      return {
        version: release.version,
        currentVersion,
        isNew: gt(release.version, currentVersion),
        publishedAt: release.publishedAt,
        description: release.descriptions[language] ?? '',
        archiveFile: artifact
      }
    }
  }

  private _toLatestReleaseInfo(release: AkariRelease): LatestReleaseInfo {
    const artifact = release.artifacts.find(
      (item) => item.platform === 'windows' && item.arch === 'x64'
    )

    if (!artifact) {
      throw new Error(`Release ${release.version} has no complete Windows x64 artifact`)
    }

    const currentVersion = app.getVersion()

    return {
      version: release.version,
      currentVersion,
      isNew: gt(release.version, currentVersion),
      publishedAt: release.publishedAt,
      description: release.description,
      archiveFile: {
        name: artifact.fileName,
        size: artifact.size,
        downloadUrl: artifact.downloadUrl,
        contentType: artifact.contentType
      }
    }
  }

  private async _update() {
    const { logger, state } = this._context

    if (state.isUpdatingLatestRelease) {
      return
    }

    state.setUpdatingLatestRelease(true)

    try {
      state.setLatestRelease(await this._fetchLatestRelease())
      logger.info('Updated latest release')
    } catch (error) {
      logger.warn('Update latest release failed', error)
    } finally {
      state.setUpdatingLatestRelease(false)
    }
  }
}
