import { describe, expect, test } from 'vitest'

import { buildMacClientLaunchCommand } from './client-launcher'

describe('macOS Riot Client launcher command', () => {
  const riotArguments = ['--launch-product=league_of_legends', '--launch-patchline=live']

  test('opens an application bundle without shell interpolation and forwards arguments', () => {
    expect(buildMacClientLaunchCommand('/Applications/Riot Client.app', riotArguments)).toEqual({
      executablePath: 'open',
      args: [
        '-a',
        '/Applications/Riot Client.app',
        '--args',
        '--launch-product=league_of_legends',
        '--launch-patchline=live'
      ]
    })
  })

  test('executes a nested binary directly without adding shell quotes', () => {
    expect(
      buildMacClientLaunchCommand(
        '/Users/Shared/Riot Games/Riot Client.app/Contents/MacOS/RiotClientServices',
        riotArguments
      )
    ).toEqual({
      executablePath: '/Users/Shared/Riot Games/Riot Client.app/Contents/MacOS/RiotClientServices',
      args: riotArguments
    })
  })
})
