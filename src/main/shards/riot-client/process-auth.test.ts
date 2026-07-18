import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  RiotClientProcessAuthReader,
  getRiotClientProcessName,
  parseRiotClientProcessCommandLine,
  shouldReadRiotClientProcessAuth
} from './process-auth'
import { RiotClientProcessAuthController } from './process-auth-controller'

const SYNTHETIC_TOKEN_1 = 'synthetic-riot-token-one_DO_NOT_USE'
const SYNTHETIC_TOKEN_2 = 'synthetic-riot-token-two_DO_NOT_USE'

describe('Riot Client process authentication', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('parses safe argument-array process output with spaces before Riot credentials', () => {
    const commandLine =
      '/Applications/Riot Client.app/Contents/MacOS/RiotClientServices ' +
      `--app-port=51234 --remoting-auth-token=${SYNTHETIC_TOKEN_1} ` +
      '--app-root=/Applications/Riot Client.app'

    expect(parseRiotClientProcessCommandLine(commandLine, 4242)).toEqual({
      authToken: SYNTHETIC_TOKEN_1,
      pid: 4242,
      port: 51234
    })
  })

  it('rejects missing credentials and ports outside the TCP range', () => {
    expect(
      parseRiotClientProcessCommandLine(
        `RiotClientServices --app-port=65536 --remoting-auth-token=${SYNTHETIC_TOKEN_1}`,
        1
      )
    ).toBeNull()
    expect(parseRiotClientProcessCommandLine('RiotClientServices --app-port=51234', 1)).toBeNull()
  })

  it('uses the process reader only on Darwin without changing Windows process naming', () => {
    expect(shouldReadRiotClientProcessAuth('darwin')).toBe(true)
    expect(shouldReadRiotClientProcessAuth('win32')).toBe(false)
    expect(getRiotClientProcessName('darwin')).toBe('RiotClientServices')
    expect(getRiotClientProcessName('win32')).toBe('RiotClientServices.exe')
  })

  it('reads Riot credentials from LeagueClientUx when RiotClientServices has no API flags', async () => {
    const listProcesses = vi.fn(async () => [
      {
        executablePath:
          '/Users/Shared/Riot Games/Riot Client.app/Contents/MacOS/RiotClientServices',
        name: 'RiotClientServices',
        pid: 100
      },
      {
        executablePath: '/Applications/League of Legends.app/Contents/LoL/LeagueClientUx',
        name: 'LeagueClientUx',
        pid: 200
      }
    ])
    const getCommandLine = vi.fn(async (pid: number) =>
      pid === 100
        ? '/Users/Shared/Riot Games/Riot Client.app/Contents/MacOS/RiotClientServices'
        : '/Applications/League of Legends.app/Contents/LoL/LeagueClientUx ' +
          `--riotclient-app-port=51234 --riotclient-auth-token=${SYNTHETIC_TOKEN_1}`
    )

    await expect(
      new RiotClientProcessAuthReader(listProcesses, getCommandLine).read()
    ).resolves.toEqual({
      status: 'found',
      auth: {
        authToken: SYNTHETIC_TOKEN_1,
        pid: 100,
        port: 51234
      }
    })

    expect(getCommandLine).toHaveBeenNthCalledWith(1, 100)
    expect(getCommandLine).toHaveBeenNthCalledWith(2, 200)
  })

  it('publishes rotation and process exit without clearing on a transient unreadable result', async () => {
    const results = [
      {
        status: 'found' as const,
        auth: { authToken: SYNTHETIC_TOKEN_1, pid: 100, port: 51001 }
      },
      { status: 'unreadable' as const },
      {
        status: 'found' as const,
        auth: { authToken: SYNTHETIC_TOKEN_2, pid: 200, port: 51002 }
      },
      { status: 'not-running' as const }
    ]
    const reader = { read: vi.fn(async () => results.shift()!) }
    const onAuthChanged = vi.fn()
    const controller = new RiotClientProcessAuthController(
      reader,
      onAuthChanged,
      { debug: vi.fn(), info: vi.fn(), warn: vi.fn() },
      60_000
    )

    await controller.start()
    await controller.updateNow()
    await controller.updateNow()
    await controller.updateNow()
    controller.stop()

    expect(onAuthChanged).toHaveBeenNthCalledWith(1, {
      authToken: SYNTHETIC_TOKEN_1,
      pid: 100,
      port: 51001
    })
    expect(onAuthChanged).toHaveBeenNthCalledWith(2, {
      authToken: SYNTHETIC_TOKEN_2,
      pid: 200,
      port: 51002
    })
    expect(onAuthChanged).toHaveBeenNthCalledWith(3, null)
  })
})
