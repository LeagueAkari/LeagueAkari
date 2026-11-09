import { app } from 'electron'
import { execFile } from 'node:child_process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AdministratorRelaunchExecutor } from './administrator-relaunch-executor'

vi.mock('@resources/elevate.exe?asset&asarUnpack', () => ({
  default: 'C:\\测试 & %TEMP%\\elevate.exe'
}))
vi.mock('electron', () => ({ app: { getAppPath: () => 'C:\\开发 测试\\Akari' } }))
vi.mock('node:child_process', () => ({ execFile: vi.fn() }))

const quit = vi.fn()
const logger = { info: vi.fn(), warn: vi.fn() }
const makeExecutor = () =>
  new AdministratorRelaunchExecutor({ shared: { global: { quit } }, logger } as any)

beforeEach(() => {
  vi.spyOn(process, 'platform', 'get').mockReturnValue('win32')
  vi.stubGlobal('process', process)
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('administrator relaunch', () => {
  it('keeps the old app alive during UAC and coalesces repeated requests, then quits normally', async () => {
    let complete!: (error: Error | null) => void
    vi.mocked(execFile).mockImplementation((...args: any[]) => {
      complete = args.at(-1)
      return {} as any
    })
    const executor = makeExecutor()
    const first = executor.relaunch()
    const second = executor.relaunch()
    expect(first).toBe(second)
    expect(execFile).toHaveBeenCalledTimes(1)
    expect(quit).not.toHaveBeenCalled()
    expect(execFile).toHaveBeenCalledWith(
      'C:\\测试 & %TEMP%\\elevate.exe',
      [process.execPath, `--akari-administrator-relaunch=${process.pid}`],
      { windowsHide: true },
      expect.any(Function)
    )
    complete(null)
    await first
    await executor.relaunch()
    expect(quit).toHaveBeenCalledTimes(1)
    expect(execFile).toHaveBeenCalledTimes(1)
  })

  it.each(['UAC cancelled: 1223', 'ENOENT', 'Access denied'])(
    '%s preserves the original app and permits retry',
    async (reason) => {
      vi.mocked(execFile).mockImplementation((...args: any[]) => {
        args.at(-1)(new Error(reason))
        return {} as any
      })
      const executor = makeExecutor()
      await expect(executor.relaunch()).rejects.toThrow(reason)
      expect(quit).not.toHaveBeenCalled()
      await expect(executor.relaunch()).rejects.toThrow(reason)
      expect(execFile).toHaveBeenCalledTimes(2)
    }
  )

  it.each(['darwin', 'linux'] as const)(
    'rejects direct calls on %s without starting a process or quitting',
    async (platform) => {
      vi.spyOn(process, 'platform', 'get').mockReturnValue(platform)
      await expect(makeExecutor().relaunch()).rejects.toThrow('only supported on Windows')
      expect(execFile).not.toHaveBeenCalled()
      expect(quit).not.toHaveBeenCalled()
    }
  )

  it('preserves the development app path instead of starting an empty Electron instance', async () => {
    vi.stubGlobal('process', { ...process, defaultApp: true })
    vi.mocked(execFile).mockImplementation((...args: any[]) => {
      args.at(-1)(null)
      return {} as any
    })
    await makeExecutor().relaunch()
    expect(vi.mocked(execFile).mock.calls[0][1]).toEqual([
      process.execPath,
      `"${app.getAppPath()}"`,
      `--akari-administrator-relaunch=${process.pid}`
    ])
  })
})
