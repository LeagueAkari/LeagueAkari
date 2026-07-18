import { redactSecretsInString } from '@shared/utils/redact-secrets'

export interface ProcessCommandLineOption {
  name: string
  value: string | null
  start: number
  end: number
  valueStart: number | null
  valueEnd: number | null
}

const OPTION_START_REGEX = /(^|\s)(--[A-Za-z0-9][A-Za-z0-9_-]*)(?==|\s|$)/g

function stripMatchingQuotes(value: string) {
  if (value.length < 2) {
    return value
  }

  const first = value[0]
  const last = value[value.length - 1]
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return value.slice(1, -1)
  }

  return value
}

/**
 * Parses long command-line options from the process text returned by `ps` or WMI.
 *
 * macOS `ps` does not re-quote argv values. Consequently a path such as
 * `--install-directory=/Applications/League of Legends.app` must be read until the next option,
 * rather than until the next space.
 */
export function parseProcessCommandLineOptions(commandLine: string): ProcessCommandLineOption[] {
  const matches = Array.from(commandLine.matchAll(OPTION_START_REGEX))

  return matches.map((match, index) => {
    const leadingWhitespaceLength = match[1].length
    const start = (match.index ?? 0) + leadingWhitespaceLength
    const name = match[2].slice(2).toLowerCase()
    const optionNameEnd = start + match[2].length
    const nextOptionStart =
      index + 1 < matches.length
        ? (matches[index + 1].index ?? commandLine.length) + matches[index + 1][1].length
        : commandLine.length

    let valueStart = optionNameEnd
    if (commandLine[valueStart] === '=') {
      valueStart += 1
    } else {
      while (valueStart < nextOptionStart && /\s/.test(commandLine[valueStart])) {
        valueStart += 1
      }
    }

    let valueEnd = nextOptionStart
    while (valueEnd > valueStart && /\s/.test(commandLine[valueEnd - 1])) {
      valueEnd -= 1
    }

    const hasValue = valueStart < valueEnd

    return {
      name,
      value: hasValue ? stripMatchingQuotes(commandLine.slice(valueStart, valueEnd)) : null,
      start,
      end: valueEnd,
      valueStart: hasValue ? valueStart : null,
      valueEnd: hasValue ? valueEnd : null
    }
  })
}

export function getProcessCommandLineOption(
  commandLine: string,
  optionNames: string | readonly string[]
) {
  const names = new Set(
    (typeof optionNames === 'string' ? [optionNames] : optionNames).map((name) =>
      name.replace(/^--/, '').toLowerCase()
    )
  )

  return parseProcessCommandLineOptions(commandLine).find((option) => names.has(option.name))?.value
}

/**
 * Removes local-client credentials without changing the rest of the command enough to make a log
 * or diagnostic useless. The return value is safe to log; the input is not.
 */
export function redactClientCommandLine(commandLine: string) {
  return redactSecretsInString(commandLine)
}
