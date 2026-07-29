import type { LoggerRenderer } from '@renderer-shared/shards/logger'
import { describe, expect, test, vi } from 'vitest'
import { KeepAlive, createRenderer, defineComponent, h, nextTick, ref } from 'vue'

import { AkariNavigationController } from '@main-window/shards/akari-navigation'

import {
  provideAkariNavigation,
  useAkariNavigationBoundary,
  useAkariNavigationTarget
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

function createController() {
  const logger = {
    warn: vi.fn(),
    error: vi.fn()
  } as unknown as LoggerRenderer

  return new AkariNavigationController(
    { namespace: 'akari-navigation-composable-test', logger },
    1000
  )
}

describe('Akari navigation Vue composables', () => {
  test('supports a root boundary declared in the same component as its provider', async () => {
    const controller = createController()
    const activateTarget = vi.fn(() => ({ status: 'ready' as const }))

    const Target = defineComponent({
      setup() {
        useAkariNavigationTarget({
          scope: 'target',
          destination: 'setting',
          activate: activateTarget
        })
        return () => h('target')
      }
    })
    const Provider = defineComponent({
      setup() {
        provideAkariNavigation(controller.context)
        useAkariNavigationBoundary({
          scope: 'root',
          context: controller.context,
          parentOutlet: controller.rootOutlet,
          activate: () => ({ status: 'ready' })
        })
        return () => h(Target)
      }
    })

    const app = renderer.createApp(Provider)
    app.mount(createHostElement('root'))
    await nextTick()

    await expect(
      controller.navigate([
        { scope: 'root', destination: 'settings' },
        { scope: 'target', destination: 'setting', waitForRegistration: false }
      ])
    ).resolves.toMatchObject({ status: 'completed', cursor: 2 })
    expect(activateTarget).toHaveBeenCalledOnce()

    app.unmount()
    controller.dispose()
  })

  test('waits for a conditional boundary and invokes its target only after navigation', async () => {
    const controller = createController()
    const showBoundary = ref(false)
    const activateTarget = vi.fn(() => ({ status: 'ready' as const }))

    const Target = defineComponent({
      setup() {
        useAkariNavigationTarget({
          scope: 'target',
          destination: 'setting',
          activate: activateTarget
        })
        return () => h('target')
      }
    })
    const Boundary = defineComponent({
      setup() {
        useAkariNavigationBoundary({
          scope: 'pane',
          activate: () => ({ status: 'ready' })
        })
        return () => h(Target)
      }
    })
    const Provider = defineComponent({
      setup() {
        provideAkariNavigation(controller.context)
        return () => (showBoundary.value ? h(Boundary) : null)
      }
    })

    const app = renderer.createApp(Provider)
    app.mount(createHostElement('root'))

    const navigation = controller.navigate([
      { scope: 'pane', destination: 'visible-pane' },
      { scope: 'target', destination: 'setting', waitForRegistration: false }
    ])
    await nextTick()
    expect(activateTarget).not.toHaveBeenCalled()

    showBoundary.value = true
    await nextTick()
    await expect(navigation).resolves.toMatchObject({ status: 'completed', cursor: 2 })
    expect(activateTarget).toHaveBeenCalledOnce()

    app.unmount()
    controller.dispose()
  })

  test('unregisters targets while their KeepAlive branch is deactivated', async () => {
    const controller = createController()
    const showTarget = ref(true)
    const activateTarget = vi.fn(() => ({ status: 'ready' as const }))

    const Target = defineComponent({
      setup() {
        useAkariNavigationTarget({
          scope: 'target',
          destination: 'kept-alive',
          activate: activateTarget
        })
        return () => h('target')
      }
    })
    const Empty = defineComponent({
      setup: () => () => h('empty')
    })
    const Provider = defineComponent({
      setup() {
        provideAkariNavigation(controller.context)
        return () =>
          h(KeepAlive, null, {
            default: () => h(showTarget.value ? Target : Empty)
          })
      }
    })

    const app = renderer.createApp(Provider)
    app.mount(createHostElement('root'))
    await nextTick()
    expect(activateTarget).not.toHaveBeenCalled()

    await expect(
      controller.navigate([
        { scope: 'target', destination: 'kept-alive', waitForRegistration: false }
      ])
    ).resolves.toMatchObject({ status: 'completed' })

    showTarget.value = false
    await nextTick()
    await expect(
      controller.navigate([
        { scope: 'target', destination: 'kept-alive', waitForRegistration: false }
      ])
    ).resolves.toMatchObject({ status: 'unavailable' })

    showTarget.value = true
    await nextTick()
    await expect(
      controller.navigate([
        { scope: 'target', destination: 'kept-alive', waitForRegistration: false }
      ])
    ).resolves.toMatchObject({ status: 'completed' })
    expect(activateTarget).toHaveBeenCalledTimes(2)

    app.unmount()
    controller.dispose()
  })
})
