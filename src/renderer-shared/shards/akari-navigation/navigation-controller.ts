import {
  AKARI_NAVIGATION_DEFAULT_DEADLINE_MS,
  type AkariNavigationRendererContext
} from './context'
import type {
  AkariNavigationOptions,
  AkariNavigationPath,
  AkariNavigationResult,
  AkariNavigationStepRegistration
} from './types'

export class AkariNavigationController {
  private readonly _handlers = new Map<string, AkariNavigationStepRegistration>()
  private _waitingFor: {
    key: string
    resolve: (registration: AkariNavigationStepRegistration) => void
  } | null = null

  private _active: AbortController | null = null
  private _disposed = false

  constructor(
    private readonly _context: AkariNavigationRendererContext,
    private readonly _defaultDeadlineMs = AKARI_NAVIGATION_DEFAULT_DEADLINE_MS
  ) {}

  register(registration: AkariNavigationStepRegistration) {
    if (this._disposed) {
      throw new Error('Akari navigation controller is disposed')
    }

    if (this._handlers.has(registration.key)) {
      throw new Error(`Akari navigation step is already registered: ${registration.key}`)
    }

    this._handlers.set(registration.key, registration)

    if (this._waitingFor?.key === registration.key) {
      this._waitingFor.resolve(registration)
      this._waitingFor = null
    }

    return () => {
      if (this._handlers.get(registration.key) === registration) {
        this._handlers.delete(registration.key)
      }
    }
  }

  async navigate(
    path: AkariNavigationPath,
    { deadlineAt = Date.now() + this._defaultDeadlineMs }: AkariNavigationOptions = {}
  ): Promise<AkariNavigationResult> {
    if (this._disposed) {
      throw new Error('Akari navigation controller is disposed')
    }

    this._active?.abort('superseded')
    const controller = new AbortController()
    const { signal } = controller
    this._active = controller
    this._waitingFor = null

    const interrupted = Promise.withResolvers<never>()
    const onAbort = () => interrupted.reject(signal.reason)
    signal.addEventListener('abort', onAbort, { once: true })

    const timeout = setTimeout(() => controller.abort('timed-out'), deadlineAt - Date.now())
    const checkActive = () => {
      if (Date.now() >= deadlineAt) {
        controller.abort('timed-out')
      }

      signal.throwIfAborted()
    }

    let cursor = 0

    try {
      for (const step of path) {
        const registration = await Promise.race([this._waitForStep(step.key), interrupted.promise])
        checkActive()

        const activation = registration.activate(step.payload, { signal })
        const result = await Promise.race([activation, interrupted.promise])
        checkActive()

        if (result?.status === 'unavailable') {
          return { ...result, cursor, currentStep: step }
        }

        cursor++
      }

      return { status: 'completed', cursor }
    } catch (error) {
      const position = { cursor, currentStep: path[cursor] }

      if (signal.reason === 'timed-out') {
        void this._context.logger.warn(this._context.namespace, 'Navigation timed out', position)
        return { status: 'timed-out', ...position }
      }

      if (signal.aborted) {
        return { status: 'cancelled', ...position }
      }

      void this._context.logger.error(this._context.namespace, 'Navigation failed', position, error)
      return { status: 'failed', ...position, error }
    } finally {
      clearTimeout(timeout)
      signal.removeEventListener('abort', onAbort)

      if (this._active === controller) {
        this._active = null
        this._waitingFor = null
      }
    }
  }

  private _waitForStep(key: string) {
    const registration = this._handlers.get(key)

    if (registration) {
      return registration
    }

    return new Promise<AkariNavigationStepRegistration>((resolve) => {
      this._waitingFor = { key, resolve }
    })
  }

  dispose() {
    this._disposed = true
    this._active?.abort('disposed')
    this._handlers.clear()
  }
}
