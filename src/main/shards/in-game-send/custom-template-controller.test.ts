import {
  IN_GAME_SEND_CUSTOM_TEMPLATE_DEFAULT_CODE,
  IN_GAME_SEND_CUSTOM_TEMPLATE_MAX_ITEMS,
  type InGameSendCustomTemplateItem,
  getInGameSendCustomTemplateShortcutTargetId
} from '@shared/shards/in-game-send'
import { describe, expect, it, vi } from 'vitest'

import { InGameSendCustomTemplateController } from './custom-template-controller'
import { InGameSendCustomTemplateExecutionError } from './custom-template-executor'
import { InGameSendState } from './state'

function createController() {
  const settings = {
    customTemplateRiskNoticeShown: false,
    customTemplateItems: [] as InGameSendCustomTemplateItem[]
  }
  const state = new InGameSendState()
  const settingService = {
    set: vi.fn(async (key: keyof typeof settings, value: (typeof settings)[typeof key]) => {
      ;(settings[key] as (typeof settings)[typeof key]) = value
    })
  }
  const context = {
    settings,
    state,
    settingService,
    mobxUtils: {
      reaction: vi.fn((selector: () => unknown, effect: () => void) => {
        selector()
        effect()
      })
    },
    keyboardShortcuts: {
      register: vi.fn(),
      unregisterByTargetId: vi.fn()
    },
    logger: {
      warn: vi.fn(),
      error: vi.fn()
    }
  } as any
  const customTemplateExecutor = {
    execute: vi.fn(() => ['generated'])
  } as any
  const sendExecutor = {
    sendLines: vi.fn(async (lines: string[]) => lines.length > 0)
  } as any

  return {
    context,
    settings,
    state,
    settingService,
    customTemplateExecutor,
    sendExecutor,
    controller: new InGameSendCustomTemplateController(
      context,
      customTemplateExecutor,
      sendExecutor
    )
  }
}

describe('InGameSendCustomTemplateController', () => {
  it('persists the one-time risk notice without gating template management', async () => {
    const { controller, settings, settingService } = createController()

    await controller.markRiskNoticeShown()
    const item = await controller.createItem()

    expect(settingService.set).toHaveBeenCalledWith('customTemplateRiskNoticeShown', true)
    expect(item).toEqual({
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      title: '',
      code: IN_GAME_SEND_CUSTOM_TEMPLATE_DEFAULT_CODE,
      targetShortcuts: {
        friendly: null,
        enemy: null,
        all: null
      }
    })
    expect(settings.customTemplateItems).toEqual([item])
  })

  it('rejects creation at the shared item limit', async () => {
    const { controller, settings } = createController()
    settings.customTemplateItems = Array.from(
      { length: IN_GAME_SEND_CUSTOM_TEMPLATE_MAX_ITEMS },
      (_, index) => ({
        id: `template-${index}`,
        title: '',
        code: '',
        targetShortcuts: { friendly: null, enemy: null, all: null }
      })
    )

    await expect(controller.createItem()).rejects.toThrow('Custom template item limit reached')
  })

  it('merges target shortcut patches without dropping siblings', async () => {
    const { controller, settings } = createController()
    const item = await controller.createItem()

    const updated = await controller.updateItem(item.id, {
      targetShortcuts: { enemy: 'Ctrl+E' }
    })

    expect(updated.targetShortcuts).toEqual({
      friendly: null,
      enemy: 'Ctrl+E',
      all: null
    })
    expect(settings.customTemplateItems[0]).toEqual(updated)
  })

  it('records execution errors and clears them after success or code update', async () => {
    const { controller, customTemplateExecutor, state } = createController()
    const item = await controller.createItem()
    customTemplateExecutor.execute.mockImplementationOnce(() => {
      throw new InGameSendCustomTemplateExecutionError('execute', 'failed')
    })

    expect(() => controller.generateLines(item.id, 'enemy')).toThrow('failed')
    expect(state.customTemplateLastErrors[item.id]).toMatchObject({
      stage: 'execute',
      target: 'enemy',
      error: expect.stringContaining('failed')
    })

    expect(controller.generateLines(item.id, 'all')).toEqual(['generated'])
    expect(state.customTemplateLastErrors[item.id]).toBeUndefined()

    state.setCustomTemplateLastError(item.id, {
      stage: 'result',
      target: 'all',
      occurredAt: 1,
      error: 'old error'
    })
    await controller.updateItem(item.id, { title: 'Renamed' })
    expect(state.customTemplateLastErrors[item.id]).toBeDefined()

    await controller.updateItem(item.id, { code: 'function getMessages() { return [] }' })
    expect(state.customTemplateLastErrors[item.id]).toBeUndefined()
  })

  it('uses generated lines with the existing send executor', async () => {
    const { controller, sendExecutor } = createController()
    const item = await controller.createItem()

    await expect(controller.send(item.id, 'friendly')).resolves.toBe(true)
    expect(sendExecutor.sendLines).toHaveBeenCalledWith(['generated'])
  })

  it('registers three target shortcuts without a risk gate', () => {
    const { context, controller, settings } = createController()
    settings.customTemplateItems = [
      {
        id: 'template-id',
        title: '',
        code: '',
        targetShortcuts: {
          friendly: 'Ctrl+F',
          enemy: 'Ctrl+E',
          all: 'Ctrl+A'
        }
      }
    ]

    controller.start()

    expect(context.keyboardShortcuts.register).toHaveBeenCalledTimes(3)
    expect(context.keyboardShortcuts.register).toHaveBeenCalledWith(
      getInGameSendCustomTemplateShortcutTargetId('template-id', 'enemy'),
      'Ctrl+E',
      'last-active',
      expect.any(Function)
    )
  })

  it('reorders a template directly to the dropped index', async () => {
    const { controller, settings } = createController()
    settings.customTemplateItems = ['first', 'second', 'third'].map((id) => ({
      id,
      title: id,
      code: '',
      targetShortcuts: { friendly: null, enemy: null, all: null }
    }))

    await expect(controller.reorderItem('first', 2)).resolves.toBe(true)
    expect(settings.customTemplateItems.map((item) => item.id)).toEqual([
      'second',
      'third',
      'first'
    ])
  })

  it('clears a custom shortcut that conflicts during registration', async () => {
    const { context, controller, settings } = createController()
    settings.customTemplateItems = [
      {
        id: 'template-id',
        title: '',
        code: '',
        targetShortcuts: {
          friendly: null,
          enemy: 'Ctrl+E',
          all: null
        }
      }
    ]
    context.keyboardShortcuts.register.mockImplementation(() => {
      throw new Error('Shortcut conflict')
    })

    controller.start()

    await vi.waitFor(() => {
      expect(settings.customTemplateItems[0].targetShortcuts.enemy).toBeNull()
    })
    expect(context.logger.warn).toHaveBeenCalledWith(
      'Failed to register custom template shortcut',
      getInGameSendCustomTemplateShortcutTargetId('template-id', 'enemy'),
      expect.any(Error)
    )
  })
})
