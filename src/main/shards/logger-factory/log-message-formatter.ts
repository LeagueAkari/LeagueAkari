import { formatError } from '@shared/utils/errors'

export class LogMessageFormatter {
  objectsToString(...args: any[]) {
    return args
      .map((arg) => {
        if (arg instanceof Error || this._isLikelyErrorObject(arg)) {
          return formatError(arg)
        }

        if (typeof arg === 'undefined') {
          return 'undefined'
        }

        if (typeof arg === 'function') {
          return arg.toString()
        }

        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2)
          } catch {
            return `[Cannot stringify: ${arg}]`
          }
        }

        return arg
      })
      .join(' ')
  }

  private _isLikelyErrorObject(obj: any) {
    if (!obj || typeof obj !== 'object') {
      return false
    }

    const props = Object.getOwnPropertyNames(obj)

    const hasStack = props.includes('stack') && typeof obj.stack === 'string'
    const hasMessage = props.includes('message') && typeof obj.message === 'string'

    if (hasStack || hasMessage) {
      return true
    }

    return false
  }
}
