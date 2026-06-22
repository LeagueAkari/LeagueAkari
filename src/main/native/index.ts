import { NativeSupport } from '@shared/types/common'
import { getuid } from 'node:process'

import { addons } from './addons-win32'
import { NotSupportedPlatformError } from './errors'
import {
  getCommandLinePosix,
  getPidsByNamePosix,
  isProcessRunningPosix,
  terminateProcessPosix
} from './process-utils-darwin'
import { getCommandLinePowershell } from './process-utils-win32'

export type { KeyEvent as NativeInputKeyEvent } from 'league-akari-native-win32/input'

/**
 * 通过进程名搜索匹配的 pid 列表
 *
 * @platform win32, darwin
 */
export async function getPidsByName(processName: string) {
  if (process.platform === 'win32') {
    return addons.tools.getPidsByName(processName)
  } else if (process.platform === 'darwin') {
    return await getPidsByNamePosix(processName)
  } else {
    throw new NotSupportedPlatformError('getPidsByName', process.platform)
  }
}

/**
 *
 * 获取进程的命令行
 *
 * @param options 查询方式，仅 win32 平台生效，使用 native / shell 查询。注意，shell 方式需要应用以提权权限运行
 * @platform win32, darwin
 */
export async function getCommandLine(
  pid: number,
  options?: { win32QueryType?: 'shell' | 'native' }
) {
  if (process.platform === 'win32') {
    const { win32QueryType = 'native' } = options ?? {}

    if (win32QueryType === 'native') {
      return addons.tools.getCommandLine1(pid)
    } else {
      return await getCommandLinePowershell(pid)
    }
  } else if (process.platform === 'darwin') {
    return await getCommandLinePosix(pid)
  } else {
    throw new NotSupportedPlatformError('getCommandLine', process.platform)
  }
}

function _isElevated() {
  if (process.platform === 'win32') {
    return addons.tools.isElevated()
  } else if (process.platform === 'darwin') {
    return getuid?.() === 0
  } else {
    throw new NotSupportedPlatformError('isElevated', process.platform)
  }
}

/**
 * 判断是否是提权运行
 *
 * @platform win32, darwin
 */
export const isElevated = _isElevated()

/**
 * 判断进程是否在前台运行
 *
 * @platform win32
 */
export function isProcessForeground(pid: number) {
  if (process.platform === 'win32') {
    return addons.tools.isProcessForeground(pid)
  } else {
    throw new NotSupportedPlatformError('isProcessForeground', process.platform)
  }
}

/**
 * 终止进程
 *
 * @platform win32, darwin
 */
export function terminateProcess(pid: number) {
  if (process.platform === 'win32') {
    return addons.tools.terminateProcess(pid)
  } else if (process.platform === 'darwin') {
    return terminateProcessPosix(pid)
  } else {
    throw new NotSupportedPlatformError('terminateProcess', process.platform)
  }
}

export function isProcessRunning(pid: number) {
  if (process.platform === 'win32') {
    return addons.tools.isProcessRunning(pid)
  } else if (process.platform === 'darwin') {
    return isProcessRunningPosix(pid)
  } else {
    throw new NotSupportedPlatformError('isProcessRunning', process.platform)
  }
}

export function adjustLeagueClientWindowSize(
  clientZoom: number,
  config?: { baseHeight: number; baseWidth: number }
) {
  if (process.platform === 'win32') {
    return addons.tools.fixWindowMethodA(clientZoom, config ?? {})
  } else {
    throw new NotSupportedPlatformError('adjustLeagueClient', process.platform)
  }
}

export function getLeagueClientWindowPlacement() {
  if (process.platform === 'win32') {
    return addons.tools.getLeagueClientWindowPlacementInfo()
  } else {
    throw new NotSupportedPlatformError('getLeagueClientWindowPlacement', process.platform)
  }
}

/**
 * 仅限 Windows 平台可用的原生注入，若非 Windows 平台，为 undefined
 *
 * @platform win32
 */
export const nativeInput = addons?.input

export const NATIVE_SUPPORT: NativeSupport = {
  nativeInput: {
    available: Boolean(nativeInput?.instance.isInstalled) && isElevated,
    availableOnCurrentPlatform: Boolean(nativeInput),
    requiresElevation: true
  },
  getLeagueClientWindowPlacement: {
    available: process.platform === 'win32',
    availableOnCurrentPlatform: process.platform === 'win32',
    requiresElevation: false
  },
  adjustLeagueClientWindowSize: {
    available: process.platform === 'win32' && isElevated,
    availableOnCurrentPlatform: process.platform === 'win32',
    requiresElevation: true
  },
  isProcessForeground: {
    available: process.platform === 'win32' && isElevated,
    availableOnCurrentPlatform: process.platform === 'win32',
    requiresElevation: true
  }
}
