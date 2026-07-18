import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { LeagueClientUxMain } from '.'

const nativeMocks = vi.hoisted(() => ({
  getCommandLine: vi.fn(),
  getPidsByName: vi.fn(async () => [] as number[])
}))

vi.mock('@main/native', () => ({
  getCommandLine: nativeMocks.getCommandLine,
  getPidsByName: nativeMocks.getPidsByName,
  isElevated: false
}))

vi.mock('@resources/elevate.exe?asset&asarUnpack', () => ({ default: '/synthetic/elevate.exe' }))
vi.mock('@resources/rebuild_WMI.bat?asset&asarUnpack', () => ({
  default: '/synthetic/rebuild_WMI.bat'
}))
vi.mock('../ipc', () => ({ AkariIpcMain: class AkariIpcMain {} }))
vi.mock('../logger-factory', () => ({
  AkariLogger: class AkariLogger {},
  LoggerFactoryMain: class LoggerFactoryMain {}
}))
vi.mock('../mobx-utils', () => ({ MobxUtilsMain: class MobxUtilsMain {} }))
vi.mock('../setting-factory', () => ({ SettingFactoryMain: class SettingFactoryMain {} }))

function createLeagueClientUxMain() {
  const ipc = {
    onCall: vi.fn(),
    sendEvent: vi.fn()
  }
  const logger = {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn()
  }
  const loggerFactory = {
    create: vi.fn(() => logger)
  }
  const settingService = {
    applyToState: vi.fn(async () => undefined),
    set: vi.fn()
  }
  const settingFactory = {
    register: vi.fn(() => settingService)
  }
  const mobxUtils = {
    propSync: vi.fn()
  }

  return new LeagueClientUxMain(
    ipc as any,
    loggerFactory as any,
    settingFactory as any,
    mobxUtils as any
  )
}

describe('LeagueClientUxMain polling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    nativeMocks.getPidsByName.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('keeps the selected interval after consecutive successful reads', async () => {
    const leagueClientUx = createLeagueClientUxMain()
    await leagueClientUx.onInit()
    await vi.advanceTimersByTimeAsync(0)
    nativeMocks.getPidsByName.mockClear()

    leagueClientUx.setPollInterval(5_000)

    await vi.advanceTimersByTimeAsync(4_999)
    expect(nativeMocks.getPidsByName).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(nativeMocks.getPidsByName).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(5_000)
    expect(nativeMocks.getPidsByName).toHaveBeenCalledTimes(2)

    await leagueClientUx.onDispose()
  })
})
