import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'

import {
  watchAskUserToRunAsAdministrator,
  watchCannotGetUxCommandLine
} from './system-warning-dialogs'

const mocks = vi.hoisted(() => ({
  app: { isWindows: true, isElevated: false },
  ux: { settings: { useWmi: false }, hasClientButNoCommandLine: true },
  relaunch: vi.fn(),
  warning: vi.fn(),
  message: vi.fn(),
  destroy: vi.fn()
}))
vi.mock('@renderer-shared/shards', () => ({
  useInstance: () => ({ relaunchAsAdministrator: mocks.relaunch })
}))
vi.mock('@renderer-shared/shards/app-common', () => ({ AppCommonRenderer: class {} }))
vi.mock('@renderer-shared/shards/app-common/store', () => ({ useAppCommonStore: () => mocks.app }))
vi.mock('@renderer-shared/shards/league-client-ux/store', () => ({
  useLeagueClientUxStore: () => mocks.ux
}))
vi.mock('@renderer-shared/shards/league-client/store', () => ({
  useLeagueClientStore: () => ({ isDisconnected: true })
}))
vi.mock('@renderer-shared/shards/akari-navigation', () => ({ useAkariNavigation: vi.fn() }))
vi.mock('@main-window/settings-navigation', () => ({ navigateToSetting: vi.fn() }))
vi.mock('i18next-vue', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock('naive-ui', () => ({
  NCheckbox: {},
  useDialog: () => ({ warning: mocks.warning }),
  useMessage: () => ({ warning: mocks.message })
}))

let scope = effectScope()
beforeEach(() => {
  scope = effectScope()
  mocks.app.isWindows = true
  mocks.app.isElevated = false
  mocks.ux.settings.useWmi = false
  vi.resetAllMocks()
  mocks.warning.mockImplementation(() => ({ destroy: mocks.destroy }))
  mocks.relaunch.mockResolvedValue(undefined)
})
afterEach(() => scope.stop())

describe('Windows elevation dialogs', () => {
  it('does not offer either Windows-only dialog on macOS, even with WMI enabled', () => {
    mocks.app.isWindows = false
    mocks.ux.settings.useWmi = true
    scope.run(() => {
      watchAskUserToRunAsAdministrator()
      watchCannotGetUxCommandLine()
    })
    expect(mocks.warning).not.toHaveBeenCalled()
    expect(mocks.relaunch).not.toHaveBeenCalled()
  })

  it('the non-admin connection warning actually restarts; an already elevated confirmation does not', async () => {
    scope.run(watchCannotGetUxCommandLine)
    await mocks.warning.mock.calls[0][0].onPositiveClick()
    expect(mocks.relaunch).toHaveBeenCalledTimes(1)
    mocks.app.isElevated = true
    scope.run(watchCannotGetUxCommandLine)
    await mocks.warning.mock.calls[1][0].onPositiveClick()
    expect(mocks.relaunch).toHaveBeenCalledTimes(1)
    expect(mocks.destroy).toHaveBeenCalledTimes(1)
  })

  it('handles a rejected elevation without an unhandled promise, and keeps the dialog available to retry', async () => {
    mocks.ux.settings.useWmi = true
    mocks.relaunch.mockRejectedValueOnce(new Error('UAC cancelled'))
    scope.run(watchAskUserToRunAsAdministrator)
    const positiveClick = mocks.warning.mock.calls[0][0].onPositiveClick
    await expect(positiveClick()).resolves.toBe(false)
    expect(mocks.message).toHaveBeenCalledTimes(1)
    expect(mocks.destroy).not.toHaveBeenCalled()
    await positiveClick()
    expect(mocks.relaunch).toHaveBeenCalledTimes(2)
  })
})
