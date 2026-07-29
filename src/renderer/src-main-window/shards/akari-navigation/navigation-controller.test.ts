import type { AkariNavigationRegistration } from '@renderer-shared/composables/useAkariNavigation'
import type { LoggerRenderer } from '@renderer-shared/shards/logger'
import { afterEach, describe, expect, test, vi } from 'vitest'

import type { AkariNavigationRendererContext } from './context'
import { AkariNavigationController } from './navigation-controller'

function createController(deadlineMs = 1000) {
  const logger = {
    warn: vi.fn(),
    error: vi.fn()
  } as unknown as LoggerRenderer
  const context: AkariNavigationRendererContext = {
    namespace: 'akari-navigation-test',
    logger
  }

  return {
    controller: new AkariNavigationController(context, deadlineMs),
    logger
  }
}

function registerAny(
  controller: AkariNavigationController,
  outlet: symbol,
  registration: Omit<AkariNavigationRegistration, 'match'>
) {
  return controller.register(outlet, { ...registration, match: 'any' })
}

afterEach(() => {
  vi.useRealTimers()
})

describe('AkariNavigationController', () => {
  test('consumes a mounted path in order and advances the cursor after readiness', async () => {
    const { controller } = createController()
    const pageOutlet = controller.context.createOutlet()
    const targetOutlet = controller.context.createOutlet()
    const calls: string[] = []

    registerAny(controller, controller.rootOutlet, {
      scope: 'main-window',
      childOutlet: pageOutlet,
      activate: () => {
        calls.push('main-window')
      }
    })
    registerAny(controller, pageOutlet, {
      scope: 'page',
      childOutlet: targetOutlet,
      activate: async () => {
        calls.push('page:start')
        await Promise.resolve()
        calls.push('page:ready')
      }
    })
    controller.register(targetOutlet, {
      scope: 'target',
      match: 'destination',
      destination: 'setting-id',
      activate: () => {
        calls.push('target')
      }
    })

    const result = await controller.navigate([
      { scope: 'main-window', destination: 'settings' },
      { scope: 'page', destination: 'basic' },
      { scope: 'target', destination: 'setting-id', waitForRegistration: false }
    ])

    expect(result).toMatchObject({ status: 'completed', cursor: 3 })
    expect(calls).toEqual(['main-window', 'page:start', 'page:ready', 'target'])
  })

  test('waits for a boundary that mounts after its parent becomes ready', async () => {
    const { controller } = createController()
    const childOutlet = controller.context.createOutlet()

    registerAny(controller, controller.rootOutlet, {
      scope: 'main-window',
      childOutlet,
      activate: () => undefined
    })

    const navigation = controller.navigate([
      { scope: 'main-window', destination: 'route' },
      { scope: 'late-boundary', destination: 'tab' }
    ])
    await Promise.resolve()

    registerAny(controller, childOutlet, {
      scope: 'late-boundary',
      activate: () => undefined
    })

    await expect(navigation).resolves.toMatchObject({ status: 'completed', cursor: 2 })
  })

  test('does not invoke a downstream target before an asynchronous boundary is ready', async () => {
    const { controller } = createController()
    const childOutlet = controller.context.createOutlet()
    let finishBoundary: (() => void) | undefined
    const target = vi.fn()

    registerAny(controller, controller.rootOutlet, {
      scope: 'slow-boundary',
      childOutlet,
      activate: () =>
        new Promise<void>((resolve) => {
          finishBoundary = resolve
        })
    })
    controller.register(childOutlet, {
      scope: 'target',
      match: 'destination',
      destination: 'destination',
      activate: target
    })

    const navigation = controller.navigate([
      { scope: 'slow-boundary', destination: 'pane' },
      { scope: 'target', destination: 'destination', waitForRegistration: false }
    ])
    await Promise.resolve()
    expect(target).not.toHaveBeenCalled()

    finishBoundary?.()
    await expect(navigation).resolves.toMatchObject({ status: 'completed' })
    expect(target).toHaveBeenCalledOnce()
  })

  test('cancels the previous navigation when a newer request starts', async () => {
    const { controller } = createController()
    const secondTarget = vi.fn()

    registerAny(controller, controller.rootOutlet, {
      scope: 'second',
      activate: secondTarget
    })

    const firstNavigation = controller.navigate([{ scope: 'missing', destination: 'first' }])
    await Promise.resolve()
    const secondNavigation = controller.navigate([{ scope: 'second', destination: 'second' }])

    await expect(firstNavigation).resolves.toMatchObject({ status: 'cancelled', cursor: 0 })
    await expect(secondNavigation).resolves.toMatchObject({ status: 'completed', cursor: 1 })
    expect(secondTarget).toHaveBeenCalledOnce()
  })

  test('reports the current step and clears its waiter when the shared deadline expires', async () => {
    vi.useFakeTimers()
    const { controller, logger } = createController(100)

    const navigation = controller.navigate([{ scope: 'missing', destination: 'target' }])
    await vi.advanceTimersByTimeAsync(101)

    await expect(navigation).resolves.toMatchObject({
      status: 'timed-out',
      cursor: 0,
      currentStep: { scope: 'missing', destination: 'target' }
    })
    expect(logger.warn).toHaveBeenCalledOnce()

    registerAny(controller, controller.rootOutlet, {
      scope: 'missing',
      activate: () => undefined
    })
  })

  test('rejects duplicate handlers for the same outlet, scope, and destination', () => {
    const { controller } = createController()
    const registration: AkariNavigationRegistration = {
      scope: 'target',
      match: 'destination',
      destination: 'same',
      activate: () => undefined
    }

    controller.register(controller.rootOutlet, registration)
    expect(() => controller.register(controller.rootOutlet, registration)).toThrow(
      'Akari navigation handler is already registered: target/same'
    )
  })

  test('does not advance the cursor when a destination is unavailable', async () => {
    const { controller } = createController()

    registerAny(controller, controller.rootOutlet, {
      scope: 'terminal',
      activate: () => ({ status: 'unavailable', reason: 'hidden' })
    })

    await expect(
      controller.navigate([{ scope: 'terminal', destination: 'hidden-target' }])
    ).resolves.toMatchObject({
      status: 'unavailable',
      cursor: 0,
      reason: 'hidden'
    })
  })

  test('does not advance the cursor when activation fails', async () => {
    const { controller, logger } = createController()

    registerAny(controller, controller.rootOutlet, {
      scope: 'failing',
      activate: () => {
        throw new Error('failed activation')
      }
    })

    await expect(
      controller.navigate([{ scope: 'failing', destination: 'target' }])
    ).resolves.toMatchObject({ status: 'failed', cursor: 0, reason: 'activation-failed' })
    expect(logger.error).toHaveBeenCalledOnce()
  })

  test('allows a final boundary to complete without exposing a child outlet', async () => {
    const { controller } = createController()

    registerAny(controller, controller.rootOutlet, {
      scope: 'page',
      activate: () => undefined
    })

    await expect(
      controller.navigate([{ scope: 'page', destination: 'final-page' }])
    ).resolves.toMatchObject({ status: 'completed', cursor: 1 })
  })
})
