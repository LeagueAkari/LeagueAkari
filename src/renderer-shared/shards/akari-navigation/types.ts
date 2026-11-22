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

export interface AkariNavigationOptions {
  readonly deadlineAt?: number
}

export interface AkariNavigation {
  navigate(
    path: AkariNavigationPath,
    options?: AkariNavigationOptions
  ): Promise<AkariNavigationResult>
}
