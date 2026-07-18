import 'reflect-metadata'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { LeagueClientMain } from '.'

vi.mock('@main/native', () => ({
  NATIVE_SUPPORT: {
    adjustLeagueClientWindowSize: { available: false }
  },
  adjustLeagueClientWindowSize: vi.fn(),
  getPidsByName: vi.fn(async () => [])
}))
vi.mock('../akari-protocol', () => ({ AkariProtocolMain: class AkariProtocolMain {} }))
vi.mock('../ipc', () => ({ AkariIpcMain: class AkariIpcMain {} }))
vi.mock('../league-client-ux', () => ({ LeagueClientUxMain: class LeagueClientUxMain {} }))
vi.mock('../logger-factory', () => ({
  AkariLogger: class AkariLogger {},
  LoggerFactoryMain: class LoggerFactoryMain {}
}))
vi.mock('../mobx-utils', () => ({ MobxUtilsMain: class MobxUtilsMain {} }))
vi.mock('../setting-factory', () => ({ SettingFactoryMain: class SettingFactoryMain {} }))
vi.mock('./ipc-handlers', () => ({ LeagueClientIpcHandlers: class LeagueClientIpcHandlers {} }))
vi.mock('./lc-state', () => ({ LeagueClientData: class LeagueClientData {} }))

function createConnectionLoopHarness() {
  const target = {
    pid: 4242,
    port: 54321,
    authToken: 'synthetic-lcu-token_DO_NOT_USE',
    certificate: 'synthetic-certificate',
    region: 'euw',
    rsoPlatformId: 'EUW1',
    riotClientPort: 61234,
    riotClientAuthToken: 'synthetic-riot-token_DO_NOT_USE'
  }
  const state = {
    connectionState: 'disconnected',
    connectingClient: target as typeof target | null,
    setConnectingClient: vi.fn((value: typeof target | null) => {
      state.connectingClient = value
    }),
    setConnected: vi.fn(() => {
      state.connectionState = 'connected'
    }),
    setConnecting: vi.fn(() => {
      state.connectionState = 'connecting'
    }),
    setDisconnected: vi.fn(() => {
      state.connectionState = 'disconnected'
    })
  }
  const client = Object.create(LeagueClientMain.prototype) as any
  Object.assign(client, {
    _connectToLcu: vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('LCU is still starting'), { status: 401 }))
      .mockResolvedValueOnce(undefined),
    _ipc: { sendEvent: vi.fn() },
    _leagueClientUx: { state: { launchedClients: [target] } },
    _logger: { info: vi.fn(), warn: vi.fn() },
    _manuallyDisconnected: false,
    _connectionAttemptId: 0,
    _isConnectionLoopRunning: false,
    _shouldHaveOneAttempt: false,
    state
  })

  return { client, state, target }
}

describe('League Client connection lifecycle', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('retries a transient startup response while the target process remains live', async () => {
    vi.useFakeTimers()
    const { client, state } = createConnectionLoopHarness()

    const loop = client._doConnectingLoop()
    await vi.advanceTimersByTimeAsync(LeagueClientMain.CONNECT_TO_LC_RETRY_INTERVAL)
    await loop

    expect(client._connectToLcu).toHaveBeenCalledTimes(2)
    expect(state.setConnectingClient).toHaveBeenLastCalledWith(null)
    expect(client._ipc.sendEvent).toHaveBeenCalledOnce()
  })

  it('clears the retry target on an explicit disconnect', () => {
    const { client, state } = createConnectionLoopHarness()
    client._cleanup = vi.fn()

    client.disconnect()

    expect(state.connectingClient).toBeNull()
    expect(state.setDisconnected).toHaveBeenCalledOnce()
    expect(client._cleanup).toHaveBeenCalledOnce()
  })

  it('cannot finish a pending WebSocket connection after an explicit disconnect', async () => {
    const { client, state, target } = createConnectionLoopHarness()
    delete client._connectToLcu

    let resolveWebSocket!: (webSocket: any) => void
    const pendingWebSocket = new Promise<any>((resolve) => {
      resolveWebSocket = resolve
    })
    const webSocket = {
      close: vi.fn(),
      readyState: 1,
      send: vi.fn(),
      on: vi.fn()
    }
    client._wsPromisified = vi.fn(() => pendingWebSocket)
    client._createHttpInstance = vi.fn(async () => ({
      httpClient: {},
      leagueClientApi: {}
    }))
    client._eventBus = { emit: vi.fn() }
    client._settingService = { _saveToStorage: vi.fn(async () => undefined) }

    const connection = client._connectToLcu(target)
    client.disconnect()
    resolveWebSocket(webSocket)

    await expect(connection).rejects.toThrow()
    expect(state.setConnected).not.toHaveBeenCalled()
    expect(client._createHttpInstance).not.toHaveBeenCalled()
    expect(webSocket.close).toHaveBeenCalledOnce()
  })
})
