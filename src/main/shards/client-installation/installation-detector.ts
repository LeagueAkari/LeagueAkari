import RES_POSITIONER from '@resources/AKARI?asset&asarUnpack'
import cp from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import util from 'node:util'

import {
  type ClientInstallationMainContext,
  TENCENT_INSTALL_DIRNAME,
  TENCENT_LOL_DIRNAME,
  TENCENT_REG_INSTALL_PATH,
  TENCENT_REG_INSTALL_VALUE,
  WEGAME_DEFAULTICON_PATH
} from './context'
import { shouldScanMacInstallations, shouldScanTencentInstallations } from './platform'

const execAsync = util.promisify(cp.exec)

// regedit only works on Windows (depends on cscript/VBS). Avoid loading it on macOS/Linux.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const regedit: any | null = shouldScanTencentInstallations() ? require('regedit') : null

if (regedit) {
  regedit.setExternalVBSLocation(path.resolve(RES_POSITIONER, '..', 'regedit-vbs'))
}

export class ClientInstallationDetector {
  constructor(private readonly _context: ClientInstallationMainContext) {}

  async runPlatformDetection() {
    if (shouldScanMacInstallations()) {
      await this.updateMacInstallationsByFile()
      return
    }

    if (!shouldScanTencentInstallations()) {
      this._context.logger.info('Skip client installation detection on unsupported platform', {
        platform: process.platform
      })
      return
    }

    void this.updateTencentPathsByReg()
    void this.updateTencentPathsByFile()
    void this.updateLeagueClientInstallationByFile()
  }

  /**
   * 通过注册表来找寻位置
   */
  async updateTencentPathsByReg() {
    if (!regedit) {
      return
    }

    const { state, logger } = this._context

    try {
      const list: string[] = []

      if (!state.tencentInstallationPath) {
        list.push(TENCENT_REG_INSTALL_PATH)
      }

      if (!state.weGameExecutablePath) {
        list.push(WEGAME_DEFAULTICON_PATH)
      }

      const result = await regedit.promisified.list(list)

      const item1 = result[TENCENT_REG_INSTALL_PATH]
      const item2 = result[WEGAME_DEFAULTICON_PATH]

      if (item1 && item1.exists) {
        const p = item1.values[TENCENT_REG_INSTALL_VALUE]

        if (!p) {
          return
        }

        try {
          await fs.promises.access(p.value as string)
        } catch {
          logger.info(
            'Registry detected Tencent League of Legends installation but cannot access, possibly not exists',
            p.value
          )
          return
        }

        logger.info('Registry detected Tencent League of Legends installation', p.value)
        state.setTencentInstallationPath(path.normalize(p.value as string))

        try {
          const tclsPath = path.resolve(p.value as string, 'Launcher', 'Client.exe')
          await fs.promises.access(tclsPath)
          state.setTclsExecutablePath(path.normalize(tclsPath))
        } catch {
          logger.info('TCLS cannot access, possibly not exists', p.value)
          return
        }

        try {
          const weGamePath = path.resolve(p.value as string, 'WeGameLauncher', 'launcher.exe')
          await fs.promises.access(weGamePath)
          state.setWeGameLauncherExecutablePath(path.normalize(weGamePath))
        } catch {
          logger.info('WeGame launcher cannot access, possibly not exists', p.value)
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
            logger.info(
              'Registry detected WeGame installation but cannot access, possibly not exists',
              match[1]
            )
            return
          }

          logger.info('Registry detected WeGame installation', match[1])
          state.setWeGameExecutablePath(path.normalize(match[1]))
        }
      }
    } catch (error) {
      logger.warn(`Failed to read installation directory using registry information`, error)
    }
  }

  private async _getDrives() {
    if (!shouldScanTencentInstallations()) {
      return []
    }

    try {
      const { stdout } = await execAsync(
        'powershell -Command "Get-CimInstance -ClassName Win32_LogicalDisk | Where-Object {$_.DriveType -eq 3} | Select-Object -ExpandProperty DeviceID"'
      )
      return stdout
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => /^[A-Z]:$/.test(line))
    } catch (error) {
      this._context.logger.warn('Failed to get logical drives', error)
      return []
    }
  }

  /**
   * 通过扫盘来更新腾讯服安装位置
   */
  async updateTencentPathsByFile() {
    if (!shouldScanTencentInstallations()) {
      return
    }

    const { state, logger } = this._context

    if (state.tencentInstallationPath) {
      return
    }

    const drives = await this._getDrives()

    logger.info('Current logical drives', drives)

    for (const drive of drives) {
      const installation = path.join(drive, TENCENT_INSTALL_DIRNAME, TENCENT_LOL_DIRNAME)

      try {
        await fs.promises.access(installation)

        logger.info('Detected Tencent League of Legends installation by file', installation)

        state.setTencentInstallationPath(path.normalize(installation))

        const tcls = path.resolve(installation, 'Launcher', 'Client.exe')
        const weGameLauncher = path.resolve(installation, 'WeGameLauncher', 'launcher.exe')

        try {
          await fs.promises.access(tcls)
          state.setTclsExecutablePath(path.normalize(tcls))
          logger.info('Detected Tencent TCLS installation by file', tcls)
        } catch {}

        try {
          await fs.promises.access(weGameLauncher)
          state.setWeGameLauncherExecutablePath(path.normalize(weGameLauncher))
          logger.info('Detected Tencent WeGameLauncher installation by file', weGameLauncher)
        } catch {}

        // 如果都找到了，则直接退出
        if (state.tclsExecutablePath && state.weGameLauncherExecutablePath) {
          return
        }
      } catch {
        continue
      }
    }
  }

  private async _maybeOfficialRiotClient(p: string) {
    return p.includes('Riot Games') && !p.includes('英雄联盟')
  }

  async updateLeagueClientInstallationByFile() {
    if (!shouldScanTencentInstallations()) {
      return
    }

    const { state, logger } = this._context

    if (!process.env['ProgramData']) {
      logger.warn(
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
          } catch {
            logger.info(
              'Detected LeagueClient installation but cannot access, possibly not exists',
              installation
            )
          }
        }

        state.setLeagueClientExecutablePaths(result.map((p) => path.normalize(p)))

        const riotInstallations = Object.values(json.associated_client as Record<string, string>)

        for (const p of riotInstallations) {
          if (await this._maybeOfficialRiotClient(p)) {
            try {
              await fs.promises.access(p)
              state.setOfficialRiotClientExecutablePath(path.normalize(p))
              logger.info('Detected official RiotClient installation', p)
              break
            } catch {
              logger.info(
                'Detected RiotClient installation but cannot access, possibly not exists',
                p
              )
              continue
            }
          }
        }
      }
    } catch (error) {
      logger.warn('Failed to read LeagueClient installation', error)
    }
  }

  async updateMacInstallationsByFile() {
    if (!shouldScanMacInstallations()) {
      return
    }

    const { state, logger } = this._context

    const riotClientCandidates = [
      '/Applications/Riot Client.app',
      '/Users/Shared/Riot Games/Riot Client/Riot Client.app',
      '/Applications/Riot Client.app/Contents/MacOS/Riot Client',
      '/Users/Shared/Riot Games/Riot Client/Riot Client.app/Contents/MacOS/Riot Client'
    ]

    for (const p of riotClientCandidates) {
      try {
        await fs.promises.access(p)
        state.setOfficialRiotClientExecutablePath(p)
        logger.info('Detected RiotClient installation on macOS', p)
        break
      } catch {}
    }

    const leagueCandidates = [
      '/Applications/League of Legends.app/Contents/LoL/LeagueClient.app/Contents/MacOS/LeagueClient',
      '/Applications/League of Legends.app/Contents/MacOS/LeagueofLegends',
      '/Users/Shared/Riot Games/League of Legends.app/Contents/LoL/LeagueClient.app/Contents/MacOS/LeagueClient',
      '/Users/Shared/Riot Games/League of Legends.app/Contents/MacOS/LeagueofLegends'
    ]

    const detectedLeagueClients: string[] = []
    for (const p of leagueCandidates) {
      try {
        await fs.promises.access(p)
        detectedLeagueClients.push(p)
      } catch {}
    }

    if (detectedLeagueClients.length) {
      logger.info('Detected LeagueClient installations on macOS', detectedLeagueClients)
    }

    state.setLeagueClientExecutablePaths(detectedLeagueClients)
  }
}
