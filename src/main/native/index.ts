import { getuid } from 'node:process'

import { addons } from './addons-win32'
import { NotSupportedPlatformError } from './errors'
import {
  getCommandLinePosix,
  getPidsByNamePosix,
  terminateProcessPosix
} from './process-utils-darwin'
import { getCommandLinePowershell } from './process-utils-win32'

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
      return await getCommandLinePowershell(pid)
    } else {
      return addons.tools.getCommandLine1(pid)
    }
  } else if (process.platform === 'darwin') {
    return await getCommandLinePosix(pid)
  } else {
    throw new NotSupportedPlatformError('getCommandLine', process.platform)
  }
}

/**
 * 判断是否是提权运行
 *
 * @platform win32, darwin
 */
export function isElevated() {
  if (process.platform === 'win32') {
    return addons.tools.isElevated()
  } else if (process.platform === 'darwin') {
    return getuid?.() === 0
  } else {
    throw new NotSupportedPlatformError('isElevated', process.platform)
  }
}

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
