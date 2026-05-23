import { formatError } from '@shared/utils/errors'

export class RendererLogMessageFormatter {
  objectsToString(...args: any[]) {
    return args
      .map((arg) => {
        if (arg instanceof Error) {
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
            return arg.toString()
          }
        }

        return arg
      })
      .join(' ')
  }
}
