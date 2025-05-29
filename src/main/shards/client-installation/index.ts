import { tools } from '@leagueakari/league-akari-addons'
import RES_POSITIONER from '@resources/AKARI?asset&asarUnpack'
import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import cp from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import util from 'node:util'
import regedit from 'regedit'

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
    private readonly _ipc: AkariIpcMain,
    private readonly _loggerFactory: LoggerFactoryMain,
    private readonly _mobx: MobxUtilsMain
  ) {
    this._log = _loggerFactory.create(ClientInstallationMain.id)
  }

  async onInit() {
    this._handleState()
    this._handleIpcCall()
    this._updateTencentPathsByReg()
    this._updateTencentPathsByFile()
    this._updateLeagueClientInstallationByFile()

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
      'hasTcls',
      'hasWeGameLauncher',
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
        this.state.setTencentInstallationPath(p.value as string)

        try {
          const tclsPath = path.resolve(p.value as string, 'Launcher', 'Client.exe')
          await fs.promises.access(tclsPath)
          this.state.setHasTcls(true)
        } catch {
          this._log.info('TCLS cannot access, possibly not exists', p.value)
          return
        }

        try {
          const weGamePath = path.resolve(p.value as string, 'WeGameLauncher', 'launcher.exe')
          await fs.promises.access(weGamePath)
          this.state.setHasWeGameLauncher(true)
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
          this.state.setWeGameExecutablePath(match[1])
        }
      }
    } catch (error) {
      this._log.warn(`Failed to read installation directory using registry information`, error)
    }
  }

  private async _getDrives() {
    try {
      const { stdout } = await execAsync('wmic logicaldisk get name')
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

        this.state.setTencentInstallationPath(installation)

        const tcls = path.resolve(installation, 'Launcher', 'Client.exe')
        const weGameLauncher = path.resolve(installation, 'WeGameLauncher', 'launcher.exe')

        try {
          await fs.promises.access(tcls)
          this.state.setHasTcls(true)
          this._log.info('Detected Tencent TCLS installation by file', tcls)
        } catch {}

        try {
          await fs.promises.access(weGameLauncher)
          this.state.setHasWeGameLauncher(true)
          this._log.info('Detected Tencent WeGameLauncher installation by file', weGameLauncher)
        } catch {}

        // 如果都找到了，则直接退出
        if (this.state.hasTcls && this.state.hasWeGameLauncher) {
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

        this.state.setLeagueClientExecutablePaths(result)

        const riotInstallations = Object.values(json.associated_client as Record<string, string>)

        for (const p of riotInstallations) {
          if (await this._maybeOfficialRiotClient(p)) {
            this.state.setOfficialRiotClientExecutablePath(p)
            this._log.info('Detected official RiotClient installation', p)
            break
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
    if (!this.state.tencentInstallationPath) {
      return
    }

    const location = path.resolve(this.state.tencentInstallationPath, 'Launcher', 'Client.exe')
    return execAsync(`"${location}"`, { shell: 'cmd' })
  }

  private _launchWeGameLeagueOfLegends() {
    if (!this.state.tencentInstallationPath) {
      return
    }
    const location = path.resolve(
      this.state.tencentInstallationPath,
      'WeGameLauncher',
      'launcher.exe'
    )
    return execAsync(`"${location}"`, { shell: 'cmd' })
  }

  private _launchWeGame() {
    if (!this.state.weGameExecutablePath) {
      return
    }

    return execAsync(`"${this.state.weGameExecutablePath}"`, { shell: 'cmd' })
  }

  private _launchDefaultRiotClient() {
    if (!this.state.officialRiotClientExecutablePath) {
      return
    }

    return execAsync(
      `"${this.state.officialRiotClientExecutablePath}" --launch-product=league_of_legends --launch-patchline=live`,
      { shell: 'cmd' }
    )
  }

  async onDispose() {
    if (this._liveStreamingTimer) {
      clearInterval(this._liveStreamingTimer)
    }
  }
}
