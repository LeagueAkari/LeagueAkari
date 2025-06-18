import { i18next } from '@main/i18n'
import sevenBinPath from '@resources/7za.exe?asset'
import icon from '@resources/LA_ICON.ico?asset'
import updateExecutablePath from '@resources/akari-updater.exe?asset'
import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { GithubApiAsset } from '@shared/types/github'
import { formatError } from '@shared/utils/errors'
import axios, { AxiosResponse } from 'axios'
import { Notification, app, shell } from 'electron'
import { comparer } from 'mobx'
import { extractFull } from 'node-7z'
import cp from 'node:child_process'
import ofs from 'node:original-fs'
import path from 'node:path'
import { Readable, pipeline } from 'node:stream'
import { gte, valid } from 'semver'

import { AppCommonMain } from '../app-common'
import { AkariIpcMain } from '../ipc'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { RemoteConfigMain } from '../remote-config'
import { LatestReleaseWithMetadata } from '../remote-config/state'
import { SettingFactoryMain } from '../setting-factory'
import { SetterSettingService } from '../setting-factory/setter-setting-service'
import { SelfUpdateSettings, SelfUpdateState } from './state'

/**
 * 负责更新包的下载与解压工作
 */
@Shard(SelfUpdateMain.id)
export class SelfUpdateMain implements IAkariShardInitDispose {
  static id = 'self-update-main'

  static DOWNLOAD_DIR_NAME = 'NewUpdates'
  static UPDATE_EXECUTABLE_NAME = 'akari-updater.exe'
  static NEW_VERSION_FLAG = 'NEW_VERSION_FLAG'
  static EXECUTABLE_NAME = 'LeagueAkari.exe'
  static UPDATE_PROGRESS_UPDATE_INTERVAL = 200

  public readonly settings = new SelfUpdateSettings()
  public readonly state = new SelfUpdateState()

  private readonly _log: AkariLogger
  private readonly _setting: SetterSettingService

  private readonly _http = axios.create({
    headers: {
      'User-Agent': `LeagueAkari/${app.getVersion()} `
    }
  })

  private _updateOnQuitFn: (() => void) | null = null
  private _currentUpdateTaskCanceler: (() => void) | null = null

  constructor(
    private readonly _app: AppCommonMain,
    private readonly _ipc: AkariIpcMain,
    private readonly _mobx: MobxUtilsMain,
    private readonly _rc: RemoteConfigMain,
    _loggerFactory: LoggerFactoryMain,
    _settingFactory: SettingFactoryMain
  ) {
    this._log = _loggerFactory.create(SelfUpdateMain.id)
    this._setting = _settingFactory.register(
      SelfUpdateMain.id,
      {
        autoCheckUpdates: { default: this.settings.autoCheckUpdates },
        autoDownloadUpdates: { default: this.settings.autoDownloadUpdates }
      },
      this.settings
    )
  }

  private async _handleState() {
    await this._setting.applyToState()

    this._mobx.propSync(SelfUpdateMain.id, 'state', this.state, [
      'updateProgressInfo',
      'lastUpdateResult'
    ])

    this._mobx.propSync(SelfUpdateMain.id, 'settings', this.settings, [
      'autoCheckUpdates',
      'autoDownloadUpdates',
      'ignoreVersion'
    ])
  }

  private _handlePeriodicCheck() {
    this._mobx.reaction(
      () => [this.settings.autoDownloadUpdates, this._rc.state.latestRelease] as const,
      ([yes, release]) => {
        if (yes && release && release.isNew && release.archiveFile) {
          this._startUpdateProcess(
            release as LatestReleaseWithMetadata & { archiveFile: GithubApiAsset }
          )
        }
      },
      { equals: comparer.shallow }
    )
  }

  private async _downloadUpdate(downloadUrl: string, filename: string) {
    this.state.setUpdateProgressInfo({
      phase: 'downloading',
      downloadingProgress: 0,
      averageDownloadSpeed: 0,
      downloadTimeLeft: -1,
      fileSize: 0,
      unpackingProgress: 0
    })

    let resp: AxiosResponse<Readable>
    try {
      resp = await this._http.get<Readable>(downloadUrl, {
        responseType: 'stream'
      })
      this._log.info(`Connected, downloading update from: ${downloadUrl}, filename: ${filename}`)
    } catch (error) {
      this.state.setUpdateProgressInfo(null)
      this._log.warn(`Failed to download update`, error)
      this._ipc.sendEvent(SelfUpdateMain.id, 'error-download-update', formatError(error))
      throw error
    }

    const totalLength = Number(resp.headers['content-length']) || -1

    this.state.setUpdateProgressInfo({
      phase: 'downloading',
      downloadingProgress: 0,
      averageDownloadSpeed: 0,
      downloadTimeLeft: -1,
      fileSize: totalLength,
      unpackingProgress: 0
    })

    const appDir = app.getPath('userData')
    const downloadDir = path.join(appDir, SelfUpdateMain.DOWNLOAD_DIR_NAME)
    const downloadPath = path.join(downloadDir, filename)

    ofs.mkdirSync(downloadDir, { recursive: true })

    const now = Date.now()

    let totalDownloaded = 0
    let downloadStartTime = now
    let lastUpdateProgressTime = now

    const asyncTask = new Promise<string>((resolve, reject) => {
      const writer = ofs.createWriteStream(downloadPath)

      this._currentUpdateTaskCanceler = () => {
        const error = new Error('Download canceled')
        error.name = 'Canceled'
        resp.data.destroy(error)
        writer.close()
        this._log.info(`Cancelled downloading update ${downloadPath}`)
      }

      const _updateProgress = (nowTime: number) => {
        const averageSpeed = (totalDownloaded / (nowTime - downloadStartTime)) * 1e3
        const timeSecondsLeft = (totalLength - totalDownloaded) / averageSpeed

        this.state.setUpdateProgressInfo({
          phase: 'downloading',
          downloadingProgress: totalDownloaded / totalLength,
          averageDownloadSpeed: averageSpeed,
          downloadTimeLeft: timeSecondsLeft,
          fileSize: totalLength,
          unpackingProgress: 0
        })
      }

      resp.data.on('data', (chunk) => {
        totalDownloaded += chunk.length

        const now = Date.now()
        if (now - lastUpdateProgressTime >= SelfUpdateMain.UPDATE_PROGRESS_UPDATE_INTERVAL) {
          lastUpdateProgressTime = now
          _updateProgress(now)
        }
      })

      resp.data.on('end', () => {
        _updateProgress(Date.now())
      })

      pipeline(resp.data, writer, (error) => {
        if (error) {
          if (error.name === 'Canceled') {
            this.state.setUpdateProgressInfo(null)
            this._ipc.sendEvent(SelfUpdateMain.id, 'cancel-download-update')
          } else {
            this.state.setUpdateProgressInfo({
              phase: 'download-failed',
              downloadingProgress: 0,
              averageDownloadSpeed: 0,
              downloadTimeLeft: -1,
              fileSize: totalLength,
              unpackingProgress: 0
            })
            this._ipc.sendEvent(SelfUpdateMain.id, 'error-download-update', formatError(error))
            this._log.warn(`Failed to download or write update file ${formatError(error)}`)
          }

          if (ofs.existsSync(downloadPath)) {
            ofs.rmSync(downloadPath, { force: true })
          }

          reject(error)
        } else {
          this._log.info(`Downloaded and wrote to: ${downloadPath}`)
          resolve(downloadPath)
        }

        this._currentUpdateTaskCanceler = null
      })
    })

    return asyncTask
  }

  private async _unpackDownloadedUpdate(filepath: string) {
    if (!ofs.existsSync(filepath)) {
      this.state.setUpdateProgressInfo({
        phase: 'unpack-failed',
        downloadingProgress: 1,
        averageDownloadSpeed: 0,
        downloadTimeLeft: 0,
        fileSize: 0,
        unpackingProgress: 0
      })
      this._log.error(`Update package does not exist ${filepath}`)
      throw new Error(`No such file ${filepath}`)
    }

    const extractedTo = path.join(filepath, '..', 'extracted')

    this.state.setUpdateProgressInfo({
      phase: 'unpacking',
      downloadingProgress: 1,
      averageDownloadSpeed: 0,
      downloadTimeLeft: 0,
      fileSize: 0,
      unpackingProgress: 0
    })

    if (ofs.existsSync(extractedTo)) {
      this._log.info(`Old update directory exists, deleting old update directory ${extractedTo}`)
      ofs.rmSync(extractedTo, { recursive: true, force: true })
    }

    const asyncTask = new Promise<string>((resolve, reject) => {
      this._log.info(
        `Starting to unpack update package ${filepath} to ${extractedTo}, using ${sevenBinPath}`
      )

      const seven = extractFull(filepath, extractedTo, {
        $bin: sevenBinPath.replace('app.asar', 'app.asar.unpacked'),
        $progress: true
      })

      this._currentUpdateTaskCanceler = () => {
        const error = new Error('Unpacking canceled')
        error.name = 'Canceled'
        seven.destroy(error)
        this._log.info(`Cancelled unpacking update package ${filepath}`)
      }

      seven.on('progress', (progress) => {
        this.state.setUpdateProgressInfo({
          phase: 'unpacking',
          downloadingProgress: 1,
          averageDownloadSpeed: 0,
          downloadTimeLeft: 0,
          fileSize: 0,
          unpackingProgress: progress.percent / 100
        })
      })

      let hasError = false
      seven.on('end', () => {
        if (hasError) {
          return
        }

        this._currentUpdateTaskCanceler = null

        this.state.setUpdateProgressInfo({
          phase: 'unpacking',
          downloadingProgress: 1,
          averageDownloadSpeed: 0,
          downloadTimeLeft: 0,
          fileSize: 0,
          unpackingProgress: 1
        })

        ofs.rmSync(filepath, { force: true })
        resolve(extractedTo)
      })

      seven.on('rejected', (error) => {
        hasError = true
        this._currentUpdateTaskCanceler = null

        if (error.name === 'Canceled') {
          this.state.setUpdateProgressInfo(null)
          this._ipc.sendEvent(SelfUpdateMain.id, 'cancel-unpack-update')
          this._log.info(`Cancelled unpacking update package ${filepath}`)
        } else {
          this.state.setUpdateProgressInfo({
            phase: 'unpack-failed',
            downloadingProgress: 1,
            averageDownloadSpeed: 0,
            downloadTimeLeft: 0,
            fileSize: 0,
            unpackingProgress: 0
          })
          this._ipc.sendEvent(SelfUpdateMain.id, 'error-unpack-update', formatError(error))
          this._log.error(`Failed to unpack update package`, error)
        }

        if (ofs.existsSync(filepath)) {
          ofs.rmSync(filepath, { recursive: true, force: true })
        }

        reject(error)
      })
    })

    return asyncTask
  }

  private async _applyUpdatesOnNextStartup(newUpdateDir: string, newVersion: string) {
    if (!ofs.existsSync(newUpdateDir)) {
      this.state.setUpdateProgressInfo(null)
      this._log.error(`Update directory does not exist ${newUpdateDir}`)
      throw new Error(`No such directory ${newUpdateDir}`)
    }

    const copiedExecutablePath = path.join(
      app.getPath('temp'),
      SelfUpdateMain.UPDATE_EXECUTABLE_NAME
    )

    this._log.info(
      'Writing update executable',
      updateExecutablePath.replace('app.asar', 'app.asar.unpacked'),
      copiedExecutablePath
    )

    await ofs.promises.copyFile(
      updateExecutablePath.replace('app.asar', 'app.asar.unpacked'),
      copiedExecutablePath
    )

    const appExePath = app.getPath('exe')
    const appDir = path.dirname(appExePath)

    if (this._updateOnQuitFn) {
      this._log.info(`Previous update task exists, removing previous task`)
    }

    this._log.info(
      `Adding exit task: update process ${copiedExecutablePath}: ${newUpdateDir} ${appDir} ${SelfUpdateMain.EXECUTABLE_NAME}`
    )

    this._createNotification(
      i18next.t('common.appName'),
      i18next.t('self-update-main.updateOnNextStartup')
    )

    const _updateOnQuitFn = () => {
      const c = cp.spawn(
        copiedExecutablePath,
        [`"${newUpdateDir}"`, `"${appDir}"`, `"${SelfUpdateMain.EXECUTABLE_NAME}"`],
        {
          detached: true,
          stdio: 'ignore',
          shell: true,
          cwd: app.getPath('temp')
        }
      )

      c.unref()

      ofs.writeFileSync(
        path.join(app.getPath('userData'), SelfUpdateMain.NEW_VERSION_FLAG),
        JSON.stringify(newVersion)
      )
    }

    this._updateOnQuitFn = _updateOnQuitFn

    this.state.setUpdateProgressInfo({
      phase: 'waiting-for-restart',
      downloadingProgress: 1,
      averageDownloadSpeed: 0,
      downloadTimeLeft: 0,
      fileSize: 0,
      unpackingProgress: 1
    })

    this._currentUpdateTaskCanceler = () => {
      if (ofs.existsSync(copiedExecutablePath)) {
        ofs.rmSync(copiedExecutablePath, {
          force: true,
          recursive: true
        })
      }

      if (ofs.existsSync(newUpdateDir)) {
        ofs.rmSync(newUpdateDir, { recursive: true, force: true })
      }

      this._currentUpdateTaskCanceler = null
      this._updateOnQuitFn = null
      this.state.setUpdateProgressInfo(null)

      this._log.info(
        `Cancelling exit update task`,
        `Deleting update script ${copiedExecutablePath}`,
        `Deleting update directory ${newUpdateDir}`
      )
    }
  }

  private async _startUpdateProcess(
    release: LatestReleaseWithMetadata & { archiveFile: GithubApiAsset }
  ) {
    if (
      this.state.updateProgressInfo &&
      (this.state.updateProgressInfo.phase === 'downloading' ||
        this.state.updateProgressInfo.phase === 'unpacking' ||
        this.state.updateProgressInfo.phase === 'waiting-for-restart')
    ) {
      return
    }

    this._ipc.sendEvent(SelfUpdateMain.id, 'start-update')

    let downloadPath: string
    try {
      downloadPath = await this._downloadUpdate(
        release.archiveFile.browser_download_url,
        release.archiveFile.name
      )
    } catch {
      return
    }

    let unpackedPath: string
    try {
      unpackedPath = await this._unpackDownloadedUpdate(downloadPath)
    } catch {
      return
    }

    try {
      await this._applyUpdatesOnNextStartup(unpackedPath, release.tag_name)
    } catch {}
  }

  private _cancelUpdateProcess() {
    if (this._currentUpdateTaskCanceler) {
      try {
        this._currentUpdateTaskCanceler()
      } catch (error) {
        this._ipc.sendEvent(SelfUpdateMain.id, 'error-cancel-update', formatError(error))
        this._log.warn(`Failed to cancel update task`, error)
      }
    }

    this.state.setUpdateProgressInfo(null)
  }

  private async _checkUpdates() {
    try {
      const release = await this._rc.updateLatestReleaseManually()

      if (release && release.isNew && release.archiveFile) {
        return { result: 'new-updates' }
      } else {
        return { result: 'no-updates' }
      }
    } catch (error) {
      return { result: 'failed', reason: error }
    }
  }

  private _handleIpcCall() {
    this._ipc.onCall(SelfUpdateMain.id, 'checkUpdates', async () => {
      return await this._checkUpdates()
    })

    this._ipc.onCall(SelfUpdateMain.id, 'startUpdate', async () => {
      if (
        this._rc.state.latestRelease &&
        this._rc.state.latestRelease.isNew &&
        this._rc.state.latestRelease.archiveFile
      ) {
        await this._startUpdateProcess(
          this._rc.state.latestRelease as LatestReleaseWithMetadata & {
            archiveFile: GithubApiAsset
          }
        )
      }
    })

    // 仅仅用于 debug
    this._ipc.onCall(SelfUpdateMain.id, 'forceStartUpdate', async () => {
      if (this._rc.state.latestRelease && this._rc.state.latestRelease.archiveFile) {
        this._log.info(
          'Force start update, target:',
          this._rc.state.latestRelease.tag_name,
          this._rc.state.latestRelease.archiveFile.name
        )
        await this._startUpdateProcess(
          this._rc.state.latestRelease as LatestReleaseWithMetadata & {
            archiveFile: GithubApiAsset
          }
        )
      } else {
        this._log.warn('No latest release found, cannot force start update')
      }
    })

    this._ipc.onCall(SelfUpdateMain.id, 'cancelUpdate', () => {
      this._cancelUpdateProcess()
    })

    this._ipc.onCall(SelfUpdateMain.id, 'openNewUpdatesDir', () => {
      const p = path.join(app.getPath('userData'), SelfUpdateMain.DOWNLOAD_DIR_NAME)
      return shell.openPath(p)
    })
  }

  async onInit() {
    await this._handleState()
    await this._checkLastFailedUpdate()
    this._handleUpdateHttpProxy()
    this._handlePeriodicCheck()
    this._handleIpcCall()
  }

  async onDispose() {
    this._updateOnQuitFn?.()

    if (this.state.updateProgressInfo?.phase !== 'waiting-for-restart') {
      this._cancelUpdateProcess()
    }
  }

  private _createNotification(title = 'League Akari', text: string) {
    const notification = new Notification({
      title,
      body: text,
      icon: icon
    })

    notification.show()
  }

  private async _checkLastFailedUpdate() {
    const newVersionFlagPath = path.join(app.getPath('userData'), SelfUpdateMain.NEW_VERSION_FLAG)

    this._log.info(`Checking auto-update result`, newVersionFlagPath)

    try {
      await ofs.promises.access(newVersionFlagPath)
    } catch (error) {
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
          this._log.info(
            `Looks like it has been successfully updated`,
            targetVersion,
            newVersionFlagPath
          )
          this.state.setLastUpdateResult({
            success: true,
            reason: 'Successfully updated'
          })
        } else {
          this._log.info(`Last auto-update seems to have failed`, targetVersion, newVersionFlagPath)
          this.state.setLastUpdateResult({
            success: false,
            reason: 'Something wrong...'
          })
        }
      } else {
        this._log.warn('Update flag is not a normal version number', targetVersion)
      }

      await ofs.promises.unlink(newVersionFlagPath)
    } catch (error) {
      this._log.warn('Error checking update flag', error)
    }
  }

  private _handleUpdateHttpProxy() {
    this._mobx.reaction(
      () => this._app.settings.httpProxy,
      (httpProxy) => {
        if (httpProxy.strategy === 'force') {
          this._http.defaults.proxy = {
            host: httpProxy.host,
            port: httpProxy.port
          }
        } else if (httpProxy.strategy === 'auto') {
          this._http.defaults.proxy = undefined
        } else if (httpProxy.strategy === 'disable') {
          this._http.defaults.proxy = false
        }
      },
      { fireImmediately: true }
    )
  }
}
