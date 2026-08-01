import {
  type InjectionKey,
  inject,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  provide
} from 'vue'

export interface AkariNavigationStep<TPayload = unknown> {
  readonly key: string
  readonly payload?: TPayload
}

export type AkariNavigationPath = readonly Readonly<AkariNavigationStep>[]

export interface AkariNavigationActivationContext {
  readonly signal: AbortSignal
}

export type AkariNavigationActivationResult = void | {
  readonly status: 'unavailable'
  readonly reason?: string
}

export type AkariNavigationActivationHandler<TPayload = unknown> = (
  payload: TPayload,
  context: AkariNavigationActivationContext
) => AkariNavigationActivationResult | Promise<AkariNavigationActivationResult>

export interface AkariNavigationStepRegistration<TPayload = unknown> {
  readonly key: string
  readonly activate: AkariNavigationActivationHandler<TPayload>
}

export type AkariNavigationResult =
  | {
      readonly status: 'completed'
      readonly cursor: number
    }
  | {
      readonly status: 'unavailable'
      readonly cursor: number
      readonly currentStep: Readonly<AkariNavigationStep>
      readonly reason?: string
    }
  | {
      readonly status: 'failed'
      readonly cursor: number
      readonly currentStep: Readonly<AkariNavigationStep>
      readonly error: unknown
    }
  | {
      readonly status: 'cancelled'
      readonly cursor: number
      readonly currentStep: Readonly<AkariNavigationStep>
    }
  | {
      readonly status: 'timed-out'
      readonly cursor: number
      readonly currentStep: Readonly<AkariNavigationStep>
    }

export type AkariNavigationResultStatus = AkariNavigationResult['status']

export interface AkariNavigationOptions {
  readonly deadlineAt?: number
}

export interface AkariNavigation {
  navigate(
    path: AkariNavigationPath,
    options?: AkariNavigationOptions
  ): Promise<AkariNavigationResult>
}

export interface AkariNavigationRuntime extends AkariNavigation {
  register(registration: AkariNavigationStepRegistration): () => void
}

export interface UseAkariNavigationStepOptions<TPayload = unknown> {
  readonly key: string
  readonly activate: AkariNavigationActivationHandler<TPayload>
}

const AkariNavigationRuntimeKey: InjectionKey<AkariNavigationRuntime> =
  Symbol('AkariNavigationRuntime')

/** @internal Used by the root provider component. */
export function provideAkariNavigationRuntime(runtime: AkariNavigationRuntime) {
  provide(AkariNavigationRuntimeKey, runtime)
}

function injectAkariNavigationRuntime() {
  const runtime = inject(AkariNavigationRuntimeKey)

  if (!runtime) {
    throw new Error('Akari navigation must be used within AkariNavigationProvider')
  }

  return runtime
}

export function useAkariNavigation(): AkariNavigation {
  return injectAkariNavigationRuntime()
}

export function useAkariNavigationStep<TPayload = unknown>(
  options: UseAkariNavigationStepOptions<TPayload>
) {
  const runtime = injectAkariNavigationRuntime()
  const registration: AkariNavigationStepRegistration = {
    key: options.key,
    activate: options.activate as AkariNavigationActivationHandler
  }
  let unregister: (() => void) | null = null

  const register = () => {
    if (unregister) {
      return
    }

    unregister = runtime.register(registration)
  }

  const removeRegistration = () => {
    unregister?.()
    unregister = null
  }

  onMounted(register)
  onActivated(register)
  onDeactivated(removeRegistration)
  onBeforeUnmount(removeRegistration)
}
