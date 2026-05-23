import _ from 'lodash'
import { markRaw } from 'vue'

import { PINIA_MOBX_UTILS_MAIN_NAMESPACE, type PiniaMobxUtilsRendererContext } from './context'

interface PropConfig {
  raw: boolean
}

export class PiniaStateSync {
  constructor(private readonly _context: PiniaMobxUtilsRendererContext) {}

  async sync(namespace: string, stateId: string, store: any) {
    this._context.ipc.onEvent(
      PINIA_MOBX_UTILS_MAIN_NAMESPACE,
      `update-state-prop/${namespace}:${stateId}`,
      (path, value, { action, raw }) => {
        if (action === 'update' || action === 'create') {
          _.set(store, path, _.isObject(value) ? (raw ? markRaw(value) : value) : value)
        } else if (action === 'delete') {
          _.unset(store, path)
        }
      }
    )

    const initial: Record<string, { value: any; config: PropConfig }> =
      await this._context.ipc.call(
        PINIA_MOBX_UTILS_MAIN_NAMESPACE,
        'subscribeAndGetInitialState',
        namespace,
        stateId
      )

    Object.entries(initial).forEach(([key, { value, config }]) => {
      _.set(store, key, _.isObject(value) ? (config.raw ? markRaw(value) : value) : value)
    })
  }
}
