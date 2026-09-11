import { app } from 'electron'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getAdministratorRelaunchParentPid, waitForAdministratorRelaunchParent } from '.'

vi.mock('electron', () => ({ app: { commandLine: { removeSwitch: vi.fn() } } }))
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('administrator restart handoff', () => {
  it('only accepts a positive Windows parent PID, never a signal process group or self', () => {
    expect(getAdministratorRelaunchParentPid(['--akari-administrator-relaunch=123'], 'win32')).toBe(
      123
    )
    for (const value of ['0', '-1', '1.2', 'NaN', '4294967296', String(process.pid)]) {
      expect(
        getAdministratorRelaunchParentPid([`--akari-administrator-relaunch=${value}`], 'win32')
      ).toBeNull()
    }
    expect(
      getAdministratorRelaunchParentPid(['--akari-administrator-relaunch=123'], 'darwin')
    ).toBeNull()
    expect(getAdministratorRelaunchParentPid([], 'win32')).toBeNull()
  })

  it('does not proceed until the old PID exits, and removes the one-shot flag', () => {
    const kill = vi
      .fn()
      .mockReturnValueOnce(true)
      .mockImplementation(() => {
        throw Object.assign(new Error('exited'), { code: 'ESRCH' })
      })
    vi.stubGlobal('process', {
      ...process,
      platform: 'win32',
      argv: ['app', '--akari-administrator-relaunch=123'],
      kill
    })
    vi.spyOn(Atomics, 'wait').mockReturnValue('timed-out')
    waitForAdministratorRelaunchParent(123)
    expect(kill.mock.calls).toEqual([
      [123, 0],
      [123, 0]
    ])
    expect(process.argv).toEqual(['app'])
    expect(app.commandLine.removeSwitch).toHaveBeenCalledWith('akari-administrator-relaunch')
  })

  it.each(['timeout', 'permission'])(
    'fails boundedly on %s instead of starting two database owners',
    (reason) => {
      const kill = vi.fn(() => {
        if (reason === 'permission') throw Object.assign(new Error('denied'), { code: 'EPERM' })
        return true
      })
      vi.stubGlobal('process', { ...process, platform: 'win32', argv: [], kill })
      expect(() => waitForAdministratorRelaunchParent(123, 0)).toThrow()
      expect(kill).toHaveBeenCalledTimes(1)
    }
  )

  it('does not wait or alter arguments for normal startup or macOS', () => {
    const kill = vi.fn()
    vi.stubGlobal('process', { ...process, platform: 'darwin', kill })
    waitForAdministratorRelaunchParent(123)
    waitForAdministratorRelaunchParent(null)
    expect(kill).not.toHaveBeenCalled()
  })
})
