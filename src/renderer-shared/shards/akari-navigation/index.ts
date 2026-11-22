import { useInstance } from '@renderer-shared/shards'
import { AkariIpcRenderer } from '@renderer-shared/shards/ipc'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import {
  AKARI_NAVIGATION_MAIN_NAMESPACE,
  type AkariNavigationRequest
} from '@shared/shards/akari-navigation'
import { onActivated, onBeforeUnmount, onDeactivated, onMounted } from 'vue'

import { AKARI_NAVIGATION_RENDERER_NAMESPACE } from './context'
import { AkariNavigationController } from './navigation-controller'
import type { AkariNavigationActivationHandler, AkariNavigationStepRegistration } from './types'

@Shard(AkariNavigationRenderer.id)
export class AkariNavigationRenderer implements IAkariShardInitDispose {
  static id = AKARI_NAVIGATION_RENDERER_NAMESPACE

  readonly runtime: AkariNavigationController

  constructor(
    @Dep(LoggerRenderer) logger: LoggerRenderer,
    @Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer
  ) {
    this.runtime = new AkariNavigationController({
      namespace: AkariNavigationRenderer.id,
      logger
    })
  }

  requestNavigation(request: AkariNavigationRequest) {
    return this._ipc.call<void>(AKARI_NAVIGATION_MAIN_NAMESPACE, 'requestNavigation', request)
  }

  onNavigationRequest<TPayload = unknown>(
    handle: (request: AkariNavigationRequest<TPayload>) => void
  ) {
    return this._ipc.onEventVue(
      AKARI_NAVIGATION_MAIN_NAMESPACE,
      'navigation-requested',
      (request: AkariNavigationRequest<TPayload>) => {
        if (request.window === window.akariWindowType) {
          handle(request)
        }
      }
    )
  }

  async onDispose() {
    this.runtime.dispose()
  }
}

export function useAkariNavigationStep<TPayload = unknown>({
  key,
  activate
}: AkariNavigationStepRegistration<TPayload>) {
  const { runtime } = useInstance(AkariNavigationRenderer)
  let unregister: (() => void) | undefined

  const register = () => {
    unregister ??= runtime.register({ key, activate: activate as AkariNavigationActivationHandler })
  }

  const unregisterStep = () => {
    unregister?.()
    unregister = undefined
  }

  onMounted(register)
  onActivated(register)
  onDeactivated(unregisterStep)
  onBeforeUnmount(unregisterStep)
}

export * from './context'
export * from './types'
export { AkariNavigationController } from './navigation-controller'
