import { z } from 'zod'

export interface ResponseParseIssue {
  path: string
  message: string
  received: string | null
}

export interface ResponseParseResult<T> {
  data: T
  issues: ResponseParseIssue[]
}

interface ParseScope {
  issues: ResponseParseIssue[]
  path: string
}

/** Schema helpers are shared; diagnostics belong to one synchronous parse call. */
export class ResponseParser {
  private _scope: ParseScope | null = null

  parse<T>(parse: () => T): ResponseParseResult<T> {
    const parent = this._scope
    const scope: ParseScope = { issues: [], path: '' }
    this._scope = scope

    try {
      return { data: parse(), issues: scope.issues }
    } finally {
      this._scope = parent
    }
  }

  issue(path: string, message: string, input?: unknown) {
    const scope = this._scope!
    scope.issues.push({
      path: scope.path ? `${scope.path}.${path}` : path,
      message,
      received:
        typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean'
          ? String(input).slice(0, 80)
          : null
    })
  }

  recover<T extends z.ZodType>(schema: T, fallback: z.output<T>, path: string) {
    return schema.catch((context) => {
      for (const rawIssue of context.issues) {
        const issue = z.core.util.finalizeIssue(rawIssue, undefined, z.config())
        const suffix = issue.path.map(String).join('.')
        this.issue(suffix ? `${path}.${suffix}` : path, issue.message, context.value)
      }

      return fallback !== null && typeof fallback === 'object'
        ? structuredClone(fallback)
        : fallback
    })
  }

  convert<T extends z.ZodType>(
    schema: T,
    convert: (input: unknown) => unknown,
    fallback: z.output<T>,
    path: string
  ) {
    return z.preprocess((input) => {
      const result = schema.safeParse(convert(input))
      if (result.success) return result.data

      for (const issue of result.error.issues) {
        this.issue(path, issue.message, input)
      }

      return fallback
    }, schema)
  }

  object<T extends z.ZodRawShape>(shape: T, path: string) {
    return z.preprocess((input) => {
      if (typeof input !== 'object' || input === null || Array.isArray(input)) {
        this.issue(path, 'Expected an object; using field defaults')
        return {}
      }

      return input
    }, z.object(shape))
  }

  array<T extends z.ZodType>(item: T, path: string) {
    const entries = this.recover(z.array(z.unknown()), [], path)

    return z
      .unknown()
      .transform((input): z.output<T>[] => {
        const scope = this._scope!
        const parent = scope.path
        const values: z.output<T>[] = []

        for (const [index, entry] of entries.parse(input).entries()) {
          scope.path = parent ? `${parent}.${path}.${index}` : `${path}.${index}`
          try {
            const result = item.safeParse(entry)
            if (result.success) {
              values.push(result.data)
            } else {
              for (const issue of result.error.issues) {
                this.issue(issue.path.map(String).join('.') || 'record', issue.message)
              }
            }
          } finally {
            scope.path = parent
          }
        }

        return values
      })
      .prefault(null)
  }

  /** Return null for an unusable resource envelope. */
  nullable<T extends z.ZodType>(schema: T, input: unknown): z.output<T> | null {
    const result = schema.safeParse(input)
    if (result.success) return result.data

    for (const issue of result.error.issues) {
      this.issue(issue.path.map(String).join('.') || 'root', issue.message)
    }

    return null
  }
}
