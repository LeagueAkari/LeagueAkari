import { EventEmitter } from 'node:events'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { ClientInstallationJumpListController } from './jump-list-controller'

const electronMocks = vi.hoisted(() => ({
  setJumpList: vi.fn()
}))

vi.mock('electron', () => ({
  app: {
    setJumpList: electronMocks.setJumpList
  }
}))

vi.mock('@main/i18n', () => ({
  i18next: {
    getFixedT: () => (key: string) => key
  }
}))

vi.mock('@main/utils/deep-link', () => ({
  DEEP_LINK_PROTOCOL: 'league-akari'
}))

function createContext(startupDeepLink: string | null = null) {
  const events = new EventEmitter()
  const state = {
    tclsExecutablePath: null,
    weGameLauncherExecutablePath: null,
    officialRiotClientExecutablePath: '/Applications/Riot Client.app'
  }

  return {
    events,
    context: {
      appCommon: { settings: { locale: 'en' } },
      logger: { info: vi.fn(), warn: vi.fn() },
      mobxUtils: {
        reaction: vi.fn((expression: () => unknown, effect: () => void) => {
          expression()
          effect()
        })
      },
      shared: { global: { events, startupDeepLink } },
      state
    }
  }
}

describe('client installation deep links on macOS', () => {
  beforeEach(() => {
    electronMocks.setJumpList.mockReset()
    vi.spyOn(process, 'platform', 'get').mockReturnValue('darwin')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('handles a startup Riot launch without creating a Windows Jump List', () => {
    const { context } = createContext(
      'league-akari://shards/client-installation-main/launch-riot-client-lol'
    )
    const launcher = { launchDefaultRiotClient: vi.fn() }

    new ClientInstallationJumpListController(context as any, launcher as any).register()

    expect(launcher.launchDefaultRiotClient).toHaveBeenCalledOnce()
    expect(electronMocks.setJumpList).not.toHaveBeenCalled()
  })

  test('handles Riot launch links delivered through the macOS open-url path', () => {
    const { context, events } = createContext()
    const launcher = { launchDefaultRiotClient: vi.fn() }

    new ClientInstallationJumpListController(context as any, launcher as any).register()
    events.emit(
      'second-instance-deep-link',
      'league-akari://shards/client-installation-main/launch-riot-client-lol'
    )

    expect(launcher.launchDefaultRiotClient).toHaveBeenCalledOnce()
    expect(electronMocks.setJumpList).not.toHaveBeenCalled()
  })
})
