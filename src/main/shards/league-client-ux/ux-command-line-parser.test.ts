import { describe, expect, test } from 'vitest'

import { parseCommandLine, parseUxCommandLinePaths } from './ux-command-line-parser'

describe('League Client UX command-line parsing', () => {
  test('parses connection values and macOS directories from a spaced command line', () => {
    const commandLine =
      '/Applications/League of Legends.app/Contents/LoL/League of Legends.app/Contents/MacOS/LeagueClientUx ' +
      '--app-port 54321 --remoting-auth-token="synthetic.lcu_token-1" --app-pid=4242 ' +
      '--rso_platform_id=EUW1 --region=euw --riotclient-app-port=61234 ' +
      '--riotclient-auth-token=synthetic-riot_token.2 ' +
      '--install-directory=/Applications/League of Legends.app/Contents/LoL ' +
      '--app-directory="/Applications/League of Legends.app/Contents/LoL/League of Legends.app"'

    expect(parseCommandLine(commandLine)).toMatchObject({
      port: 54321,
      pid: 4242,
      authToken: 'synthetic.lcu_token-1',
      rsoPlatformId: 'EUW1',
      region: 'euw',
      riotClientPort: 61234,
      riotClientAuthToken: 'synthetic-riot_token.2'
    })
    expect(parseUxCommandLinePaths(commandLine)).toEqual({
      installationDirectory: '/Applications/League of Legends.app/Contents/LoL',
      applicationDirectory: '/Applications/League of Legends.app/Contents/LoL/League of Legends.app'
    })
  })

  test('accepts the hyphenated RSO platform option', () => {
    expect(
      parseCommandLine(
        'LeagueClientUx --app-port=12345 --remoting-auth-token=synthetic-token ' +
          '--app-pid=123 --rso-platform-id=NA1'
      )
    ).toMatchObject({ rsoPlatformId: 'NA1' })
  })

  test('rejects a command line missing any required LCU connection value', () => {
    expect(parseCommandLine('LeagueClientUx --app-port=12345 --app-pid=123')).toBeNull()
    expect(
      parseCommandLine(
        'LeagueClientUx --app-port=not-a-port --remoting-auth-token=synthetic-token --app-pid=123'
      )
    ).toBeNull()
    expect(
      parseCommandLine(
        'LeagueClientUx --app-port=65536 --remoting-auth-token=synthetic-token --app-pid=123'
      )
    ).toBeNull()
  })
})
