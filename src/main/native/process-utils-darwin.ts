import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export interface PosixProcessInfo {
  pid: number
  executablePath: string
  name: string
}

export function parsePosixProcessList(stdout: string): PosixProcessInfo[] {
  const processes: PosixProcessInfo[] = []

  for (const rawLine of stdout.split(/\r?\n/)) {
    const match = rawLine.match(/^\s*(\d+)\s+(.+?)\s*$/)
    if (!match) {
      continue
    }

    const pid = Number(match[1])
    if (!Number.isSafeInteger(pid) || pid <= 0) {
      continue
    }

    const executablePath = match[2]
    processes.push({
      pid,
      executablePath,
      name: path.basename(executablePath)
    })
  }

  return processes
}

function normalizeProcessName(processName: string) {
  return processName.replace(/\.exe$/i, '').toLowerCase()
}

export function findPidsByNamePosix(processes: readonly PosixProcessInfo[], processName: string) {
  const normalizedName = normalizeProcessName(path.basename(processName))

  return Array.from(
    new Set(
      processes
        .filter((processInfo) => normalizeProcessName(processInfo.name) === normalizedName)
        .map((processInfo) => processInfo.pid)
    )
  )
}

export async function listProcessesPosix() {
  const { stdout } = await execFileAsync('ps', ['-ax', '-o', 'pid=,comm='], {
    encoding: 'utf-8',
    maxBuffer: 4 * 1024 * 1024
  })

  return parsePosixProcessList(stdout)
}

export async function getPidsByNamePosix(processName: string) {
  try {
    return findPidsByNamePosix(await listProcessesPosix(), processName)
  } catch {
    return []
  }
}

export async function getCommandLinePosix(pid: number) {
  if (!Number.isSafeInteger(pid) || pid <= 0) {
    throw new TypeError(`Invalid process id: ${pid}`)
  }

  return (
    await execFileAsync('ps', ['-p', String(pid), '-o', 'command=', '-ww'], {
      encoding: 'utf-8',
      maxBuffer: 1024 * 1024
    })
  ).stdout.trim()
}

export function isProcessRunningPosix(pid: number) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

export function terminateProcessPosix(pid: number) {
  try {
    process.kill(pid, 'SIGTERM')

    return true
  } catch {
    return false
  }
}
