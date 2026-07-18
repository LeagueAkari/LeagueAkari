import { getProcessCommandLineOption } from '@main/native/process-command-line'
import {
  type PosixProcessInfo,
  getCommandLinePosix,
  listProcessesPosix
} from '@main/native/process-utils-darwin'
import { execFile } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const RIOT_CLIENT_PROCESS_NAMES = new Set(['riot client', 'riotclientservices'])
const LEAGUE_CLIENT_PROCESS_NAMES = new Set(['leagueclient', 'leagueclientux', 'leagueoflegends'])

const RIOT_CLIENT_EXECUTABLE_NAMES = new Set(['riot client', 'riotclientservices'])

export interface MacClientInstallationPaths {
  leagueClientExecutablePaths: string[]
  riotClientLaunchPath: string | null
}

export interface RiotClientInstallMetadataCandidates {
  leagueClientCandidates: string[]
  riotClientCandidates: string[]
}

export interface MacInstallationLoaderOptions {
  getCommandLine?: (pid: number) => Promise<string>
  listProcesses?: () => Promise<PosixProcessInfo[]>
  riotClientInstallMetadataPaths?: string[]
  searchRoots?: string[]
}

function normalizeExecutableName(name: string) {
  return name.replace(/\.exe$/i, '').toLowerCase()
}

function uniquePaths(paths: readonly string[]) {
  return Array.from(new Set(paths.map((candidate) => path.normalize(candidate))))
}

function decodeXmlText(value: string) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

export function getMacApplicationBundlePath(
  candidatePath: string,
  preference: 'innermost' | 'outermost' = 'outermost'
) {
  const bundles: string[] = []
  let currentPath = candidatePath.toLowerCase().endsWith('.app')
    ? path.normalize(candidatePath)
    : path.dirname(path.normalize(candidatePath))

  while (true) {
    if (path.basename(currentPath).toLowerCase().endsWith('.app')) {
      bundles.push(currentPath)
    }

    const parentPath = path.dirname(currentPath)
    if (parentPath === currentPath) {
      break
    }
    currentPath = parentPath
  }

  if (!bundles.length) {
    return null
  }

  return preference === 'innermost' ? bundles[0] : bundles[bundles.length - 1]
}

export function buildMacBundleExecutablePath(bundlePath: string, bundleExecutable: string) {
  const contentsPath = path.resolve(bundlePath, 'Contents')
  const executablePath =
    bundleExecutable.includes('/') || bundleExecutable.includes('\\')
      ? path.resolve(contentsPath, bundleExecutable)
      : path.resolve(contentsPath, 'MacOS', bundleExecutable)
  const relativePath = path.relative(contentsPath, executablePath)

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return null
  }

  return executablePath
}

export function inferLeagueClientCandidatesFromPath(candidatePath: string) {
  const candidates = [candidatePath]
  let currentPath = candidatePath.toLowerCase().endsWith('.app')
    ? path.normalize(candidatePath)
    : path.dirname(path.normalize(candidatePath))

  while (true) {
    if (path.basename(currentPath).toLowerCase() === 'lol') {
      candidates.push(path.join(currentPath, 'LeagueClient.app'))
    }

    if (path.basename(currentPath).toLowerCase().endsWith('.app')) {
      candidates.push(path.join(path.dirname(currentPath), 'LeagueClient.app'))
    }

    const parentPath = path.dirname(currentPath)
    if (parentPath === currentPath) {
      break
    }
    currentPath = parentPath
  }

  candidates.push(
    path.join(candidatePath, 'LeagueClient.app'),
    path.join(candidatePath, 'Contents', 'LoL', 'LeagueClient.app')
  )

  return uniquePaths(candidates)
}

export function parseRiotClientInstallMetadata(
  serializedMetadata: string
): RiotClientInstallMetadataCandidates {
  const metadata: unknown = JSON.parse(serializedMetadata)
  if (!metadata || typeof metadata !== 'object') {
    return { leagueClientCandidates: [], riotClientCandidates: [] }
  }

  const record = metadata as Record<string, unknown>
  const associatedClients =
    record.associated_client && typeof record.associated_client === 'object'
      ? (record.associated_client as Record<string, unknown>)
      : {}
  const leagueClientCandidates = Object.keys(associatedClients)
  const riotClientCandidates = [
    ...Object.values(associatedClients),
    record.rc_default,
    record.rc_live,
    ...(record.patchlines && typeof record.patchlines === 'object'
      ? Object.values(record.patchlines as Record<string, unknown>)
      : [])
  ].filter((candidate): candidate is string => typeof candidate === 'string')

  return {
    leagueClientCandidates: uniquePaths(leagueClientCandidates),
    riotClientCandidates: uniquePaths(riotClientCandidates)
  }
}

export class MacInstallationLoader {
  private readonly _getCommandLine: (pid: number) => Promise<string>
  private readonly _listProcesses: () => Promise<PosixProcessInfo[]>
  private readonly _riotClientInstallMetadataPaths: string[]
  private readonly _searchRoots: string[]

  constructor(options: MacInstallationLoaderOptions = {}) {
    this._getCommandLine = options.getCommandLine ?? getCommandLinePosix
    this._listProcesses = options.listProcesses ?? listProcessesPosix
    this._searchRoots =
      options.searchRoots ??
      uniquePaths([
        '/Applications',
        path.join(os.homedir(), 'Applications'),
        '/Users/Shared/Riot Games'
      ])
    this._riotClientInstallMetadataPaths =
      options.riotClientInstallMetadataPaths ??
      uniquePaths([
        '/Users/Shared/Riot Games/RiotClientInstalls.json',
        path.join(
          os.homedir(),
          'Library',
          'Application Support',
          'Riot Games',
          'RiotClientInstalls.json'
        )
      ])
  }

  async load(): Promise<MacClientInstallationPaths> {
    const runningInstallations = await this._loadRunningProcessInstallations()
    const filesystemInstallations = await this._loadFilesystemInstallations()

    return {
      riotClientLaunchPath:
        runningInstallations.riotClientLaunchPath ?? filesystemInstallations.riotClientLaunchPath,
      leagueClientExecutablePaths: uniquePaths([
        ...runningInstallations.leagueClientExecutablePaths,
        ...filesystemInstallations.leagueClientExecutablePaths
      ])
    }
  }

  private async _loadRunningProcessInstallations(): Promise<MacClientInstallationPaths> {
    let processes: PosixProcessInfo[]
    try {
      processes = await this._listProcesses()
    } catch {
      return { leagueClientExecutablePaths: [], riotClientLaunchPath: null }
    }

    const riotProcesses = processes
      .filter((processInfo) =>
        RIOT_CLIENT_PROCESS_NAMES.has(normalizeExecutableName(processInfo.name))
      )
      .sort((left, right) => {
        const leftRank = normalizeExecutableName(left.name) === 'riotclientservices' ? 0 : 1
        const rightRank = normalizeExecutableName(right.name) === 'riotclientservices' ? 0 : 1
        return leftRank - rightRank
      })
    const leagueProcesses = processes
      .filter((processInfo) =>
        LEAGUE_CLIENT_PROCESS_NAMES.has(normalizeExecutableName(processInfo.name))
      )
      .sort((left, right) => {
        const ranks: Record<string, number> = {
          leagueclient: 0,
          leagueclientux: 1,
          leagueoflegends: 2
        }
        return (
          ranks[normalizeExecutableName(left.name)] - ranks[normalizeExecutableName(right.name)]
        )
      })

    let riotClientLaunchPath: string | null = null
    for (const processInfo of riotProcesses) {
      riotClientLaunchPath = await this._resolveRiotClientLaunchPath(processInfo.executablePath)
      if (riotClientLaunchPath) {
        break
      }
    }

    const leagueCandidates: string[] = []
    for (const processInfo of leagueProcesses) {
      leagueCandidates.push(...inferLeagueClientCandidatesFromPath(processInfo.executablePath))

      try {
        const commandLine = await this._getCommandLine(processInfo.pid)
        const installationDirectory = getProcessCommandLineOption(commandLine, [
          'install-directory',
          'install_directory',
          'product-install-path',
          'product_install_full_path'
        ])
        const applicationDirectory = getProcessCommandLineOption(commandLine, [
          'app-directory',
          'app_directory',
          'app-root'
        ])

        if (installationDirectory) {
          leagueCandidates.push(...inferLeagueClientCandidatesFromPath(installationDirectory))
        }
        if (applicationDirectory) {
          leagueCandidates.push(...inferLeagueClientCandidatesFromPath(applicationDirectory))
        }
      } catch {
        // A process can exit between the process-list and command-line reads.
      }
    }

    return {
      riotClientLaunchPath,
      leagueClientExecutablePaths: await this._resolveLeagueClientExecutables(leagueCandidates)
    }
  }

  private async _loadFilesystemInstallations(): Promise<MacClientInstallationPaths> {
    const riotCandidates: string[] = []
    const leagueCandidates: string[] = []

    for (const metadataPath of this._riotClientInstallMetadataPaths) {
      try {
        const metadata = parseRiotClientInstallMetadata(
          await fs.promises.readFile(metadataPath, 'utf-8')
        )
        riotCandidates.push(...metadata.riotClientCandidates)
        leagueCandidates.push(...metadata.leagueClientCandidates)
      } catch {
        // Missing or malformed metadata must not prevent the normal application-root scan.
      }
    }

    for (const searchRoot of this._searchRoots) {
      riotCandidates.push(
        path.join(searchRoot, 'Riot Client.app'),
        path.join(searchRoot, 'Riot Games', 'Riot Client.app')
      )
      leagueCandidates.push(
        path.join(searchRoot, 'League of Legends.app'),
        path.join(searchRoot, 'Riot Games', 'League of Legends.app')
      )
    }

    let riotClientLaunchPath: string | null = null
    for (const candidate of uniquePaths(riotCandidates)) {
      riotClientLaunchPath = await this._resolveRiotClientLaunchPath(candidate)
      if (riotClientLaunchPath) {
        break
      }
    }

    return {
      riotClientLaunchPath,
      leagueClientExecutablePaths: await this._resolveLeagueClientExecutables(leagueCandidates)
    }
  }

  private async _resolveRiotClientLaunchPath(candidatePath: string) {
    const bundlePath = getMacApplicationBundlePath(candidatePath)
    if (bundlePath) {
      const executablePath = await this._resolveBundleExecutable(bundlePath)
      if (
        executablePath &&
        RIOT_CLIENT_EXECUTABLE_NAMES.has(normalizeExecutableName(path.basename(executablePath)))
      ) {
        return bundlePath
      }
    }

    if (
      RIOT_CLIENT_EXECUTABLE_NAMES.has(normalizeExecutableName(path.basename(candidatePath))) &&
      (await this._isExecutableFile(candidatePath))
    ) {
      return path.normalize(candidatePath)
    }

    return null
  }

  private async _resolveLeagueClientExecutables(candidates: readonly string[]) {
    const executables: string[] = []

    for (const candidate of uniquePaths(candidates)) {
      for (const inferredCandidate of inferLeagueClientCandidatesFromPath(candidate)) {
        let executablePath: string | null = null
        if (inferredCandidate.toLowerCase().endsWith('.app')) {
          executablePath = await this._resolveBundleExecutable(inferredCandidate)
        } else if (await this._isExecutableFile(inferredCandidate)) {
          executablePath = inferredCandidate
        }

        if (
          executablePath &&
          normalizeExecutableName(path.basename(executablePath)) === 'leagueclient'
        ) {
          executables.push(path.normalize(executablePath))
          break
        }
      }
    }

    return uniquePaths(executables)
  }

  private async _resolveBundleExecutable(bundlePath: string) {
    try {
      if (!(await fs.promises.stat(bundlePath)).isDirectory()) {
        return null
      }

      const infoPlistPath = path.join(bundlePath, 'Contents', 'Info.plist')
      const plist = await fs.promises.readFile(infoPlistPath)
      let bundleExecutable: string | null = null

      if (!plist.subarray(0, 6).equals(Buffer.from('bplist'))) {
        const match = plist
          .toString('utf-8')
          .match(/<key>\s*CFBundleExecutable\s*<\/key>\s*<string>([\s\S]*?)<\/string>/i)
        bundleExecutable = match ? decodeXmlText(match[1].trim()) : null
      } else if (process.platform === 'darwin') {
        const { stdout } = await execFileAsync(
          '/usr/bin/plutil',
          ['-extract', 'CFBundleExecutable', 'raw', '-o', '-', infoPlistPath],
          { encoding: 'utf-8' }
        )
        bundleExecutable = stdout.trim()
      }

      if (!bundleExecutable) {
        return null
      }

      const executablePath = buildMacBundleExecutablePath(bundlePath, bundleExecutable)
      return executablePath && (await this._isExecutableFile(executablePath))
        ? path.normalize(executablePath)
        : null
    } catch {
      return null
    }
  }

  private async _isExecutableFile(candidatePath: string) {
    try {
      const stats = await fs.promises.stat(candidatePath)
      if (!stats.isFile()) {
        return false
      }
      await fs.promises.access(candidatePath, fs.constants.X_OK)
      return true
    } catch {
      return false
    }
  }
}
