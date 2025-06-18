import { AxiosError } from 'axios'

export function formatError(e: any) {
  if (e instanceof AxiosError) {
    return `AxiosError: ${e.message} url: ${e.config?.url}, method: ${e.config?.method},\n code: ${e.code},\n data: ${JSON.stringify(e.config?.data)},\n response: ${JSON.stringify(e.response?.data)},\n stack: ${e.stack}`
  }

  if (e instanceof Error) {
    return `${e.message} ${e.stack}`
  }

  if (typeof e === 'object' && e !== null) {
    return `${e.message} ${e.stack}`
  }

  return e
}

export function formatErrorMessage(e: any) {
  if (e instanceof Error) {
    return e.message
  }

  return 'Error'
}
