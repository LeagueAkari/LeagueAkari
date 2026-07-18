import 'reflect-metadata'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GameClientMain } from './index'

const nativeMock = vi.hoisted(() => ({
  foregroundAvailable: false,
  getPidsByName: vi.fn<() => Promise<number[]>>(),
  isProcessForeground: vi.fn<(pid: number) => boolean>(),
  isProcessRunning: vi.fn<(pid: number) => boolean>(),
  terminateProcess: vi.fn<(pid: number) => boolean>()
}))

vi.mock('@main/native', () => ({
  NATIVE_SUPPORT: {
    isProcessForeground: {
      get available() {
        return nativeMock.foregroundAvailable
      }
    }
  },
  getPidsByName: nativeMock.getPidsByName,
  isProcessForeground: nativeMock.isProcessForeground,
  isProcessRunning: nativeMock.isProcessRunning,
  terminateProcess: nativeMock.terminateProcess
}))

vi.mock('../client-installation', () => ({ ClientInstallationMain: class {} }))
vi.mock('../ipc', () => ({ AkariIpcMain: class {} }))
vi.mock('../keyboard-shortcuts', () => ({ KeyboardShortcutsMain: class {} }))
vi.mock('../league-client', () => ({ LeagueClientMain: class {} }))
vi.mock('../logger-factory', () => ({
  LoggerFactoryMain: class {},
  AkariLogger: class {}
}))
vi.mock('../mobx-utils', () => ({ MobxUtilsMain: class {} }))
vi.mock('../setting-factory', () => ({ SettingFactoryMain: class {} }))
vi.mock('./ipc-handlers', () => ({
  GameClientIpcHandlers: class {
    register() {}
  }
}))
vi.mock('./settings-file-controller', () => ({
  GameClientSettingsFileController: class {}
}))
vi.mock('./shortcut-controller', () => ({
  GameClientShortcutController: class {
    watch() {}
    applyTerminateShortcutSettingSideEffect() {}
  }
}))

function createGameClient() {
  return new GameClientMain(
    { onCall: vi.fn() } as any,
    {
      create: () => ({
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn()
      })
    } as any,
    {
      register: () => ({
        applyToState: vi.fn()
      })
    } as any,
    {} as any,
    {
      register: vi.fn(),
      unregisterByTargetId: vi.fn()
    } as any,
    { propSync: vi.fn() } as any,
    {} as any
  )
}

describe('GameClientMain native capability gating', () => {
  beforeEach(() => {
    nativeMock.foregroundAvailable = false
    nativeMock.getPidsByName.mockReset()
    nativeMock.isProcessForeground.mockReset()
    nativeMock.isProcessRunning.mockReset()
    nativeMock.terminateProcess.mockReset()
  })

  it('does not call the Win32 foreground API when that capability is unavailable', async () => {
    await expect(GameClientMain.isGameClientForeground()).resolves.toBe(false)

    expect(nativeMock.getPidsByName).not.toHaveBeenCalled()
    expect(nativeMock.isProcessForeground).not.toHaveBeenCalled()
  })

  it('keeps cross-platform process termination without calling the unavailable foreground API', async () => {
    nativeMock.getPidsByName.mockResolvedValue([101])
    nativeMock.terminateProcess.mockReturnValue(true)

    await createGameClient().terminateGameClient()

    expect(nativeMock.isProcessForeground).not.toHaveBeenCalled()
    expect(nativeMock.terminateProcess).toHaveBeenCalledWith(101)
  })

  it('preserves Windows foreground filtering when the capability is available', async () => {
    nativeMock.foregroundAvailable = true
    nativeMock.getPidsByName.mockResolvedValue([101, 202])
    nativeMock.isProcessForeground.mockImplementation((pid) => pid === 202)
    nativeMock.terminateProcess.mockReturnValue(true)

    await createGameClient().terminateGameClient()

    expect(nativeMock.terminateProcess).toHaveBeenCalledOnce()
    expect(nativeMock.terminateProcess).toHaveBeenCalledWith(202)
  })
})
