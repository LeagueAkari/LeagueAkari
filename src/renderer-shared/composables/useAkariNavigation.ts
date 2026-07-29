import {
  type InjectionKey,
  type MaybeRefOrGetter,
  inject,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  provide,
  ref,
  toValue,
  watchEffect
} from 'vue'

export type AkariNavigationOutlet = symbol

export interface AkariNavigationStep {
  readonly scope: string
  readonly destination: unknown
  readonly waitForRegistration?: boolean
}

export type AkariNavigationPath = readonly Readonly<AkariNavigationStep>[]

export interface AkariNavigationActivationContext {
  readonly executionId: number
  readonly cursor: number
  readonly deadlineAt: number
  readonly signal: AbortSignal
}

export type AkariNavigationActivationResult =
  { readonly status: 'ready' } | { readonly status: 'unavailable'; readonly reason?: string }

export type AkariNavigationActivationHandler = (
  destination: unknown,
  context: AkariNavigationActivationContext
) => void | AkariNavigationActivationResult | Promise<void | AkariNavigationActivationResult>

export type AkariNavigationRegistration = {
  readonly scope: string
  readonly activate: AkariNavigationActivationHandler
  readonly childOutlet?: AkariNavigationOutlet
} & ({ readonly match: 'any' } | { readonly match: 'destination'; readonly destination: unknown })

export type AkariNavigationResultStatus =
  'completed' | 'unavailable' | 'failed' | 'cancelled' | 'timed-out'

export interface AkariNavigationResult {
  readonly status: AkariNavigationResultStatus
  readonly executionId: number
  readonly cursor: number
  readonly currentStep?: Readonly<AkariNavigationStep>
  readonly reason?: string
  readonly error?: unknown
}

export interface AkariNavigationOptions {
  readonly deadlineAt?: number
}

export interface AkariNavigationContext {
  readonly rootOutlet: AkariNavigationOutlet
  createOutlet(): AkariNavigationOutlet
  register(outlet: AkariNavigationOutlet, registration: AkariNavigationRegistration): () => void
  navigate(
    path: AkariNavigationPath,
    options?: AkariNavigationOptions
  ): Promise<AkariNavigationResult>
}

interface AkariNavigationBoundaryOptions {
  scope: MaybeRefOrGetter<string>
  activate: AkariNavigationActivationHandler
  context?: AkariNavigationContext
  parentOutlet?: AkariNavigationOutlet
}

interface AkariNavigationTargetOptions {
  scope: MaybeRefOrGetter<string>
  destination: MaybeRefOrGetter<unknown>
  enabled?: MaybeRefOrGetter<boolean>
  activate: AkariNavigationActivationHandler
}

const AkariNavigationContextKey: InjectionKey<AkariNavigationContext> =
  Symbol('AkariNavigationContext')
const AkariNavigationOutletKey: InjectionKey<AkariNavigationOutlet> =
  Symbol('AkariNavigationOutlet')

export function provideAkariNavigation(
  context: AkariNavigationContext,
  outlet: AkariNavigationOutlet = context.rootOutlet
) {
  provide(AkariNavigationContextKey, context)
  provide(AkariNavigationOutletKey, outlet)
}

export function useAkariNavigation() {
  const context = inject(AkariNavigationContextKey)

  if (!context) {
    throw new Error('useAkariNavigation must be used within an Akari navigation provider')
  }

  return context
}

export function useOptionalAkariNavigation() {
  return inject(AkariNavigationContextKey, null)
}

function useAkariNavigationRegistration(
  createRegistration: () => AkariNavigationRegistration | null,
  outlet: AkariNavigationOutlet | null,
  context: AkariNavigationContext | null
) {
  const active = ref(false)

  onMounted(() => {
    active.value = true
  })
  onActivated(() => {
    active.value = true
  })
  onDeactivated(() => {
    active.value = false
  })
  onBeforeUnmount(() => {
    active.value = false
  })

  watchEffect(
    (onCleanup) => {
      if (!active.value || !outlet || !context) {
        return
      }

      const registration = createRegistration()
      if (!registration) {
        return
      }

      const unregister = context.register(outlet, registration)
      onCleanup(unregister)
    },
    { flush: 'sync' }
  )
}

export function useAkariNavigationBoundary(options: AkariNavigationBoundaryOptions) {
  const context = options.context ?? useOptionalAkariNavigation()
  const parentOutlet =
    options.parentOutlet ?? inject(AkariNavigationOutletKey, null) ?? context?.rootOutlet ?? null
  const childOutlet = context?.createOutlet() ?? null

  if (childOutlet) {
    provide(AkariNavigationOutletKey, childOutlet)
  }

  useAkariNavigationRegistration(
    () => ({
      scope: toValue(options.scope),
      match: 'any',
      activate: options.activate,
      childOutlet: childOutlet ?? undefined
    }),
    parentOutlet,
    context
  )

  return { childOutlet }
}

export function useAkariNavigationTarget(options: AkariNavigationTargetOptions) {
  const context = useOptionalAkariNavigation()
  const outlet = inject(AkariNavigationOutletKey, null)

  useAkariNavigationRegistration(
    () => {
      if (options.enabled !== undefined && !toValue(options.enabled)) {
        return null
      }

      return {
        scope: toValue(options.scope),
        match: 'destination',
        destination: toValue(options.destination),
        activate: options.activate
      }
    },
    outlet,
    context
  )
}
