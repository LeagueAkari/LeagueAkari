import { AxiosError } from 'axios'
import { stringify } from 'safe-stable-stringify'

const isNode =
  typeof process !== 'undefined' && process.versions != null && process.versions.node != null

function stringifyAxiosResponseData(input: any, maxLen = 2000): string {
  try {
    if (input == null) return String(input)

    if (isNode) {
      if (Buffer.isBuffer(input)) {
        return `[Buffer length=${input.length}]`
      }
      if (typeof input.pipe === 'function') {
        return `[Stream type=${input.constructor?.name || 'Unknown'}]`
      }
    } else {
      if (typeof Blob !== 'undefined' && input instanceof Blob) {
        return `[Blob size=${input.size}, type=${input.type}]`
      }
      if (typeof File !== 'undefined' && input instanceof File) {
        return `[File name=${input.name}, size=${input.size}, type=${input.type}]`
      }
      if (typeof FormData !== 'undefined' && input instanceof FormData) {
        // @ts-ignore
        return `[FormData entries=${Array.from(input.keys()).length}]`
      }
    }

    if (typeof input === 'string') {
      return input.length > maxLen
        ? input.slice(0, maxLen) + `... [truncated len=${input.length}]`
        : input
    }

    const str = stringify(input)
    return str && str.length > maxLen
      ? str.slice(0, maxLen) + `... [truncated len=${str.length}]`
      : str || '[empty]'
  } catch {
    return `[unserializable type=${typeof input}]`
  }
}

export function formatError(e: any) {
  if (e instanceof AxiosError) {
    return `${e.name}: ${e.message}
[${e.config?.method}] ${e.config?.url} (${e.code} ${e.response?.statusText})
payload: ${stringifyAxiosResponseData(e.config?.data)},
data: ${stringifyAxiosResponseData(e.response?.data)},
stack: ${e.stack}`
  }

  if (e instanceof Error) {
    return `${e.message} ${e.stack}`
  }

  if (typeof e === 'object' && e !== null) {
    return `${e.message ?? ''} ${e.stack ?? ''}`
  }

  return String(e)
}

export function formatErrorMessage(e: any) {
  if (e instanceof Error) {
    return e.message
  }

  return 'Error'
}
