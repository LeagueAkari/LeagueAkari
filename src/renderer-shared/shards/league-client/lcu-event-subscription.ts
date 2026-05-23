import type { LcuEvent } from '@shared/types/league-client/event'
import { getCurrentScope, onScopeDispose } from 'vue'

import {
  type LeagueClientRendererContext,
  MAIN_SHARD_NAMESPACE,
  type SubscribedLcuEvent
} from './context'

export class LeagueClientLcuEventSubscription {
  constructor(private readonly context: LeagueClientRendererContext) {}

  registerDispatch() {
    this.context.ipc.onEvent(
      MAIN_SHARD_NAMESPACE,
      'extra-lcu-event',
      (subId: string, event: LcuEvent, params) => {
        this.context.emitter.emit(subId, { event, params })
      }
    )
  }

  onLcuEventVue<T = any, P = Record<string, any>>(
    uri: string,
    listener: (data: LcuEvent<T>, params: P) => void
  ) {
    let disposed = false
    let unsubscribeFn: (() => Promise<boolean>) | null = null
    let offFn: (() => void) | null = null

    this._internalSubscribe(uri).then(({ subId, unsubscribe }) => {
      if (disposed) {
        unsubscribe()
        return
      }

      unsubscribeFn = unsubscribe
      offFn = this.context.emitter.on(subId, ({ event, params }: SubscribedLcuEvent<T, P>) =>
        listener(event, params)
      )
    })

    const dispose = () => {
      if (disposed) {
        return
      }

      if (offFn) {
        offFn()
      }

      if (unsubscribeFn) {
        unsubscribeFn().catch(console.error)
      }

      disposed = true
    }

    getCurrentScope() && onScopeDispose(() => dispose())
    return dispose
  }

  private async _internalSubscribe(uri: string) {
    const subId = await this.context.ipc.call<string>(
      MAIN_SHARD_NAMESPACE,
      'subscribeLcuEndpoint',
      uri
    )

    return {
      subId,
      unsubscribe: () => {
        return this.context.ipc.call<boolean>(MAIN_SHARD_NAMESPACE, 'unsubscribeLcuEndpoint', subId)
      }
    }
  }
}
