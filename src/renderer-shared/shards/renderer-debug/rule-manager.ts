import type { RendererDebugRendererContext } from './context'
import { useRendererDebugStore } from './store'

export class RendererDebugRuleManager {
  constructor(private readonly context: RendererDebugRendererContext) {}

  addRule(rule: string, enabled = true) {
    const store = useRendererDebugStore()

    if (store.rules.some((r) => r.rule === rule)) {
      return
    }

    rule = this._sanitizeRule(rule)

    let stopFn: (() => void) | null = null
    if (enabled) {
      stopFn = this._watchRule(rule)
    }

    store.rules.push({ rule, stopFn, enabled })
  }

  enableRule(rule: string) {
    const store = useRendererDebugStore()

    const ruleO = store.rules.find((r) => r.rule === rule)

    if (!ruleO) {
      return
    }

    ruleO.stopFn?.()
    ruleO.enabled = true
    ruleO.stopFn = this._watchRule(rule)
  }

  disableRule(rule: string) {
    const store = useRendererDebugStore()

    const ruleO = store.rules.find((r) => r.rule === rule)

    if (!ruleO) {
      return
    }

    ruleO.enabled = false
    ruleO.stopFn?.()
    ruleO.stopFn = null
  }

  removeRule(rule: string) {
    const store = useRendererDebugStore()

    const i = store.rules.findIndex((r) => r.rule === rule)

    if (i === -1) {
      return
    }

    store.rules[i].stopFn?.()
    store.rules.splice(i, 1)
  }

  private _watchRule(rule: string) {
    const store = useRendererDebugStore()

    return this.context.matcher.on(rule, (data) => {
      if (store.logAllLcuEvents) {
        this.context.logger.info(data.uri, data.eventType, data.data)
      } else {
        this.context.logger.infoRenderer(data.uri, data.eventType, data.data)
      }
    })
  }

  private _sanitizeRule(rule: string) {
    return rule
      .replace(/\/+$/, '') // 去除结尾的斜杠
      .replace(/^([^/])/, '/$1') // 补足前面的斜杠
      .replace(/\/{2,}/g, '/')
  }
}
