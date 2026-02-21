import { execFileSync } from 'node:child_process'
import { EventEmitter } from 'node:events'

type NativeAddons = typeof import('@leagueakari/league-akari-addons')

function tryLoadNativeAddons(): NativeAddons | null {
  try {
    // Note: older versions of @leagueakari/league-akari-addons only ship win64 .node.
    // We still try to load it on every platform to allow future multi-platform builds,
    // and rely on try/catch to prevent startup crashes on unsupported platforms.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('@leagueakari/league-akari-addons') as NativeAddons
  } catch {
    return null
  }
}

const native = tryLoadNativeAddons()
const nativeTools: any = native?.tools
const nativeInput: any = native?.input

export const capabilities = {
  nativeLoaded: Boolean(native),
  tools: {
    nativeLoaded: Boolean(nativeTools),
    foregroundSupported: typeof nativeTools?.isProcessForeground === 'function',
    windowPlacementSupported: typeof nativeTools?.getLeagueClientWindowPlacementInfo === 'function',
    fixWindowMethodASupported: typeof nativeTools?.fixWindowMethodA === 'function'
  },
  input: {
    nativeLoaded: Boolean(nativeInput),
    hookSupported:
      typeof nativeInput?.instance?.install === 'function' &&
      typeof nativeInput?.instance?.on === 'function' &&
      typeof nativeInput?.instance?.uninstall === 'function',
    injectSupported:
      typeof nativeInput?.instance?.sendKey === 'function' &&
      (typeof nativeInput?.instance?.sendString === 'function' ||
        typeof nativeInput?.instance?.sendText === 'function')
  }
}

function uniq(nums: number[]) {
  return Array.from(new Set(nums))
}

function getPidsByNamePosix(processName: string): number[] {
  const names = new Set([processName, processName.replace(/\.exe$/i, '')].filter(Boolean))
  try {
    const out = execFileSync('ps', ['-ax', '-o', 'pid=,comm='], { encoding: 'utf-8' })
    const pids: number[] = []
    for (const raw of out.split('\n')) {
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
    return uniq(pids)
  } catch {
    return []
  }
}

function getCommandLine1Posix(pid: number): string {
  const out = execFileSync('ps', ['-p', String(pid), '-o', 'command=', '-ww'], { encoding: 'utf-8' })
  return out.trim()
}

export const tools = {
  isElevated(): boolean {
    if (nativeTools?.isElevated) return Boolean(nativeTools.isElevated())
    // Best-effort on POSIX
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getuid = (process as any).getuid
    return typeof getuid === 'function' ? getuid() === 0 : false
  },

  getPidsByName(processName: string): number[] {
    if (nativeTools?.getPidsByName) return nativeTools.getPidsByName(processName)
    return getPidsByNamePosix(processName)
  },

  isProcessRunning(pid: number): boolean {
    if (nativeTools?.isProcessRunning) return Boolean(nativeTools.isProcessRunning(pid))
    try {
      process.kill(pid, 0)
      return true
    } catch {
      return false
    }
  },

  isProcessForeground(pid: number): boolean {
    if (nativeTools?.isProcessForeground) return Boolean(nativeTools.isProcessForeground(pid))
    // Not implemented cross-platform; keep features that depend on this disabled.
    return false
  },

  terminateProcess(pid: number): void {
    if (nativeTools?.terminateProcess) return nativeTools.terminateProcess(pid)
    try {
      process.kill(pid, 'SIGTERM')
    } catch {
      // ignore
    }
  },

  getCommandLine1(pid: number): string {
    if (nativeTools?.getCommandLine1) return nativeTools.getCommandLine1(pid)
    return getCommandLine1Posix(pid)
  },

  getLeagueClientWindowPlacementInfo(): any {
    if (nativeTools?.getLeagueClientWindowPlacementInfo) {
      return nativeTools.getLeagueClientWindowPlacementInfo()
    }
    return null
  },

  fixWindowMethodA(zoom: number, config?: { baseHeight: number; baseWidth: number }): void {
    if (nativeTools?.fixWindowMethodA) return nativeTools.fixWindowMethodA(zoom, config)
  }
}

class NoopNativeInput extends EventEmitter {
  installed = false

  get isInstalled() {
    return this.installed
  }

  install() {
    this.installed = true
  }

  uninstall() {
    this.installed = false
  }

  getKeyStates() {
    return {}
  }

  async sendKey(_key: number, _press: boolean) {
    return
  }

  async sendString(_str: string) {
    return
  }
}

let inputDefinitions: any = null
try {
  // This file is pure JS and does not load the native .node
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  inputDefinitions = require('@leagueakari/league-akari-addons/dist/input/definitions')
} catch {
  inputDefinitions = null
}

export const input = nativeInput || {
  ...(inputDefinitions || {}),
  instance: new NoopNativeInput()
}

export namespace input {
  export type KeyEvent = {
    keyCode: number
    keyId: string
    name?: string
    standardName?: string
    isModifier: boolean
    isCommonModifier: boolean
    isDown: boolean
  }
}
