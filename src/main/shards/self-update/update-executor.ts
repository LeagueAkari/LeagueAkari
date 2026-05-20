import { i18next } from '@main/i18n'
import icon from '@resources/LA_ICON.ico?asset'
import updateExecutablePath from '@resources/akari-updater.exe?asset'
import { LatestReleaseInfo } from '@shared/types/akari'
import { formatError } from '@shared/utils/errors'
import { AxiosResponse } from 'axios'
import { Notification, app } from 'electron'
import cp from 'node:child_process'
import ofs from 'node:original-fs'
import path from 'node:path'
import { Readable, pipeline } from 'node:stream'

import {
  DOWNLOAD_DIR_NAME,
  EXECUTABLE_NAME,
  NEW_VERSION_FLAG,
  PLATFORM_UNSUPPORTED_REASON,
  type SelfUpdateActionResult,
  type SelfUpdateMainContext,
  UPDATE_EXECUTABLE_NAME,
  UPDATE_PROGRESS_UPDATE_INTERVAL
} from './context'
import { shouldApplyDownloadedUpdate, shouldDownloadUpdateArchive } from './platform'

interface UpdateJob {
  abortController: AbortController
  canceled: boolean
}

const UPDATE_CANCELED_ERROR_NAME = 'Canceled'

function createUpdateCanceledError() {
  const error = new Error('Download canceled')
  error.name = UPDATE_CANCELED_ERROR_NAME
  return error
}

function isUpdateCanceledError(error: unknown) {
  return error instanceof Error && error.name === UPDATE_CANCELED_ERROR_NAME
}

export class SelfUpdateExecutor {
  private _updateOnQuitFn: (() => Promise<void>) | null = null
  private _updateCancelFn: (() => void) | null = null
  private _currentJob: UpdateJob | null = null

  constructor(private readonly _context: SelfUpdateMainContext) {}

  async start(release: LatestReleaseInfo): Promise<SelfUpdateActionResult> {
    if (!shouldDownloadUpdateArchive() || !shouldApplyDownloadedUpdate()) {
      this._context.logger.info('Skip self-update download and apply on unsupported platform', {
        platform: process.platform
      })
      this._context.state.setUpdateProgressInfo(null)
      return { result: 'failed', reason: PLATFORM_UNSUPPORTED_REASON }
    }

    if (
      this._context.state.updateProgressInfo &&
      (this._context.state.updateProgressInfo.phase === 'downloading' ||
        this._context.state.updateProgressInfo.phase === 'waiting-for-restart')
    ) {
      return { result: 'no-op' }
    }

    const job = this._createJob()

    try {
      const downloadPath = await this._downloadUpdate(
        release.archiveFile.downloadUrl,
        release.archiveFile.name,
        job
      )
      await this._spawnUpdaterOnQuit(downloadPath, release.version, job)

      return { result: 'ok' }
    } catch (error) {
      if (this._isJobCanceled(job) || isUpdateCanceledError(error)) {
        this._context.state.setUpdateProgressInfo(null)
        return { result: 'ok' }
      }

      if (this._context.state.updateProgressInfo?.phase !== 'download-failed') {
        this._setDownloadFailed(release.archiveFile.size)
        this._context.ipc.sendEvent(
          this._context.namespace,
          'error-download-update',
          formatError(error)
        )
      }

      this._context.logger.warn('Self-update process failed', error)
      return { result: 'failed', reason: formatError(error) }
    } finally {
      if (
        this._currentJob === job &&
        this._context.state.updateProgressInfo?.phase !== 'waiting-for-restart'
      ) {
        this._currentJob = null
      }
    }
  }

  cancel(): SelfUpdateActionResult {
    if (!shouldApplyDownloadedUpdate()) {
      this._context.state.setUpdateProgressInfo(null)
      return { result: 'failed', reason: PLATFORM_UNSUPPORTED_REASON }
    }

    this._cancelCurrentJob()

    if (this._updateCancelFn) {
      try {
        this._updateCancelFn()
      } catch (error) {
        this._context.ipc.sendEvent(
          this._context.namespace,
          'error-cancel-update',
          formatError(error)
        )
        this._context.logger.warn(`Failed to cancel update task`, error)
      }
    }

    this._context.state.setUpdateProgressInfo(null)
    return { result: 'ok' }
  }

  async runUpdateOnQuit() {
    if (!shouldApplyDownloadedUpdate()) {
      return
    }

    await this._updateOnQuitFn?.()
  }

  cancelIfNotWaitingForRestart() {
    if (this._context.state.updateProgressInfo?.phase !== 'waiting-for-restart') {
      this.cancel()
    }
  }

  private _createJob(): UpdateJob {
    const job = {
      abortController: new AbortController(),
      canceled: false
    }

    this._currentJob = job
    this._updateCancelFn = null
    return job
  }

  private _cancelCurrentJob() {
    if (!this._currentJob || this._currentJob.canceled) {
      return
    }

    this._currentJob.canceled = true
    this._currentJob.abortController.abort()
  }

  private _isJobCanceled(job: UpdateJob) {
    return job.canceled || this._currentJob !== job || job.abortController.signal.aborted
  }

  private _setDownloadFailed(fileSize: number) {
    this._context.state.setUpdateProgressInfo({
      phase: 'download-failed',
      downloadingProgress: 0,
      averageDownloadSpeed: 0,
      downloadTimeLeft: -1,
      fileSize
    })
  }

  private async _downloadUpdate(downloadUrl: string, filename: string, job: UpdateJob) {
    if (!shouldDownloadUpdateArchive()) {
      this._context.logger.info('Skip update archive download on unsupported platform', {
        platform: process.platform
      })
      this._context.state.setUpdateProgressInfo(null)
      throw new Error(PLATFORM_UNSUPPORTED_REASON)
    }

    const { state, logger, ipc, httpClient, namespace } = this._context

    state.setUpdateProgressInfo({
      phase: 'downloading',
      downloadingProgress: 0,
      averageDownloadSpeed: 0,
      downloadTimeLeft: -1,
      fileSize: 0
    })

    let resp: AxiosResponse<Readable>
    try {
      resp = await httpClient.get<Readable>(downloadUrl, {
        responseType: 'stream',
        signal: job.abortController.signal
      })
      logger.info(`Connected, downloading update from: ${downloadUrl}, filename: ${filename}`)
    } catch (error) {
      if (this._isJobCanceled(job)) {
        state.setUpdateProgressInfo(null)
        ipc.sendEvent(namespace, 'cancel-download-update')
        throw createUpdateCanceledError()
      }

      this._setDownloadFailed(0)
      logger.warn(`Failed to download update`, error)
      ipc.sendEvent(namespace, 'error-download-update', formatError(error))
      throw error
    }

    const totalLength = Number(resp.headers['content-length']) || -1

    state.setUpdateProgressInfo({
      phase: 'downloading',
      downloadingProgress: 0,
      averageDownloadSpeed: 0,
      downloadTimeLeft: -1,
      fileSize: totalLength
    })

    const appDir = app.getPath('userData')
    const downloadDir = path.join(appDir, DOWNLOAD_DIR_NAME)
    const downloadPath = path.join(downloadDir, filename)

    await ofs.promises.mkdir(downloadDir, { recursive: true })

    const now = Date.now()

    let totalDownloaded = 0
    let downloadStartTime = now
    let lastUpdateProgressTime = now

    const asyncTask = new Promise<string>((resolve, reject) => {
      const writer = ofs.createWriteStream(downloadPath)

      this._updateCancelFn = () => {
        job.canceled = true
        job.abortController.abort()
        const error = createUpdateCanceledError()
        resp.data.destroy(error)
        writer.close()
        logger.info(`Cancelled downloading update ${downloadPath}`)
      }

      const updateProgress = (nowTime: number, completed = false) => {
        const elapsedMs = Math.max(1, nowTime - downloadStartTime)
        const averageSpeed = (totalDownloaded / elapsedMs) * 1e3
        const hasKnownTotalLength = totalLength > 0
        const progress = hasKnownTotalLength
          ? Math.min(1, totalDownloaded / totalLength)
          : completed
            ? 1
            : 0
        const timeSecondsLeft =
          hasKnownTotalLength && averageSpeed > 0
            ? Math.max(0, (totalLength - totalDownloaded) / averageSpeed)
            : -1

        state.setUpdateProgressInfo({
          phase: 'downloading',
          downloadingProgress: progress,
          averageDownloadSpeed: averageSpeed,
          downloadTimeLeft: timeSecondsLeft,
          fileSize: totalLength
        })
      }

      resp.data.on('data', (chunk) => {
        totalDownloaded += chunk.length

        const now = Date.now()
        if (now - lastUpdateProgressTime >= UPDATE_PROGRESS_UPDATE_INTERVAL) {
          lastUpdateProgressTime = now
          updateProgress(now)
        }
      })

      resp.data.on('end', () => {
        updateProgress(Date.now(), true)
      })

      pipeline(resp.data, writer, (error) => {
        if (error || this._isJobCanceled(job)) {
          const finalError = this._isJobCanceled(job)
            ? createUpdateCanceledError()
            : error || createUpdateCanceledError()

          if (isUpdateCanceledError(finalError)) {
            state.setUpdateProgressInfo(null)
            ipc.sendEvent(namespace, 'cancel-download-update')
          } else {
            this._setDownloadFailed(totalLength)
            ipc.sendEvent(namespace, 'error-download-update', formatError(finalError))
            logger.warn(`Failed to download or write update file ${formatError(finalError)}`)
          }

          ofs.promises
            .rm(downloadPath, { force: true })
            .catch((error) => logger.warn(`Failed to remove update archive ${downloadPath}`, error))
            .finally(() => reject(finalError))
        } else {
          logger.info(`Downloaded and wrote to: ${downloadPath}`)
          resolve(downloadPath)
        }

        this._updateCancelFn = null
      })
    })

    return asyncTask
  }

  private async _spawnUpdaterOnQuit(archivePath: string, newVersion: string, job: UpdateJob) {
    if (!shouldApplyDownloadedUpdate()) {
      this._context.logger.info('Skip update archive apply on unsupported platform', {
        platform: process.platform
      })
      this._context.state.setUpdateProgressInfo(null)
      throw new Error(PLATFORM_UNSUPPORTED_REASON)
    }

    if (this._isJobCanceled(job)) {
      throw createUpdateCanceledError()
    }

    const { logger, appCommon, state } = this._context
    const copiedExecutablePath = path.join(app.getPath('temp'), UPDATE_EXECUTABLE_NAME)

    logger.info(
      'Writing update executable',
      updateExecutablePath.replace('app.asar', 'app.asar.unpacked'),
      copiedExecutablePath
    )

    await ofs.promises.copyFile(
      updateExecutablePath.replace('app.asar', 'app.asar.unpacked'),
      copiedExecutablePath
    )

    if (this._isJobCanceled(job)) {
      await ofs.promises.rm(copiedExecutablePath, { force: true, recursive: true })
      throw createUpdateCanceledError()
    }

    const appExePath = app.getPath('exe')
    const appDir = path.dirname(appExePath)

    if (this._updateOnQuitFn) {
      logger.info(`Previous update task exists, removing previous task`)
    }

    logger.info(
      `Adding exit task: update process ${copiedExecutablePath}: ${archivePath} -> ${appDir}, executable: ${EXECUTABLE_NAME}`
    )

    this._createNotification(
      i18next.t('appName', { ns: 'common' }),
      i18next.t('self-update-main.updateOnQuit')
    )

    const updateOnQuitFn = async () => {
      const c = cp.spawn(
        copiedExecutablePath,
        [
          `--lang=${appCommon.settings.locale}`,
          `--executable="${EXECUTABLE_NAME}"`,
          'apply',
          `--archive="${archivePath}"`,
          `--target="${appDir}"`,
          '--delete-archive',
          '--launch'
        ],
        {
          detached: true,
          stdio: 'ignore',
          shell: true,
          cwd: app.getPath('temp')
        }
      )

      logger.info(`Command: ${c.spawnargs.join(' ')}`)

      c.unref()

      await ofs.promises.writeFile(
        path.join(app.getPath('userData'), NEW_VERSION_FLAG),
        JSON.stringify(newVersion)
      )
    }

    this._updateOnQuitFn = updateOnQuitFn

    state.setUpdateProgressInfo({
      phase: 'waiting-for-restart',
      downloadingProgress: 1,
      averageDownloadSpeed: 0,
      downloadTimeLeft: 0,
      fileSize: 0
    })

    this._updateCancelFn = () => {
      job.canceled = true
      job.abortController.abort()

      ofs.promises.rm(copiedExecutablePath, { force: true, recursive: true }).catch((error) => {
        logger.warn(`Failed to remove update script ${copiedExecutablePath}`, error)
      })

      ofs.promises.rm(archivePath, { recursive: true, force: true }).catch((error) => {
        logger.warn(`Failed to remove update archive ${archivePath}`, error)
      })

      this._updateCancelFn = null
      this._updateOnQuitFn = null
      if (this._currentJob === job) {
        this._currentJob = null
      }
      state.setUpdateProgressInfo(null)

      logger.info(
        `Cancelling exit update task`,
        `Deleting update script ${copiedExecutablePath}`,
        `Deleting update archive ${archivePath}`
      )
    }
  }

  private _createNotification(title = 'League Akari', text: string) {
    const notification = new Notification({
      title,
      body: text,
      icon
    })

    notification.show()
  }
}
