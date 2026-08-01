import type { LoggerRenderer } from '@renderer-shared/shards/logger'
import { describe, expect, test, vi } from 'vitest'
import { KeepAlive, createRenderer, defineComponent, h, nextTick, ref } from 'vue'

import { AkariNavigationController } from './navigation-controller'
import {
  provideAkariNavigationRuntime,
  useAkariNavigation,
  useAkariNavigationStep
} from './useAkariNavigation'

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

function createProvider(controller: AkariNavigationController, child: () => unknown) {
  return defineComponent({
    setup() {
      provideAkariNavigationRuntime(controller)
      return child
    }
  })
}

describe('Akari navigation Vue composables', () => {
  test('exposes navigation and registers independent steps below the provider', async () => {
    const controller = createController()
    const calls: string[] = []

    const Steps = defineComponent({
      setup() {
        const navigation = useAkariNavigation()
        expect(navigation).toBe(controller)

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
    const Provider = createProvider(controller, () => h(Steps))

    const app = renderer.createApp(Provider)
    app.mount(createHostElement('root'))
    await nextTick()

    await expect(
      controller.navigate([
        { key: 'root', payload: 'settings' },
        { key: 'target', payload: 'setting' }
      ])
    ).resolves.toMatchObject({ status: 'completed', cursor: 2 })
    expect(calls).toEqual(['root:settings', 'target:setting'])

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
    const Provider = createProvider(controller, () => (showStep.value ? h(Step) : null))

    const app = renderer.createApp(Provider)
    app.mount(createHostElement('root'))

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
    const Provider = createProvider(controller, () =>
      h(KeepAlive, null, {
        default: () => h(showStep.value ? Step : Empty)
      })
    )

    const app = renderer.createApp(Provider)
    app.mount(createHostElement('root'))
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
