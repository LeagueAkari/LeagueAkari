import { isAxiosError } from 'axios'

import { AkariIpcError, type IpcMainDataType } from './types'

/**
 * 处理一般错误和 axios 错误, 包含特例, 对业务错误网开一面
 * @param error
 * @returns
 */
export function toIpcErrorResponse(error: any): IpcMainDataType {
  if (isAxiosError(error)) {
    const errorWithResponse = {
      response: error.response
        ? {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          }
        : null,
      code: error.code,
      message: error.message,
      stack: error.stack,
      name: error.name
    }

    return {
      success: false,
      isAxiosError: true,
      error: errorWithResponse
    }
  } else if (error instanceof AkariIpcError) {
    return {
      success: false,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      }
    }
  } else if (error instanceof Error) {
    return {
      success: false,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    }
  }

  return {
    success: false,
    error: { message: 'An error occurred' }
  }
}
