import type { LcuEvent } from '@shared/types/league-client/event'
import { watch } from 'vue'

import {
  MAIN_SHARD_NAMESPACE,
  RENDERER_DEBUG_RENDERER_NAMESPACE,
  type RendererDebugRendererContext
} from './context'
import type { RendererDebugRuleManager } from './rule-manager'
import { useRendererDebugStore } from './store'

export class RendererDebugWatchers {
  constructor(
    private readonly context: RendererDebugRendererContext,
    private readonly ruleManager: RendererDebugRuleManager
  ) {}

  async init() {
    await this._restoreSavedRules()
    this._registerLcuEventDispatch()
    this._watchEnabledRulesCount()
    this._watchSavedRules()
  }

  private async _restoreSavedRules() {
    const savedRules = await this.context.settingUtils.get(
      RENDERER_DEBUG_RENDERER_NAMESPACE,
      'savedRules'
    )

    if (savedRules) {
      for (const rule of savedRules) {
        this.ruleManager.addRule(rule, false)
      }
    }
  }

  private _registerLcuEventDispatch() {
    this.context.ipc.onEvent(MAIN_SHARD_NAMESPACE, 'lc-event', (data: LcuEvent) => {
      this.context.matcher.emit(data.uri, data)
    })
  }

  private _watchEnabledRulesCount() {
    this.context.setupInAppScope.addSetupFn(() => {
      const store = useRendererDebugStore()

      watch(
        () => store.rules.filter((r) => r.enabled).length,
        (length) => {
          if (length) {
            this.context.logger.info(
              RENDERER_DEBUG_RENDERER_NAMESPACE,
              'send all native lcu events'
            )
            this.context.ipc.call(MAIN_SHARD_NAMESPACE, 'setSendAllNativeLcuEvents', true)
          } else {
            this.context.ipc.call(MAIN_SHARD_NAMESPACE, 'setSendAllNativeLcuEvents', false)
          }
        },
        { immediate: true }
      )
    })
  }

  private _watchSavedRules() {
    this.context.setupInAppScope.addSetupFn(() => {
      const store = useRendererDebugStore()

      watch(
        () => store.rules.map((r) => r.rule),
        (rules) => {
          this.context.settingUtils.set(RENDERER_DEBUG_RENDERER_NAMESPACE, 'savedRules', rules)
        }
      )
    })
  }
}
