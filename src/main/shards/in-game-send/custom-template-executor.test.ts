import {
  IN_GAME_SEND_CUSTOM_TEMPLATE_DEFAULT_CODE,
  type InGameSendCustomTemplateItem
} from '@shared/shards/in-game-send'
import { describe, expect, it } from 'vitest'

import {
  InGameSendCustomTemplateExecutionError,
  InGameSendCustomTemplateExecutor
} from './custom-template-executor'

function createTemplate(code: string): InGameSendCustomTemplateItem {
  return {
    id: 'template-id',
    title: 'Template',
    code,
    targetShortcuts: {
      friendly: null,
      enemy: null,
      all: null
    }
  }
}

function createExecutor(timeoutMs = 100) {
  const manager = {
    marker: 'manager-reference',
    getInstance: (id: string) => ({ id })
  }
  const context = {
    shared: {
      manager
    }
  } as any

  return {
    manager,
    executor: new InGameSendCustomTemplateExecutor(context, timeoutMs)
  }
}

async function expectStage(
  run: () => unknown,
  stage: InGameSendCustomTemplateExecutionError['stage']
) {
  try {
    run()
  } catch (error) {
    expect(error).toBeInstanceOf(InGameSendCustomTemplateExecutionError)
    expect((error as InGameSendCustomTemplateExecutionError).stage).toBe(stage)
    return
  }

  throw new Error('Expected custom template execution to fail')
}

describe('InGameSendCustomTemplateExecutor', () => {
  it('runs the default template contract', () => {
    const { executor } = createExecutor()

    expect(
      executor.execute(createTemplate(IN_GAME_SEND_CUSTOM_TEMPLATE_DEFAULT_CODE), 'all')
    ).toEqual([])
  })

  it('exposes only options and runtime at the top level', () => {
    const { executor, manager } = createExecutor()
    const result = executor.execute(
      createTemplate(`
        function getMessages(ctx) {
          return [
            ...Object.keys(ctx).sort(),
            ctx.options.target,
            String(ctx.runtime.manager.marker),
            String(ctx.runtime.manager === globalThis["missing"]),
            typeof ctx.target,
            typeof ctx.manager,
            typeof module,
            typeof exports,
            typeof require,
            typeof process,
            typeof Buffer,
            typeof setTimeout
          ]
        }
      `),
      'enemy'
    )

    expect(manager.marker).toBe('manager-reference')
    expect(result).toEqual([
      'options',
      'runtime',
      'enemy',
      'manager-reference',
      'false',
      'undefined',
      'undefined',
      'undefined',
      'undefined',
      'undefined',
      'undefined',
      'undefined',
      'undefined'
    ])
  })

  it('passes the live manager reference', () => {
    const { executor } = createExecutor()

    expect(
      executor.execute(
        createTemplate(`
          function getMessages(ctx) {
            return [ctx.runtime.manager.getInstance('test-main').id]
          }
        `),
        'friendly'
      )
    ).toEqual(['test-main'])
  })

  it('creates a fresh vm context for every execution', () => {
    const { executor } = createExecutor()
    const template = createTemplate(`
      globalThis.executionCount = (globalThis.executionCount || 0) + 1
      function getMessages() {
        return [String(globalThis.executionCount)]
      }
    `)

    expect(executor.execute(template, 'all')).toEqual(['1'])
    expect(executor.execute(template, 'all')).toEqual(['1'])
  })

  it('filters blank lines from valid output', () => {
    const { executor } = createExecutor()

    expect(
      executor.execute(
        createTemplate(`function getMessages() { return ['one', '', '  ', ' two '] }`),
        'all'
      )
    ).toEqual(['one', ' two '])
  })

  it('classifies load, contract, execute, and result failures', async () => {
    const { executor } = createExecutor()

    await expectStage(() => executor.execute(createTemplate('const ='), 'all'), 'load')
    await expectStage(() => executor.execute(createTemplate('const value = 1'), 'all'), 'contract')
    await expectStage(
      () =>
        executor.execute(
          createTemplate(`function getMessages() { throw new Error('boom') }`),
          'all'
        ),
      'execute'
    )
    await expectStage(
      () => executor.execute(createTemplate(`function getMessages() { return 'line' }`), 'all'),
      'result'
    )
    await expectStage(
      () =>
        executor.execute(createTemplate(`async function getMessages() { return ['line'] }`), 'all'),
      'result'
    )
  })

  it('times out synchronous infinite loops', async () => {
    const { executor } = createExecutor(20)

    await expectStage(() => executor.execute(createTemplate(`while (true) {}`), 'all'), 'load')
    await expectStage(
      () => executor.execute(createTemplate(`function getMessages() { while (true) {} }`), 'all'),
      'execute'
    )
  })
})
