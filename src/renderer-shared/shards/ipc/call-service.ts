import { formatError } from '@shared/utils/errors'

import type { LoggerRenderer } from '../logger'
import { type AkariIpcRendererContext, LOGGER_SHARD_NAMESPACE } from './context'
import type { IpcMainDataType } from './types'

export class AkariIpcRendererCallService {
  constructor(private readonly _context: AkariIpcRendererContext) {}

  async call<T = any>(namespace: string, fnName: string, ...args: any[]) {
    const result: IpcMainDataType<T> = await window.electron.ipcRenderer.invoke(
      'akariCall',
      namespace,
      fnName,
      ...args
    )

    if (result.success) {
      return result.data as T
    }

    // axios 错误将不会触发特殊日志
    if (result.isAxiosError) {
      throw result.error
    }

    if (import.meta.env.DEV) {
      // for lazy loading
      const logger = this._context.shared.manager.getInstance(
        LOGGER_SHARD_NAMESPACE
      ) as LoggerRenderer
      logger?.warn(`ipc call: ${namespace}`, fnName, args, formatError(result.error))
    }

    throw result.error
  }
}
