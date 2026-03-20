import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export async function getPidsByNamePosix(processName: string) {
  const names = new Set([processName, processName.replace(/\.exe$/i, '')].filter(Boolean))
  try {
    const out = await execFileAsync('ps', ['-ax', '-o', 'pid=,comm='], { encoding: 'utf-8' })
    const pids: number[] = []
    for (const raw of out.stdout.split('\n')) {
      const line = raw.trim()
      if (!line) continue
      const m = line.match(/^(\d+)\s+(.+)$/)
      if (!m) continue
      const pid = Number(m[1])
      const comm = (m[2].split('/').pop() || m[2]).trim()
      if (names.has(comm)) {
        pids.push(pid)
      }
    }
    return Array.from(new Set(pids))
  } catch {
    return []
  }
}

export async function getCommandLinePosix(pid: number) {
  return (
    await execFileAsync('ps', ['-p', String(pid), '-o', 'command=', '-ww'], { encoding: 'utf-8' })
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
