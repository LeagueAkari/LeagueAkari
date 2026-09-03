import { describe, expect, it, vi } from 'vitest'

import type { ExternalHttpMainContext } from './context'
import { ExternalHttpProxyController, resolveExternalHttpProxyConfig } from './proxy-controller'

describe('resolveExternalHttpProxyConfig', () => {
  it('maps Akari proxy strategies to Electron proxy modes', () => {
    expect(
      resolveExternalHttpProxyConfig({ strategy: 'auto', host: '127.0.0.1', port: 7890 })
    ).toEqual({ mode: 'system' })
    expect(
      resolveExternalHttpProxyConfig({ strategy: 'disable', host: '127.0.0.1', port: 7890 })
    ).toEqual({ mode: 'direct' })
    expect(
      resolveExternalHttpProxyConfig({ strategy: 'force', host: '127.0.0.1', port: 7890 })
    ).toEqual({ mode: 'fixed_servers', proxyRules: '127.0.0.1:7890' })
  })
})

describe('ExternalHttpProxyController', () => {
  it('configures the initial proxy without closing an unused connection pool', async () => {
    const setting = { strategy: 'disable' as const, host: '127.0.0.1', port: 7890 }
    const dispose = vi.fn()
    const setProxy = vi.fn().mockResolvedValue(undefined)
    const closeAllConnections = vi.fn().mockResolvedValue(undefined)
    const context = {
      appCommon: { settings: { httpProxy: setting } },
      logger: { warn: vi.fn() },
      electronSession: { setProxy, closeAllConnections },
      mobxUtils: {
        reaction: vi.fn((expression, effect) => {
          effect(expression())
          return dispose
        })
      }
    } as unknown as ExternalHttpMainContext
    const controller = new ExternalHttpProxyController(context)

    controller.start()
    await controller.waitUntilConfigured()

    expect(setProxy).toHaveBeenCalledWith({ mode: 'direct' })
    expect(closeAllConnections).not.toHaveBeenCalled()
    controller.dispose()
    expect(dispose).toHaveBeenCalledOnce()
  })

  it('serializes proxy changes and closes connections after reconfiguration', async () => {
    const setting = { strategy: 'disable' as const, host: '127.0.0.1', port: 7890 }
    let updateProxy!: (setting: {
      strategy: 'auto' | 'force' | 'disable'
      host: string
      port: number
    }) => void
    let finishInitialConfiguration!: () => void
    const initialConfiguration = new Promise<void>((resolve) => {
      finishInitialConfiguration = resolve
    })
    const setProxy = vi
      .fn()
      .mockReturnValueOnce(initialConfiguration)
      .mockResolvedValueOnce(undefined)
    const closeAllConnections = vi.fn().mockResolvedValue(undefined)
    const context = {
      appCommon: { settings: { httpProxy: setting } },
      logger: { warn: vi.fn() },
      electronSession: { setProxy, closeAllConnections },
      mobxUtils: {
        reaction: vi.fn((expression, effect) => {
          effect(expression())
          updateProxy = effect
          return vi.fn()
        })
      }
    } as unknown as ExternalHttpMainContext
    const controller = new ExternalHttpProxyController(context)

    controller.start()
    await vi.waitFor(() => expect(setProxy).toHaveBeenCalledTimes(1))
    updateProxy({ strategy: 'force', host: 'localhost', port: 1080 })
    await Promise.resolve()
    expect(setProxy).toHaveBeenCalledTimes(1)

    finishInitialConfiguration()
    await controller.waitUntilConfigured()

    expect(setProxy).toHaveBeenNthCalledWith(2, {
      mode: 'fixed_servers',
      proxyRules: 'localhost:1080'
    })
    expect(closeAllConnections).toHaveBeenCalledOnce()
  })

  it('keeps startup alive when proxy configuration fails and blocks requests', async () => {
    const error = new Error('proxy failed')
    const logger = { warn: vi.fn() }
    const context = {
      appCommon: {
        settings: {
          httpProxy: { strategy: 'auto', host: '127.0.0.1', port: 7890 }
        }
      },
      logger,
      electronSession: {
        setProxy: vi.fn().mockRejectedValue(error),
        closeAllConnections: vi.fn()
      },
      mobxUtils: {
        reaction: vi.fn((expression, effect) => {
          effect(expression())
          return vi.fn()
        })
      }
    } as unknown as ExternalHttpMainContext
    const controller = new ExternalHttpProxyController(context)

    expect(() => controller.start()).not.toThrow()
    await expect(controller.waitUntilConfigured()).rejects.toThrow('proxy failed')
    await vi.waitFor(() => expect(logger.warn).toHaveBeenCalled())
  })
})
