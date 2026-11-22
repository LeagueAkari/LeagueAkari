import type { LoggerRenderer } from '@renderer-shared/shards/logger'
import { AkariManager } from '@shared/akari-shard'
import { describe, expect, test, vi } from 'vitest'
import { KeepAlive, type VNode, createRenderer, defineComponent, h, nextTick, ref } from 'vue'

import { useAkariNavigationStep } from './index'
import { AkariNavigationController } from './navigation-controller'

interface HostNode {
  parent: HostElement | null
  text?: string
}

interface HostElement extends HostNode {
  type: string
  children: HostNode[]
  props: Record<string, unknown>
}

function createHostElement(type: string): HostElement {
  return { type, parent: null, children: [], props: {} }
}

const renderer = createRenderer<HostNode, HostElement>({
  patchProp(element, key, _previousValue, nextValue) {
    element.props[key] = nextValue
  },
  insert(child, parent, anchor) {
    child.parent = parent
    if (!anchor) {
      parent.children.push(child)
      return
    }

    const anchorIndex = parent.children.indexOf(anchor)
    parent.children.splice(anchorIndex, 0, child)
  },
  remove(child) {
    if (!child.parent) {
      return
    }

    const childIndex = child.parent.children.indexOf(child)
    if (childIndex >= 0) {
      child.parent.children.splice(childIndex, 1)
    }
    child.parent = null
  },
  createElement: (type) => createHostElement(type),
  createText: (text) => ({ parent: null, text }),
  createComment: (text) => ({ parent: null, text }),
  setText(node, text) {
    node.text = text
  },
  setElementText(element, text) {
    element.children = [{ parent: element, text }]
  },
  parentNode: (node) => node.parent,
  nextSibling(node) {
    if (!node.parent) {
      return null
    }
    return node.parent.children[node.parent.children.indexOf(node) + 1] ?? null
  },
  querySelector: () => null,
  setScopeId: () => undefined,
  cloneNode: (node) => ({ ...node }),
  insertStaticContent: () => {
    const node = { parent: null, text: '' }
    return [node, node]
  }
})

function createController(deadlineMs = 1000) {
  const logger = {
    warn: vi.fn(),
    error: vi.fn()
  } as unknown as LoggerRenderer

  return new AkariNavigationController(
    { namespace: 'akari-navigation-composable-test', logger },
    deadlineMs
  )
}

function mountSteps(controller: AkariNavigationController, render: () => VNode | null) {
  const manager = new AkariManager()
  vi.spyOn(manager, 'getInstance').mockReturnValue({ runtime: controller })

  const app = renderer.createApp({ render })
  app.config.globalProperties.$akariManager = manager
  app.mount(createHostElement('root'))
  return app
}

describe('Akari navigation Vue composables', () => {
  test('registers independent steps with the window navigation shard', async () => {
    const controller = createController()
    const calls: string[] = []

    const Steps = defineComponent({
      setup() {
        useAkariNavigationStep({
          key: 'root',
          activate: (payload) => {
            calls.push(`root:${String(payload)}`)
          }
        })
        useAkariNavigationStep({
          key: 'target',
          activate: (payload) => {
            calls.push(`target:${String(payload)}`)
          }
        })
        return () => h('steps')
      }
    })
    const app = mountSteps(controller, () => h(Steps))
    await nextTick()

    await expect(
      controller.navigate([
        { key: 'root', payload: 'profile' },
        { key: 'target', payload: 'history' }
      ])
    ).resolves.toMatchObject({ status: 'completed', cursor: 2 })
    expect(calls).toEqual(['root:profile', 'target:history'])

    app.unmount()
    controller.dispose()
  })

  test('waits for a conditional step to mount', async () => {
    const controller = createController()
    const showStep = ref(false)
    const activate = vi.fn()

    const Step = defineComponent({
      setup() {
        useAkariNavigationStep({ key: 'conditional', activate })
        return () => h('step')
      }
    })
    const app = mountSteps(controller, () => (showStep.value ? h(Step) : null))

    const navigation = controller.navigate([{ key: 'conditional' }])
    await nextTick()
    expect(activate).not.toHaveBeenCalled()

    showStep.value = true
    await nextTick()
    await expect(navigation).resolves.toMatchObject({ status: 'completed', cursor: 1 })
    expect(activate).toHaveBeenCalledOnce()

    app.unmount()
    controller.dispose()
  })

  test('unregisters a KeepAlive step while deactivated and keeps its setup key', async () => {
    const controller = createController()
    const showStep = ref(true)
    const activate = vi.fn()
    const stepOptions = { key: 'kept-alive', activate }

    const Step = defineComponent({
      setup() {
        useAkariNavigationStep(stepOptions)
        return () => h('step')
      }
    })
    const Empty = defineComponent({
      setup: () => () => h('empty')
    })
    const app = mountSteps(controller, () =>
      h(KeepAlive, null, {
        default: () => h(showStep.value ? Step : Empty)
      })
    )

    await nextTick()

    await expect(controller.navigate([{ key: 'kept-alive' }])).resolves.toMatchObject({
      status: 'completed'
    })

    showStep.value = false
    await nextTick()
    stepOptions.key = 'changed-after-setup'
    const navigation = controller.navigate([{ key: 'kept-alive' }])
    await nextTick()
    expect(activate).toHaveBeenCalledOnce()

    showStep.value = true
    await nextTick()
    await expect(navigation).resolves.toMatchObject({ status: 'completed' })
    expect(activate).toHaveBeenCalledTimes(2)

    app.unmount()
    controller.dispose()
  })
})
