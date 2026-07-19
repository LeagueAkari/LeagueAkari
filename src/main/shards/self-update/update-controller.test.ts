import type { SelfUpdateReleaseInfo } from '@shared/shards/self-update'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SELF_UPDATE_MAIN_NAMESPACE, type SelfUpdateMainContext } from './context'
import { shouldRunSelfUpdateLifecycle } from './platform'
import { SelfUpdateSettings, SelfUpdateState } from './state'
import { SelfUpdateController } from './update-controller'

vi.mock('./platform', () => ({
  shouldRunSelfUpdateLifecycle: vi.fn(() => true)
}))

const releaseInfo: SelfUpdateReleaseInfo = {
  version: '1.6.0',
  currentVersion: '1.5.0',
  publishedAt: '2026-07-19T00:00:00.000Z',
  description: 'Release notes',
  isNew: true,
  isUpdateSupported: true,
  artifact: {
    platform: 'win32',
    arch: 'x64',
    fileName: 'LeagueAkari-1.6.0-win.7z',
    size: 1024,
    contentType: 'application/x-7z-compressed',
    sha256: null,
    downloadUrl: 'https://example.com/LeagueAkari-1.6.0-win.7z'
  }
}

function createContext(updateLatestRelease = vi.fn().mockResolvedValue(undefined)) {
  return {
    namespace: SELF_UPDATE_MAIN_NAMESPACE,
    settings: new SelfUpdateSettings(),
    state: new SelfUpdateState(() => releaseInfo, true),
    logger: { info: vi.fn(), warn: vi.fn() },
    appCommon: {
      settings: {
        locale: 'zh-CN',
        httpProxy: { strategy: 'auto' }
      }
    },
    ipc: {},
    mobxUtils: { reaction: vi.fn() },
    akariApi: { updateLatestRelease },
    httpClient: { defaults: {} }
  } as unknown as SelfUpdateMainContext
}

afterEach(() => {
  vi.mocked(shouldRunSelfUpdateLifecycle).mockReturnValue(true)
})

describe('SelfUpdateController', () => {
  it('owns the update-check loading state and returns the projected release', async () => {
    const context = createContext()
    const controller = new SelfUpdateController(context, { start: vi.fn() } as never)

    const checking = controller.checkLatestRelease()

    expect(context.state.isCheckingUpdates).toBe(true)
    await expect(checking).resolves.toBe(releaseInfo)
    expect(context.akariApi.updateLatestRelease).toHaveBeenCalledTimes(1)
    expect(context.akariApi.updateLatestRelease).toHaveBeenCalledWith('zh-CN')
    expect(context.state.isCheckingUpdates).toBe(false)

    controller.dispose()
  })

  it('does not ask the data layer for releases on unsupported platforms', async () => {
    vi.mocked(shouldRunSelfUpdateLifecycle).mockReturnValue(false)
    const context = createContext()
    const controller = new SelfUpdateController(context, { start: vi.fn() } as never)

    await expect(controller.checkLatestRelease()).rejects.toThrow('platform-unsupported')
    controller.watchLatestRelease()

    expect(context.akariApi.updateLatestRelease).not.toHaveBeenCalled()
    expect(context.mobxUtils.reaction).not.toHaveBeenCalled()
    expect(context.state.isCheckingUpdates).toBe(false)

    controller.dispose()
  })
})
