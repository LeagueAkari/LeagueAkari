import type { LoggerRenderer } from '@renderer-shared/shards/logger'
import { afterEach, describe, expect, test, vi } from 'vitest'

import type { AkariNavigationRendererContext } from './context'
import { AkariNavigationController } from './navigation-controller'
import type { AkariNavigationActivationHandler } from './useAkariNavigation'

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

function register(
  controller: AkariNavigationController,
  key: string,
  activate: AkariNavigationActivationHandler = () => undefined
) {
  return controller.register({ key, activate })
}

afterEach(() => {
  vi.useRealTimers()
})

describe('AkariNavigationController', () => {
  test('activates a path in order and advances only after each step is ready', async () => {
    const { controller } = createController()
    const calls: string[] = []

    register(controller, 'shell', (payload) => {
      calls.push(`shell:${String(payload)}`)
    })
    register(controller, 'page', async (payload) => {
      calls.push(`page:${String(payload)}:start`)
      await Promise.resolve()
      calls.push(`page:${String(payload)}:ready`)
    })
    register(controller, 'target', (payload) => {
      calls.push(`target:${String(payload)}`)
    })

    const result = await controller.navigate([
      { key: 'shell', payload: 'workspace' },
      { key: 'page', payload: 'basic' },
      { key: 'target', payload: 'item-id' }
    ])

    expect(result).toEqual({ status: 'completed', cursor: 3 })
    expect(calls).toEqual([
      'shell:workspace',
      'page:basic:start',
      'page:basic:ready',
      'target:item-id'
    ])
  })

  test('waits for a step that registers after its predecessor becomes ready', async () => {
    const { controller } = createController()

    register(controller, 'shell')
    const navigation = controller.navigate([
      { key: 'shell', payload: 'route' },
      { key: 'late-step', payload: 'tab' }
    ])
    await Promise.resolve()

    register(controller, 'late-step')

    await expect(navigation).resolves.toMatchObject({ status: 'completed', cursor: 2 })
  })

  test('does not invoke the next step before an asynchronous step is ready', async () => {
    const { controller } = createController()
    let finishStep: (() => void) | undefined
    const target = vi.fn()

    register(
      controller,
      'slow-step',
      () =>
        new Promise<void>((resolve) => {
          finishStep = resolve
        })
    )
    register(controller, 'target', target)

    const navigation = controller.navigate([
      { key: 'slow-step', payload: 'pane' },
      { key: 'target', payload: 'destination' }
    ])
    await Promise.resolve()
    expect(target).not.toHaveBeenCalled()

    finishStep?.()
    await expect(navigation).resolves.toMatchObject({ status: 'completed' })
    expect(target).toHaveBeenCalledOnce()
  })

  test('cancels the previous navigation when a newer request starts', async () => {
    const { controller } = createController()
    const secondStep = vi.fn()

    register(controller, 'second', secondStep)

    const firstNavigation = controller.navigate([{ key: 'missing', payload: 'first' }])
    await Promise.resolve()
    const secondNavigation = controller.navigate([{ key: 'second', payload: 'second' }])

    await expect(firstNavigation).resolves.toEqual({
      status: 'cancelled',
      cursor: 0,
      currentStep: { key: 'missing', payload: 'first' }
    })
    await expect(secondNavigation).resolves.toMatchObject({ status: 'completed', cursor: 1 })
    expect(secondStep).toHaveBeenCalledOnce()
  })

  test('does not activate a resolved step after the navigation is superseded', async () => {
    const { controller } = createController()
    const staleStep = vi.fn()

    const firstNavigation = controller.navigate([{ key: 'late-step' }])
    register(controller, 'late-step', staleStep)
    const secondNavigation = controller.navigate([])

    await expect(firstNavigation).resolves.toMatchObject({ status: 'cancelled', cursor: 0 })
    await expect(secondNavigation).resolves.toMatchObject({ status: 'completed', cursor: 0 })
    expect(staleStep).not.toHaveBeenCalled()
  })

  test('reports the current step when the shared deadline expires', async () => {
    vi.useFakeTimers()
    const { controller, logger } = createController(100)

    const navigation = controller.navigate([{ key: 'missing', payload: 'target' }])
    await vi.advanceTimersByTimeAsync(101)

    await expect(navigation).resolves.toMatchObject({
      status: 'timed-out',
      cursor: 0,
      currentStep: { key: 'missing', payload: 'target' }
    })
    expect(logger.warn).toHaveBeenCalledOnce()

    expect(() => register(controller, 'missing')).not.toThrow()
  })

  test('rejects duplicate handlers for the same key', () => {
    const { controller } = createController()

    register(controller, 'same')
    expect(() => register(controller, 'same')).toThrow(
      'Akari navigation step is already registered: same'
    )
  })

  test('does not advance the cursor when a step is unavailable', async () => {
    const { controller } = createController()

    register(controller, 'terminal', () => ({ status: 'unavailable', reason: 'hidden' }))

    await expect(
      controller.navigate([{ key: 'terminal', payload: 'hidden-target' }])
    ).resolves.toEqual({
      status: 'unavailable',
      cursor: 0,
      currentStep: { key: 'terminal', payload: 'hidden-target' },
      reason: 'hidden'
    })
  })

  test('does not advance the cursor when activation fails', async () => {
    const { controller, logger } = createController()

    const error = new Error('failed activation')
    register(controller, 'failing', () => {
      throw error
    })

    await expect(controller.navigate([{ key: 'failing', payload: 'target' }])).resolves.toEqual({
      status: 'failed',
      cursor: 0,
      currentStep: { key: 'failing', payload: 'target' },
      error
    })
    expect(logger.error).toHaveBeenCalledOnce()
  })

  test('allows any registered step to be the final step', async () => {
    const { controller } = createController()

    register(controller, 'page')

    await expect(
      controller.navigate([{ key: 'page', payload: 'final-page' }])
    ).resolves.toMatchObject({ status: 'completed', cursor: 1 })
  })
})
