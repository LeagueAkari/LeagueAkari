import { describe, expect, test } from 'vitest'

import {
  getProcessCommandLineOption,
  parseProcessCommandLineOptions,
  redactClientCommandLine
} from './process-command-line'

describe('process command-line parsing', () => {
  test('preserves spaced macOS argv values until the next long option', () => {
    const commandLine =
      '/Applications/League of Legends.app/Contents/MacOS/LeagueClientUx ' +
      '--app-port=54321 --install-directory=/Applications/League of Legends.app/Contents/LoL ' +
      '--app-directory="/Applications/League of Legends.app/Contents/LoL/League of Legends.app"'

    expect(getProcessCommandLineOption(commandLine, 'app-port')).toBe('54321')
    expect(getProcessCommandLineOption(commandLine, 'install-directory')).toBe(
      '/Applications/League of Legends.app/Contents/LoL'
    )
    expect(getProcessCommandLineOption(commandLine, 'app-directory')).toBe(
      '/Applications/League of Legends.app/Contents/LoL/League of Legends.app'
    )
  })

  test('supports options separated from values by whitespace', () => {
    const options = parseProcessCommandLineOptions(
      'LeagueClientUx --app-port 54321 --region "EUW" --feature-flag'
    )

    expect(options.map(({ name, value }) => ({ name, value }))).toEqual([
      { name: 'app-port', value: '54321' },
      { name: 'region', value: 'EUW' },
      { name: 'feature-flag', value: null }
    ])
  })

  test('redacts LCU and Riot credentials while retaining diagnostic options', () => {
    const commandLine =
      'LeagueClientUx --app-port=54321 --remoting-auth-token=synthetic-lcu-secret ' +
      '--riotclient-auth-token "synthetic-riot-secret" ' +
      '--endpoint=https://riot:synthetic-url-secret@127.0.0.1:54321'

    const redacted = redactClientCommandLine(commandLine)

    expect(redacted).not.toContain('synthetic-lcu-secret')
    expect(redacted).not.toContain('synthetic-riot-secret')
    expect(redacted).not.toContain('synthetic-url-secret')
    expect(redacted).toContain('--app-port=54321')
    expect(redacted.match(/<redacted>/g)).toHaveLength(3)
  })
})
