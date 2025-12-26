import { tools } from '@leagueakari/league-akari-addons'
import { i18next } from '@main/i18n'
import { DEEP_LINK_PROTOCOL } from '@main/utils/deep-link'
import RES_POSITIONER from '@resources/AKARI?asset&asarUnpack'
import { IAkariShardInitDispose, Shard, SharedGlobalShard } from '@shared/akari-shard'
import { JumpListItem, app } from 'electron'
import { comparer } from 'mobx'
import cp from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import util from 'node:util'
import regedit from 'regedit'

import { AppCommonMain } from '../app-common'
import { AkariIpcMain } from '../ipc'
import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import { ClientInstallationState } from './state'

const execAsync = util.promisify(cp.exec)

regedit.setExternalVBSLocation(path.resolve(RES_POSITIONER, '..', 'regedit-vbs'))

/**
 * 情报搜集模块
 */
@Shard(ClientInstallationMain.id)
export class ClientInstallationMain implements IAkariShardInitDispose {
  static id = 'client-installation-main'

  static readonly TENCENT_REG_INSTALL_PATH = 'HKCU\\Software\\Tencent\\LOL'
  static readonly TENCENT_REG_INSTALL_VALUE = 'InstallPath'
  static readonly TENCENT_INSTALL_DIRNAME = 'WeGameApps'
  static readonly TENCENT_LOL_DIRNAME = '英雄联盟'
  static readonly WEGAME_DEFAULTICON_PATH = 'HKCU\\wegame\\DefaultIcon' // 这个 key 代表了 WeGame 的图标, 间接代表了安装位置

  static readonly LIVE_STREAMING_CLIENTS = [
    'obs32.exe',
    'obs64.exe',
    'obs.exe',
    'xsplit.core.exe',
    'livehime.exe',
    'yymixer.exe',
    'douyutool.exe',
    'huomaotool.exe',
    'AliceInCradle.exe' // for test
  ]

  static readonly LIVE_STREAMING_CLIENT_POLL_INTERVAL = 20 * 60 * 1000

  public readonly state = new ClientInstallationState()

  private readonly _log: AkariLogger

  private _liveStreamingTimer: NodeJS.Timeout | null = null

  constructor(
    readonly _loggerFactory: LoggerFactoryMain,
    private readonly _app: AppCommonMain,
    private readonly _ipc: AkariIpcMain,
    private readonly _mobx: MobxUtilsMain,
    private readonly _shared: SharedGlobalShard
  ) {
    this._log = _loggerFactory.create(ClientInstallationMain.id)
  }

  async onInit() {
    this._handleState()
    this._handleIpcCall()
    this._updateTencentPathsByReg()
    this._updateTencentPathsByFile()
    this._updateLeagueClientInstallationByFile()
    this._handleJumpList()

    this._updateLiveStreamingClientsRunningInfo()
    this._liveStreamingTimer = setInterval(
      () => this._updateLiveStreamingClientsRunningInfo(),
      ClientInstallationMain.LIVE_STREAMING_CLIENT_POLL_INTERVAL
    )
  }

  private async _handleState() {
    this._mobx.propSync(ClientInstallationMain.id, 'state', this.state, [
      'leagueClientExecutablePaths',
      'tencentInstallationPath',
      'weGameExecutablePath',
      'officialRiotClientExecutablePath',
      'tclsExecutablePath',
      'weGameLauncherExecutablePath',
      'detectedLiveStreamingClients'
    ])
  }

  /**
   * 通过注册表来找寻位置
   * @returns
   */
  private async _updateTencentPathsByReg() {
    try {
      const list: string[] = []

      if (!this.state.tencentInstallationPath) {
        list.push(ClientInstallationMain.TENCENT_REG_INSTALL_PATH)
      }

      if (!this.state.weGameExecutablePath) {
        list.push(ClientInstallationMain.WEGAME_DEFAULTICON_PATH)
      }

      const result = await regedit.promisified.list(list)

      const item1 = result[ClientInstallationMain.TENCENT_REG_INSTALL_PATH]
      const item2 = result[ClientInstallationMain.WEGAME_DEFAULTICON_PATH]

      if (item1 && item1.exists) {
        const p = item1.values[ClientInstallationMain.TENCENT_REG_INSTALL_VALUE]

        if (!p) {
          return
        }

        try {
          await fs.promises.access(p.value as string)
        } catch {
          this._log.info(
            'Registry detected Tencent League of Legends installation but cannot access, possibly not exists',
            p.value
          )
          return
        }

        this._log.info('Registry detected Tencent League of Legends installation', p.value)
        this.state.setTencentInstallationPath(path.normalize(p.value as string))

        try {
          const tclsPath = path.resolve(p.value as string, 'Launcher', 'Client.exe')
          await fs.promises.access(tclsPath)
          this.state.setTclsExecutablePath(path.normalize(tclsPath))
        } catch {
          this._log.info('TCLS cannot access, possibly not exists', p.value)
          return
        }

        try {
          const weGamePath = path.resolve(p.value as string, 'WeGameLauncher', 'launcher.exe')
          await fs.promises.access(weGamePath)
          this.state.setWeGameLauncherExecutablePath(path.normalize(weGamePath))
        } catch {
          this._log.info('WeGame launcher cannot access, possibly not exists', p.value)
          return
        }
      }

      if (item2 && item2.exists) {
        const p = item2.values[''].value as string
        const match = p.match(/"([^"]+)"/)

        if (match) {
          try {
            await fs.promises.access(match[1])
          } catch {
            this._log.info(
              'Registry detected WeGame installation but cannot access, possibly not exists',
              match[1]
            )
            return
          }

          this._log.info('Registry detected WeGame installation', match[1])
          this.state.setWeGameExecutablePath(path.normalize(match[1]))
        }
      }
    } catch (error) {
      this._log.warn(`Failed to read installation directory using registry information`, error)
    }
  }

  private async _getDrives() {
    try {
      const { stdout } = await execAsync(
        'powershell -Command "Get-CimInstance -ClassName Win32_LogicalDisk | Where-Object {$_.DriveType -eq 3} | Select-Object -ExpandProperty DeviceID"'
      )
      return stdout
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => /^[A-Z]:$/.test(line))
    } catch (error) {
      this._log.warn('Failed to get logical drives', error)
      return []
    }
  }

  /**
   * 通过扫盘来更新腾讯服安装位置
   */
  private async _updateTencentPathsByFile() {
    if (this.state.tencentInstallationPath) {
      return
    }

    const drives = await this._getDrives()

    this._log.info('Current logical drives', drives)

    for (const drive of drives) {
      const installation = path.join(
        drive,
        ClientInstallationMain.TENCENT_INSTALL_DIRNAME,
        ClientInstallationMain.TENCENT_LOL_DIRNAME
      )

      try {
        await fs.promises.access(installation)

        this._log.info('Detected Tencent League of Legends installation by file', installation)

        this.state.setTencentInstallationPath(path.normalize(installation))

        const tcls = path.resolve(installation, 'Launcher', 'Client.exe')
        const weGameLauncher = path.resolve(installation, 'WeGameLauncher', 'launcher.exe')

        try {
          await fs.promises.access(tcls)
          this.state.setTclsExecutablePath(path.normalize(tcls))
          this._log.info('Detected Tencent TCLS installation by file', tcls)
        } catch {}

        try {
          await fs.promises.access(weGameLauncher)
          this.state.setWeGameLauncherExecutablePath(path.normalize(weGameLauncher))
          this._log.info('Detected Tencent WeGameLauncher installation by file', weGameLauncher)
        } catch {}

        // 如果都找到了，则直接退出
        if (this.state.tclsExecutablePath && this.state.weGameLauncherExecutablePath) {
          return
        }
      } catch (error) {
        continue
      }
    }
  }

  private async _maybeOfficialRiotClient(p: string) {
    return p.includes('Riot Games') && !p.includes('英雄联盟')
  }

  private async _updateLeagueClientInstallationByFile() {
    if (!process.env['ProgramData']) {
      this._log.warn(
        'Failed to get ProgramData environment variable, cannot detect LeagueClient installation'
      )
      return
    }

    const installationJson = path.join(
      process.env['ProgramData'],
      'Riot Games',
      'RiotClientInstalls.json'
    )

    try {
      const stats = await fs.promises.stat(installationJson)

      if (!stats.isFile()) {
        return
      }

      const content = await fs.promises.readFile(installationJson, { encoding: 'utf-8' })
      const json = JSON.parse(content)

      if (typeof json !== 'object') {
        return
      }

      if (typeof json.associated_client === 'object') {
        const installations = Object.keys(json.associated_client as Record<string, string>)

        const result: string[] = []
        for (const installation of installations) {
          try {
            const ins = path.resolve(installation, 'LeagueClient.exe')
            await fs.promises.access(ins)
            result.push(ins)
          } catch (error) {
            this._log.info(
              'Detected LeagueClient installation but cannot access, possibly not exists',
              installation
            )
          }
        }

        this.state.setLeagueClientExecutablePaths(result.map((p) => path.normalize(p)))

        const riotInstallations = Object.values(json.associated_client as Record<string, string>)

        for (const p of riotInstallations) {
          if (await this._maybeOfficialRiotClient(p)) {
            try {
              await fs.promises.access(p)
              this.state.setOfficialRiotClientExecutablePath(path.normalize(p))
              this._log.info('Detected official RiotClient installation', p)
              break // only one official RiotClient installation is allowed
            } catch (error) {
              this._log.info(
                'Detected RiotClient installation but cannot access, possibly not exists',
                p
              )
              continue
            }
          }
        }
      }
    } catch (error) {
      this._log.warn('Failed to read LeagueClient installation', error)
    }
  }

  /**
   * try being a spyware 👁️👁️
   */
  private _updateLiveStreamingClientsRunningInfo() {
    const result: string[] = []

    for (const client of ClientInstallationMain.LIVE_STREAMING_CLIENTS) {
      const r = tools.getPidsByName(client)
      if (r.length) {
        result.push(client)
      }
    }

    this.state.setDetectedLiveStreamingClients(result)
  }

  private _handleIpcCall() {
    this._ipc.onCall(ClientInstallationMain.id, 'launchTencentTcls', async () => {
      await this._launchTencentTcls()
    })

    this._ipc.onCall(ClientInstallationMain.id, 'launchWeGame', async () => {
      await this._launchWeGame()
    })

    this._ipc.onCall(ClientInstallationMain.id, 'launchDefaultRiotClient', async () => {
      await this._launchDefaultRiotClient()
    })

    this._ipc.onCall(ClientInstallationMain.id, 'launchWeGameLeagueOfLegends', async () => {
      await this._launchWeGameLeagueOfLegends()
    })
  }

  private _launchTencentTcls() {
    if (!this.state.tclsExecutablePath) {
      return
    }

    const location = this.state.tclsExecutablePath

    return new Promise<void>((resolve, reject) => {
      const p = cp.spawn(`"${location}"`, [], {
        detached: true,
        stdio: 'ignore',
        shell: true
      })

      let hasError = false
      p.on('rejected', (err) => {
        reject(err)
      })

      p.on('error', (err) => {
        hasError = true
        this._log.error('Failed to launch TCLS client', location, err)
        reject(err)
      })

      setImmediate(() => {
        if (hasError) {
          return
        }

        p.unref()
        resolve()
      })
    })
  }

  private _launchWeGameLeagueOfLegends() {
    if (!this.state.weGameLauncherExecutablePath) {
      return
    }

    const location = this.state.weGameLauncherExecutablePath

    return new Promise<void>((resolve, reject) => {
      const child = cp.spawn(`"${location}"`, [], { detached: true, stdio: 'ignore', shell: true })

      let hasError = false
      child.on('rejected', (err) => {
        reject(err)
      })

      child.on('error', (err) => {
        hasError = true
        this._log.warn('Failed to launch WeGame (LoL) client', location, err)
        reject(err)
      })

      setImmediate(() => {
        if (hasError) {
          return
        }

        child.unref()
        resolve()
      })
    })
  }

  private _launchWeGame() {
    if (!this.state.weGameExecutablePath) {
      return
    }

    const executablePath = this.state.weGameExecutablePath

    return new Promise<void>((resolve, reject) => {
      const p = cp.spawn(`"${executablePath}"`, [], {
        detached: true,
        stdio: 'ignore',
        shell: true
      })

      let hasError = false
      p.on('rejected', (err) => {
        reject(err)
      })

      p.on('error', (err) => {
        hasError = true
        this._log.warn('Failed to launch WeGame client', executablePath, err)
        reject(err)
      })

      setImmediate(() => {
        if (hasError) {
          return
        }

        p.unref()
        resolve()
      })
    })
  }

  private _launchDefaultRiotClient() {
    if (!this.state.officialRiotClientExecutablePath) {
      return
    }

    const executablePath = this.state.officialRiotClientExecutablePath

    return new Promise<void>((resolve, reject) => {
      const p = cp.spawn(
        `"${executablePath}"`,
        ['--launch-product=league_of_legends', '--launch-patchline=live'],
        {
          detached: true,
          stdio: 'ignore',
          shell: true
        }
      )

      let hasError = false
      p.on('rejected', (err) => {
        reject(err)
      })

      p.on('error', (err) => {
        hasError = true
        this._log.warn('Failed to launch Riot client', executablePath, err)
        reject(err)
      })

      setImmediate(() => {
        if (hasError) {
          return
        }

        p.unref()
        resolve()
      })
    })
  }

  private _buildJumpList() {
    const jumpListItems: JumpListItem[] = []
    const t = i18next.getFixedT(null, 'main', 'client-installation-main.jumpList')

    if (this.state.tclsExecutablePath) {
      jumpListItems.push({
        type: 'task',
        title: t('launchTcls.title'),
        program: 'explorer.exe',
        args: `${DEEP_LINK_PROTOCOL}://shards/${ClientInstallationMain.id}/launch-tcls-client`,
        iconPath: process.execPath,
        iconIndex: 0,
        description: t('launchTcls.description')
      })
    }

    if (this.state.weGameLauncherExecutablePath) {
      jumpListItems.push({
        type: 'task',
        title: t('launchWeGame.title'),
        program: 'explorer.exe',
        args: `${DEEP_LINK_PROTOCOL}://shards/${ClientInstallationMain.id}/launch-we-game-lol`,
        iconPath: process.execPath,
        iconIndex: 0,
        description: t('launchWeGame.description')
      })
    }

    if (this.state.officialRiotClientExecutablePath) {
      jumpListItems.push({
        type: 'task',
        title: t('launchRiot.title'),
        program: 'explorer.exe',
        args: `"${DEEP_LINK_PROTOCOL}://shards/${ClientInstallationMain.id}/launch-riot-client-lol"`,
        iconPath: process.execPath,
        iconIndex: 0,
        description: t('launchRiot.description')
      })
    }

    if (jumpListItems.length) {
      app.setJumpList([
        {
          type: 'tasks',
          items: jumpListItems
        }
      ])
    } else {
      app.setJumpList(null)
    }
  }

  private _handleJumpList() {
    let startupLaunch = false

    const handleDeepLink = (url: string, triggedBySecondInstance = false) => {
      const parsed = new URL(url, `${DEEP_LINK_PROTOCOL}://shards`)

      switch (parsed.pathname) {
        case `/${ClientInstallationMain.id}/launch-tcls-client`:
          if (!this.state.tclsExecutablePath) {
            return
          }

          this._launchTencentTcls()
          break
        case `/${ClientInstallationMain.id}/launch-riot-client-lol`:
          if (!this.state.officialRiotClientExecutablePath) {
            return
          }

          this._launchDefaultRiotClient()
          break
        case `/${ClientInstallationMain.id}/launch-we-game-lol`:
          if (!this.state.weGameLauncherExecutablePath) {
            return
          }

          this._launchWeGameLeagueOfLegends()
          break
        default:
          this._log.warn('Unknown deep link', parsed.pathname)
          return
      }

      if (!triggedBySecondInstance) {
        startupLaunch = true
      }
    }

    this._mobx.reaction(
      () => [
        this._app.settings.locale,
        this.state.tclsExecutablePath,
        this.state.weGameLauncherExecutablePath,
        this.state.officialRiotClientExecutablePath
      ],
      () => {
        this._buildJumpList()

        if (this._shared.global.startupDeepLink && !startupLaunch) {
          handleDeepLink(this._shared.global.startupDeepLink, false)
        }
      },
      { fireImmediately: true, equals: comparer.shallow, delay: 500 }
    )

    this._shared.global.events.on('second-instance-deep-link', (url) => {
      handleDeepLink(url, true)
    })
  }

  async onDispose() {
    if (this._liveStreamingTimer) {
      clearInterval(this._liveStreamingTimer)
    }
  }
}
