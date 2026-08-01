import {
  AKARI_NAVIGATION_DEFAULT_DEADLINE_MS,
  type AkariNavigationRendererContext
} from './context'
import type {
  AkariNavigationActivationResult,
  AkariNavigationOptions,
  AkariNavigationPath,
  AkariNavigationResult,
  AkariNavigationResultStatus,
  AkariNavigationRuntime,
  AkariNavigationStep,
  AkariNavigationStepRegistration
} from './useAkariNavigation'

interface NavigationExecution {
  path: AkariNavigationPath
  cursor: number
  deadlineAt: number
  abortController: AbortController
}

class NavigationExecutionInterrupted extends Error {
  constructor(readonly status: Extract<AkariNavigationResultStatus, 'cancelled' | 'timed-out'>) {
    super(status)
  }
}

export class AkariNavigationController implements AkariNavigationRuntime {
  private readonly _handlers = new Map<string, AkariNavigationStepRegistration>()
  private _handlerWaiter: (() => void) | null = null
  private _activeExecution: NavigationExecution | null = null
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
    this._handlerWaiter?.()

    return () => {
      if (this._handlers.get(registration.key) === registration) {
        this._handlers.delete(registration.key)
      }
    }
  }

  async navigate(path: AkariNavigationPath, options: AkariNavigationOptions = {}) {
    if (this._disposed) {
      throw new Error('Akari navigation controller is disposed')
    }

    this._activeExecution?.abortController.abort('superseded')

    const startedAt = Date.now()
    const execution: NavigationExecution = {
      path,
      cursor: 0,
      deadlineAt: options.deadlineAt ?? startedAt + this._defaultDeadlineMs,
      abortController: new AbortController()
    }
    this._activeExecution = execution

    try {
      return await this._execute(execution)
    } finally {
      if (this._activeExecution === execution) {
        this._activeExecution = null
      }
    }
  }

  dispose() {
    if (this._disposed) {
      return
    }

    this._disposed = true
    this._activeExecution?.abortController.abort('disposed')
    this._activeExecution = null
    this._handlers.clear()
  }

  private async _execute(execution: NavigationExecution): Promise<AkariNavigationResult> {
    try {
      while (execution.cursor < execution.path.length) {
        this._throwIfInterrupted(execution)

        const step = execution.path[execution.cursor]
        const registration = await this._waitForHandler(step, execution)
        this._throwIfInterrupted(execution)
        const activationResult = await this._runActivation(registration, step, execution)
        this._throwIfInterrupted(execution)

        if (activationResult?.status === 'unavailable') {
          return {
            status: 'unavailable',
            cursor: execution.cursor,
            currentStep: step,
            reason: activationResult.reason
          }
        }

        execution.cursor += 1
      }

      return {
        status: 'completed',
        cursor: execution.cursor
      }
    } catch (error) {
      if (error instanceof NavigationExecutionInterrupted) {
        if (error.status === 'timed-out') {
          execution.abortController.abort('timed-out')
          const result: AkariNavigationResult = {
            status: 'timed-out',
            cursor: execution.cursor,
            currentStep: execution.path[execution.cursor]
          }
          void this._context.logger.warn(this._context.namespace, 'Navigation timed out', result)
          return result
        }

        return {
          status: 'cancelled',
          cursor: execution.cursor,
          currentStep: execution.path[execution.cursor]
        }
      }

      const result: AkariNavigationResult = {
        status: 'failed',
        cursor: execution.cursor,
        currentStep: execution.path[execution.cursor],
        error
      }
      void this._context.logger.error(
        this._context.namespace,
        'Navigation failed',
        {
          cursor: result.cursor,
          currentStep: result.currentStep
        },
        error
      )
      return result
    }
  }

  private _waitForHandler(step: Readonly<AkariNavigationStep>, execution: NavigationExecution) {
    const existingHandler = this._handlers.get(step.key)
    if (existingHandler) {
      return existingHandler
    }

    return new Promise<AkariNavigationStepRegistration>((resolve, reject) => {
      let timeout: ReturnType<typeof setTimeout>

      const cleanup = () => {
        this._handlerWaiter = null
        execution.abortController.signal.removeEventListener('abort', handleAbort)
        clearTimeout(timeout)
      }
      const checkHandler = () => {
        const handler = this._handlers.get(step.key)
        if (handler) {
          cleanup()
          resolve(handler)
        }
      }
      const handleAbort = () => {
        cleanup()
        reject(new NavigationExecutionInterrupted('cancelled'))
      }

      const remainingMs = execution.deadlineAt - Date.now()
      if (remainingMs <= 0) {
        reject(new NavigationExecutionInterrupted('timed-out'))
        return
      }

      timeout = setTimeout(() => {
        cleanup()
        reject(new NavigationExecutionInterrupted('timed-out'))
      }, remainingMs)
      this._handlerWaiter = checkHandler
      execution.abortController.signal.addEventListener('abort', handleAbort, { once: true })
    })
  }

  private _runActivation(
    registration: AkariNavigationStepRegistration,
    step: Readonly<AkariNavigationStep>,
    execution: NavigationExecution
  ) {
    const activation = Promise.resolve(
      registration.activate(step.payload, {
        signal: execution.abortController.signal
      })
    )

    return this._raceWithExecution(activation, execution)
  }

  private _raceWithExecution(
    promise: Promise<AkariNavigationActivationResult>,
    execution: NavigationExecution
  ) {
    return new Promise<AkariNavigationActivationResult>((resolve, reject) => {
      let timeout: ReturnType<typeof setTimeout>

      const cleanup = () => {
        execution.abortController.signal.removeEventListener('abort', handleAbort)
        clearTimeout(timeout)
      }
      const handleAbort = () => {
        cleanup()
        reject(new NavigationExecutionInterrupted('cancelled'))
      }

      const remainingMs = execution.deadlineAt - Date.now()
      if (remainingMs <= 0) {
        reject(new NavigationExecutionInterrupted('timed-out'))
        return
      }

      timeout = setTimeout(() => {
        cleanup()
        reject(new NavigationExecutionInterrupted('timed-out'))
      }, remainingMs)
      execution.abortController.signal.addEventListener('abort', handleAbort, { once: true })
      if (execution.abortController.signal.aborted) {
        handleAbort()
        return
      }

      promise.then(
        (value) => {
          cleanup()
          resolve(value)
        },
        (error) => {
          cleanup()
          reject(error)
        }
      )
    })
  }

  private _throwIfInterrupted(execution: NavigationExecution) {
    if (execution.abortController.signal.aborted) {
      throw new NavigationExecutionInterrupted('cancelled')
    }
    if (Date.now() >= execution.deadlineAt) {
      throw new NavigationExecutionInterrupted('timed-out')
    }
  }
}
