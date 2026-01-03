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

function getCauseLines(err: any, limit = 10): string[] {
  const lines: string[] = []
  const seen = new Set<any>()

  let cur = err?.cause
  while (cur && lines.length < limit) {
    if (seen.has(cur)) {
      lines.push('cause: [circular]')
      break
    }
    seen.add(cur)

    const msg =
      cur instanceof Error
        ? cur.message
        : typeof cur === 'object' && cur !== null && 'message' in cur
          ? String((cur as any).message)
          : String(cur)

    lines.push(`cause: ${msg}`)
    cur = (cur as any)?.cause
  }

  return lines
}

export function formatError(e: any) {
  const causeLines = getCauseLines(e, 10)
  const causeSuffix = causeLines.length ? `\n${causeLines.join('\n')}` : ''

  if (e instanceof AxiosError) {
    return (
      `${e.name}: ${e.message}\n` +
      `[${e.config?.method}] ${e.config?.url} (${e.code} ${e.response?.statusText})\n` +
      `payload: ${stringifyAxiosResponseData(e.config?.data)},\n` +
      `data: ${stringifyAxiosResponseData(e.response?.data)},\n` +
      `stack: ${e.stack}` +
      causeSuffix
    )
  }

  if (e instanceof Error) {
    return `${e.message} ${e.stack}${causeSuffix}`
  }

  if (typeof e === 'object' && e !== null) {
    return `${e.message ?? ''} ${e.stack ?? ''}${causeSuffix}`
  }

  return `${String(e)}${causeSuffix}`
}
