import { getProcessCommandLineOption } from '@main/native/process-command-line'
import {
  findPidsByNamePosix,
  getCommandLinePosix,
  listProcessesPosix
} from '@main/native/process-utils-darwin'

export interface RiotClientProcessAuth {
  authToken: string
  pid: number
  port: number
}

export type RiotClientProcessAuthReadResult =
  | { status: 'found'; auth: RiotClientProcessAuth }
  | { status: 'not-running' }
  | { status: 'unreadable' }

export interface RiotClientProcessAuthReaderLike {
  read(): Promise<RiotClientProcessAuthReadResult>
}

type ListProcesses = typeof listProcessesPosix
type GetCommandLine = typeof getCommandLinePosix

export function shouldReadRiotClientProcessAuth(platform: NodeJS.Platform = process.platform) {
  return platform === 'darwin'
}

export function getRiotClientProcessName(platform: NodeJS.Platform = process.platform) {
  return platform === 'win32' ? 'RiotClientServices.exe' : 'RiotClientServices'
}

export function parseRiotClientProcessCommandLine(
  commandLine: string,
  pid: number
): RiotClientProcessAuth | null {
  if (!Number.isSafeInteger(pid) || pid <= 0) {
    return null
  }

  const portValue = getProcessCommandLineOption(commandLine, ['app-port', 'riotclient-app-port'])
  const authToken = getProcessCommandLineOption(commandLine, [
    'remoting-auth-token',
    'riotclient-auth-token'
  ])

  if (!portValue || !/^\d+$/.test(portValue) || !authToken) {
    return null
  }

  const port = Number(portValue)
  if (!Number.isSafeInteger(port) || port <= 0 || port > 65_535) {
    return null
  }

  return { authToken, pid, port }
}

export class RiotClientProcessAuthReader implements RiotClientProcessAuthReaderLike {
  constructor(
    private readonly _listProcesses: ListProcesses = listProcessesPosix,
    private readonly _getCommandLine: GetCommandLine = getCommandLinePosix
  ) {}

  async read(): Promise<RiotClientProcessAuthReadResult> {
    // Unlike the generic PID helper, keep a process-list execution failure distinguishable from
    // a confirmed empty list. The controller will retain working credentials on the former.
    const processes = await this._listProcesses()
    const pids = findPidsByNamePosix(processes, getRiotClientProcessName())
    if (!pids.length) {
      return { status: 'not-running' }
    }

    for (const pid of pids) {
      try {
        const auth = parseRiotClientProcessCommandLine(await this._getCommandLine(pid), pid)
        if (auth) {
          return { status: 'found', auth }
        }
      } catch {
        // Processes can exit between the list and command-line reads; try the next candidate.
      }
    }

    // Current macOS Riot builds can launch RiotClientServices without API arguments. While League
    // is running, LeagueClientUx carries the same Riot port/token pair. Keep the confirmed Riot PID
    // as the identity used for rotation, and use the UX process only as the credential source.
    const leagueClientUxPids = findPidsByNamePosix(processes, 'LeagueClientUx')
    for (const leagueClientUxPid of leagueClientUxPids) {
      try {
        const auth = parseRiotClientProcessCommandLine(
          await this._getCommandLine(leagueClientUxPid),
          pids[0]
        )
        if (auth) {
          return { status: 'found', auth }
        }
      } catch {
        // As above, a process can exit between list and command-line inspection.
      }
    }

    return { status: 'unreadable' }
  }
}
