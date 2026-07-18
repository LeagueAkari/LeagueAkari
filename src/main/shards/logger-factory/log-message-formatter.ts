import { formatError } from '@shared/utils/errors'
import {
  createSecretRedactingJsonReplacer,
  redactSecretsInString
} from '@shared/utils/redact-secrets'

export class LogMessageFormatter {
  objectsToString(...args: any[]) {
    return args
      .map((arg) => {
        if (arg instanceof Error || this._isLikelyErrorObject(arg)) {
          return redactSecretsInString(formatError(arg))
        }

        if (typeof arg === 'undefined') {
          return 'undefined'
        }

        if (typeof arg === 'function') {
          return redactSecretsInString(arg.toString())
        }

        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, createSecretRedactingJsonReplacer(), 2)
          } catch {
            return `[Cannot stringify: ${arg}]`
          }
        }

        return typeof arg === 'string' ? redactSecretsInString(arg) : arg
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
