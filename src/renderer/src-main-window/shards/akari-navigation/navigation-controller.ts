import type {
  AkariNavigationContext,
  AkariNavigationOptions,
  AkariNavigationOutlet,
  AkariNavigationPath,
  AkariNavigationRegistration,
  AkariNavigationResult,
  AkariNavigationResultStatus,
  AkariNavigationStep
} from '@renderer-shared/composables/useAkariNavigation'

import {
  AKARI_NAVIGATION_DEFAULT_DEADLINE_MS,
  type AkariNavigationRendererContext
} from './context'

const ANY_DESTINATION = Symbol('any-navigation-destination')

interface NavigationOutletState {
  registrations: Map<string, Map<unknown, AkariNavigationRegistration>>
  waiters: Set<() => void>
}

interface NavigationExecution {
  id: number
  path: AkariNavigationPath
  cursor: number
  deadlineAt: number
  abortController: AbortController
}

class NavigationExecutionInterrupted extends Error {
  constructor(
    readonly status: Extract<AkariNavigationResultStatus, 'cancelled' | 'timed-out'>,
    message: string
  ) {
    super(message)
  }
}

function freezePath(path: AkariNavigationPath): AkariNavigationPath {
  return Object.freeze(path.map((step) => Object.freeze({ ...step })))
}

export class AkariNavigationController {
  readonly rootOutlet: AkariNavigationOutlet
  readonly context: AkariNavigationContext

  private readonly _outlets = new Map<AkariNavigationOutlet, NavigationOutletState>()
  private _activeExecution: NavigationExecution | null = null
  private _nextExecutionId = 0
  private _disposed = false

  constructor(
    private readonly _context: AkariNavigationRendererContext,
    private readonly _defaultDeadlineMs = AKARI_NAVIGATION_DEFAULT_DEADLINE_MS
  ) {
    this.rootOutlet = this._createOutlet()
    this.context = {
      rootOutlet: this.rootOutlet,
      createOutlet: () => this._createOutlet(),
      register: (outlet, registration) => this.register(outlet, registration),
      navigate: (path, options) => this.navigate(path, options)
    }
  }

  register(outlet: AkariNavigationOutlet, registration: AkariNavigationRegistration) {
    if (this._disposed) {
      throw new Error('Akari navigation controller is disposed')
    }

    const outletState = this._outlets.get(outlet)
    if (!outletState) {
      throw new Error('Unknown Akari navigation outlet')
    }

    const registrationsForScope = outletState.registrations.get(registration.scope) ?? new Map()
    const destinationKey = registration.match === 'any' ? ANY_DESTINATION : registration.destination

    if (registrationsForScope.has(destinationKey)) {
      const destinationDescription =
        registration.match === 'any' ? '*' : String(registration.destination)
      throw new Error(
        `Akari navigation handler is already registered: ${registration.scope}/${destinationDescription}`
      )
    }

    registrationsForScope.set(destinationKey, registration)
    outletState.registrations.set(registration.scope, registrationsForScope)
    for (const notify of outletState.waiters) {
      notify()
    }

    return () => {
      if (registrationsForScope.get(destinationKey) !== registration) {
        return
      }

      registrationsForScope.delete(destinationKey)
      if (registrationsForScope.size === 0) {
        outletState.registrations.delete(registration.scope)
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
      id: ++this._nextExecutionId,
      path: freezePath(path),
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
    this._outlets.clear()
  }

  private _createOutlet() {
    const outlet = Symbol('akari-navigation-outlet')
    this._outlets.set(outlet, {
      registrations: new Map(),
      waiters: new Set()
    })
    return outlet
  }

  private async _execute(execution: NavigationExecution): Promise<AkariNavigationResult> {
    let outlet = this.rootOutlet

    try {
      while (execution.cursor < execution.path.length) {
        this._throwIfInterrupted(execution)

        const step = execution.path[execution.cursor]
        const registration = await this._resolveRegistration(outlet, step, execution)
        if (!registration) {
          return this._createResult(execution, 'unavailable', 'handler-unavailable')
        }

        const activationResult = await this._runActivation(registration, step, execution)
        this._throwIfInterrupted(execution)

        if (activationResult?.status === 'unavailable') {
          return this._createResult(
            execution,
            'unavailable',
            activationResult.reason ?? 'destination-unavailable'
          )
        }

        execution.cursor += 1
        if (execution.cursor < execution.path.length) {
          if (!registration.childOutlet) {
            return this._createResult(execution, 'failed', 'missing-child-outlet')
          }
          outlet = registration.childOutlet
        }
      }

      return this._createResult(execution, 'completed')
    } catch (error) {
      if (error instanceof NavigationExecutionInterrupted) {
        if (error.status === 'timed-out') {
          execution.abortController.abort('timed-out')
          void this._context.logger.warn(
            this._context.namespace,
            'Navigation timed out',
            this._createResult(execution, error.status, error.message)
          )
        }
        return this._createResult(execution, error.status, error.message)
      }

      void this._context.logger.error(
        this._context.namespace,
        'Navigation failed',
        this._createResult(execution, 'failed'),
        error
      )
      return {
        ...this._createResult(execution, 'failed', 'activation-failed'),
        error
      }
    }
  }

  private _findRegistration(outlet: AkariNavigationOutlet, step: AkariNavigationStep) {
    const registrationsForScope = this._outlets.get(outlet)?.registrations.get(step.scope)
    return (
      registrationsForScope?.get(step.destination) ?? registrationsForScope?.get(ANY_DESTINATION)
    )
  }

  private async _resolveRegistration(
    outlet: AkariNavigationOutlet,
    step: AkariNavigationStep,
    execution: NavigationExecution
  ) {
    const existingRegistration = this._findRegistration(outlet, step)
    if (existingRegistration || step.waitForRegistration === false) {
      return existingRegistration ?? null
    }

    const outletState = this._outlets.get(outlet)
    if (!outletState) {
      return null
    }

    return await new Promise<AkariNavigationRegistration>((resolve, reject) => {
      let timeout: ReturnType<typeof setTimeout> | null = null

      const cleanup = () => {
        outletState.waiters.delete(checkRegistration)
        execution.abortController.signal.removeEventListener('abort', handleAbort)
        if (timeout) {
          clearTimeout(timeout)
        }
      }
      const finish = (registration: AkariNavigationRegistration) => {
        cleanup()
        resolve(registration)
      }
      const checkRegistration = () => {
        const registration = this._findRegistration(outlet, step)
        if (registration) {
          finish(registration)
        }
      }
      const handleAbort = () => {
        cleanup()
        reject(new NavigationExecutionInterrupted('cancelled', 'navigation-cancelled'))
      }

      const remainingMs = execution.deadlineAt - Date.now()
      if (remainingMs <= 0) {
        reject(new NavigationExecutionInterrupted('timed-out', 'navigation-deadline-exceeded'))
        return
      }

      outletState.waiters.add(checkRegistration)
      execution.abortController.signal.addEventListener('abort', handleAbort, { once: true })
      if (execution.abortController.signal.aborted) {
        handleAbort()
        return
      }
      timeout = setTimeout(() => {
        cleanup()
        reject(new NavigationExecutionInterrupted('timed-out', 'navigation-deadline-exceeded'))
      }, remainingMs)
      checkRegistration()
    })
  }

  private async _runActivation(
    registration: AkariNavigationRegistration,
    step: AkariNavigationStep,
    execution: NavigationExecution
  ) {
    const activation = Promise.resolve(
      registration.activate(step.destination, {
        executionId: execution.id,
        cursor: execution.cursor,
        deadlineAt: execution.deadlineAt,
        signal: execution.abortController.signal
      })
    )

    return await this._raceWithExecution(activation, execution)
  }

  private async _raceWithExecution<T>(promise: Promise<T>, execution: NavigationExecution) {
    return await new Promise<T>((resolve, reject) => {
      let timeout: ReturnType<typeof setTimeout> | null = null

      const cleanup = () => {
        execution.abortController.signal.removeEventListener('abort', handleAbort)
        if (timeout) {
          clearTimeout(timeout)
        }
      }
      const handleAbort = () => {
        cleanup()
        reject(new NavigationExecutionInterrupted('cancelled', 'navigation-cancelled'))
      }

      const remainingMs = execution.deadlineAt - Date.now()
      if (remainingMs <= 0) {
        reject(new NavigationExecutionInterrupted('timed-out', 'navigation-deadline-exceeded'))
        return
      }

      execution.abortController.signal.addEventListener('abort', handleAbort, { once: true })
      if (execution.abortController.signal.aborted) {
        handleAbort()
        return
      }
      timeout = setTimeout(() => {
        cleanup()
        reject(new NavigationExecutionInterrupted('timed-out', 'navigation-deadline-exceeded'))
      }, remainingMs)

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
      throw new NavigationExecutionInterrupted('cancelled', 'navigation-cancelled')
    }
    if (Date.now() >= execution.deadlineAt) {
      throw new NavigationExecutionInterrupted('timed-out', 'navigation-deadline-exceeded')
    }
  }

  private _createResult(
    execution: NavigationExecution,
    status: AkariNavigationResultStatus,
    reason?: string
  ): AkariNavigationResult {
    return {
      status,
      executionId: execution.id,
      cursor: execution.cursor,
      currentStep: execution.path[execution.cursor],
      reason
    }
  }
}
