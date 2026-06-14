import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  IN_GAME_SEND_ENTER_KEY_CODE,
  IN_GAME_SEND_MAIN_NAMESPACE,
  type InGameSendMainContext
} from './context'
import { InGameSendExecutor, normalizeInGameSendLines } from './send-executor'
import { InGameSendSettings, InGameSendState } from './state'

const nativeInputMock = vi.hoisted(() => ({
  support: {
    available: true
  },
  instance: {
    sendKey: vi.fn((_keyCode: number, _isDown: boolean) => Promise.resolve()),
    sendString: vi.fn((_text: string) => Promise.resolve())
  }
}))

const sleepMock = vi.hoisted(() => ({
  sleep: vi.fn((_delay: number) => Promise.resolve())
}))

vi.mock('@main/native', () => ({
  NATIVE_SUPPORT: {
    nativeInput: nativeInputMock.support
  },
  nativeInput: {
    instance: nativeInputMock.instance
  }
}))

vi.mock('@shared/utils/sleep', () => ({
  sleep: sleepMock.sleep
}))

interface TestContextOptions {
  championSelectConversation?: boolean
  customGameConversation?: boolean
  foreground?: boolean
  sendInterval?: number
}

function createContext(phase: string, options: TestContextOptions = {}) {
  const settings = new InGameSendSettings()
  settings.setSendInterval(options.sendInterval ?? 123)

  const chatSend = vi.fn(() => Promise.resolve())

  const context = {
    namespace: IN_GAME_SEND_MAIN_NAMESPACE,
    settings,
    state: new InGameSendState(),
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    },
    settingService: {},
    mobxUtils: {
      reaction: vi.fn()
    },
    ipc: {},
    keyboardShortcuts: {},
    ongoingGame: {
      state: {
        queryStage: {
          phase,
          gameInfo: phase === 'unavailable' ? null : {}
        }
      }
    },
    leagueClient: {
      data: {
        chat: {
          conversations: {
            championSelect:
              options.championSelectConversation === false
                ? null
                : {
                    id: 'champ-select-chat'
                  },
            customGame:
              options.customGameConversation === false
                ? null
                : {
                    id: 'lobby-chat'
                  }
          }
        }
      },
      api: {
        chat: {
          chatSend
        }
      }
    },
    shared: {},
    appCommon: {},
    remoteConfig: {},
    isGameClientForeground: vi.fn(() => Promise.resolve(options.foreground ?? true))
  } as unknown as InGameSendMainContext

  return { context, chatSend }
}

describe('InGameSendExecutor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    nativeInputMock.support.available = true
  })

  it('filters empty lines while preserving non-empty line text', () => {
    expect(normalizeInGameSendLines(['one', '', '  ', ' two '])).toEqual(['one', ' two '])
  })

  it('sends one newline-joined message during champion select', async () => {
    const { context, chatSend } = createContext('champ-select')
    const executor = new InGameSendExecutor(context)

    await expect(executor.sendLines(['one', '', 'two'])).resolves.toBe(true)

    expect(chatSend).toHaveBeenCalledTimes(1)
    expect(chatSend).toHaveBeenCalledWith('champ-select-chat', 'one\ntwo')
    expect(context.isGameClientForeground).not.toHaveBeenCalled()
    expect(nativeInputMock.instance.sendString).not.toHaveBeenCalled()
    expect(sleepMock.sleep).not.toHaveBeenCalled()
  })

  it('sends one newline-joined message during lobby phase', async () => {
    const { context, chatSend } = createContext('lobby')
    const executor = new InGameSendExecutor(context)

    await expect(executor.sendLines(['one', 'two'])).resolves.toBe(true)

    expect(chatSend).toHaveBeenCalledTimes(1)
    expect(chatSend).toHaveBeenCalledWith('lobby-chat', 'one\ntwo')
    expect(context.isGameClientForeground).not.toHaveBeenCalled()
    expect(nativeInputMock.instance.sendString).not.toHaveBeenCalled()
    expect(sleepMock.sleep).not.toHaveBeenCalled()
  })

  it('silently skips lobby sending when there is no lobby chat room', async () => {
    const { context, chatSend } = createContext('lobby', { customGameConversation: false })
    const executor = new InGameSendExecutor(context)

    await expect(executor.sendLines(['one'])).resolves.toBe(false)

    expect(chatSend).not.toHaveBeenCalled()
  })

  it('does not send in draft mode', async () => {
    const { context, chatSend } = createContext('draft')
    const executor = new InGameSendExecutor(context)

    await expect(executor.sendLines(['one'])).resolves.toBe(false)

    expect(chatSend).not.toHaveBeenCalled()
    expect(nativeInputMock.instance.sendString).not.toHaveBeenCalled()
  })

  it('sends separate in-game messages with the configured interval only between messages', async () => {
    const { context, chatSend } = createContext('in-game', { sendInterval: 456 })
    const executor = new InGameSendExecutor(context)

    await expect(executor.sendLines(['one', '', 'two'])).resolves.toBe(true)

    expect(chatSend).not.toHaveBeenCalled()
    expect(nativeInputMock.instance.sendString.mock.calls.map(([text]) => text)).toEqual([
      'one',
      'two'
    ])
    expect(nativeInputMock.instance.sendKey).toHaveBeenCalledWith(IN_GAME_SEND_ENTER_KEY_CODE, true)
    expect(sleepMock.sleep.mock.calls.filter(([delay]) => delay === 456)).toHaveLength(1)
  })
})
