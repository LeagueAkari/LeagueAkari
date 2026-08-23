import type { AkariManager } from '@shared/akari-shard'
import type {
  InGameSendCustomTemplateErrorStage,
  InGameSendCustomTemplateItem,
  InGameSendPresetTarget
} from '@shared/shards/in-game-send'
import { randomUUID } from 'node:crypto'
import vm from 'node:vm'

import type { InGameSendMainContext } from './context'

export const IN_GAME_SEND_CUSTOM_TEMPLATE_TIMEOUT_MS = 1000

export interface InGameSendCustomTemplateContext {
  readonly options: Readonly<{
    target: InGameSendPresetTarget
  }>
  readonly runtime: Readonly<{
    manager: AkariManager
  }>
}

export class InGameSendCustomTemplateExecutionError extends Error {
  constructor(
    readonly stage: InGameSendCustomTemplateErrorStage,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = 'InGameSendCustomTemplateExecutionError'
  }
}

interface CustomTemplateSandbox {
  getMessages?: unknown
  [key: string]: unknown
}

export class InGameSendCustomTemplateExecutor {
  constructor(
    private readonly _context: InGameSendMainContext,
    private readonly _timeoutMs = IN_GAME_SEND_CUSTOM_TEMPLATE_TIMEOUT_MS
  ) {}

  execute(item: InGameSendCustomTemplateItem, target: InGameSendPresetTarget) {
    const sandbox: CustomTemplateSandbox = {}
    const context = vm.createContext(sandbox, {
      name: `in-game-send-custom-template:${item.id}`,
      codeGeneration: {
        strings: true,
        wasm: false
      }
    })

    try {
      new vm.Script(item.code, {
        filename: `in-game-send-custom-template-${item.id}.js`
      }).runInContext(context, { timeout: this._timeoutMs })
    } catch (error) {
      throw new InGameSendCustomTemplateExecutionError('load', 'Failed to load template code', {
        cause: error
      })
    }

    this._assertGetMessages(sandbox)
    const templateContext = this._createTemplateContext(target)
    const invocationKey = `__leagueAkariTemplateInvocation_${randomUUID().replaceAll('-', '')}`
    sandbox[invocationKey] = { templateContext }

    let result: unknown
    try {
      result = new vm.Script(
        `getMessages(globalThis[${JSON.stringify(invocationKey)}].templateContext)`,
        {
          filename: `in-game-send-custom-template-${item.id}:invoke`
        }
      ).runInContext(context, { timeout: this._timeoutMs })
    } catch (error) {
      throw new InGameSendCustomTemplateExecutionError('execute', 'Template execution failed', {
        cause: error
      })
    } finally {
      delete sandbox[invocationKey]
    }

    if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
      throw new InGameSendCustomTemplateExecutionError(
        'result',
        'getMessages(ctx) must return string[] synchronously'
      )
    }

    if (!Array.isArray(result) || result.some((line) => typeof line !== 'string')) {
      throw new InGameSendCustomTemplateExecutionError(
        'result',
        'getMessages(ctx) must return string[]'
      )
    }

    return [...result].filter((line) => line.trim().length > 0)
  }

  private _assertGetMessages(sandbox: CustomTemplateSandbox) {
    if (typeof sandbox.getMessages !== 'function') {
      throw new InGameSendCustomTemplateExecutionError(
        'contract',
        'Template must define a top-level getMessages(ctx) function'
      )
    }
  }

  private _createTemplateContext(target: InGameSendPresetTarget): InGameSendCustomTemplateContext {
    return Object.freeze({
      options: Object.freeze({ target }),
      runtime: Object.freeze({
        manager: this._context.shared.manager
      })
    })
  }
}
