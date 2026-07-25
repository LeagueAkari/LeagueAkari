import { describe, expect, it, vi } from 'vitest'

import { Win32Addons, initializeWin32Addons } from './addons-win32'

function createAddons(elevated: boolean) {
  let installed = false

  const tools = {
    load: vi.fn(),
    isElevated: vi.fn(() => elevated)
  }
  const inputInstance = {
    get isInstalled() {
      return installed
    },
    install: vi.fn(() => {
      installed = true
    }),
    uninstall: vi.fn(() => {
      installed = false
    })
  }
  const input = {
    load: vi.fn(),
    instance: inputInstance
  }

  return {
    addons: { tools, input } as unknown as Win32Addons,
    tools,
    input,
    inputInstance
  }
}

describe('initializeWin32Addons', () => {
  it('propagates a mandatory tools load failure without touching input', () => {
    const mocks = createAddons(true)
    const loadError = new Error('tools load failed')
    mocks.tools.load.mockImplementation(() => {
      throw loadError
    })

    expect(() => initializeWin32Addons(mocks.addons, vi.fn())).toThrow(loadError)
    expect(mocks.tools.isElevated).not.toHaveBeenCalled()
    expect(mocks.input.load).not.toHaveBeenCalled()
    expect(mocks.inputInstance.install).not.toHaveBeenCalled()
  })

  it('never loads input when the process is not elevated', () => {
    const mocks = createAddons(false)
    const registerExitListener = vi.fn()

    const result = initializeWin32Addons(mocks.addons, registerExitListener)

    expect(result).toMatchObject({ addons: mocks.addons, isElevated: false })
    expect(mocks.tools.load).toHaveBeenCalledOnce()
    expect(mocks.input.load).not.toHaveBeenCalled()
    expect(mocks.inputInstance.install).not.toHaveBeenCalled()
    expect(registerExitListener).not.toHaveBeenCalled()
  })

  it('loads, installs, and registers cleanup for elevated input', () => {
    const mocks = createAddons(true)
    let exitListener: (() => void) | undefined

    const result = initializeWin32Addons(mocks.addons, (listener) => {
      exitListener = listener
    })

    expect(result).toMatchObject({ addons: mocks.addons, isElevated: true })
    expect(result.inputInitializationError).toBeUndefined()
    expect(mocks.input.load).toHaveBeenCalledOnce()
    expect(mocks.inputInstance.install).toHaveBeenCalledOnce()
    expect(exitListener).toBeTypeOf('function')

    exitListener?.()
    expect(mocks.inputInstance.uninstall).toHaveBeenCalledOnce()
  })

  it('keeps an input load failure recoverable', () => {
    const mocks = createAddons(true)
    const loadError = new Error('input load failed')
    mocks.input.load.mockImplementation(() => {
      throw loadError
    })
    const registerExitListener = vi.fn()

    const result = initializeWin32Addons(mocks.addons, registerExitListener)

    expect(result.inputInitializationError).toBe(loadError)
    expect(mocks.inputInstance.install).not.toHaveBeenCalled()
    expect(registerExitListener).not.toHaveBeenCalled()
  })

  it('keeps an input install failure recoverable', () => {
    const mocks = createAddons(true)
    const installError = new Error('input install failed')
    mocks.inputInstance.install.mockImplementation(() => {
      throw installError
    })
    const registerExitListener = vi.fn()

    const result = initializeWin32Addons(mocks.addons, registerExitListener)

    expect(result.inputInitializationError).toBe(installError)
    expect(mocks.input.load).toHaveBeenCalledOnce()
    expect(registerExitListener).not.toHaveBeenCalled()
  })
})
