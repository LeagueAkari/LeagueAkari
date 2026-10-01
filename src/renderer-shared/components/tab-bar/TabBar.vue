<template>
  <div
    ref="root"
    class="akari-tab-bar"
    :class="{ 'is-sorting': dragging }"
    :style="{
      '--tab-bar-min-width': `${minTabWidth}px`,
      '--tab-bar-max-width': `${maxTabWidth}px`,
      '--tab-bar-width': `${tabWidth}px`
    }"
    @keydown="handleKeydown"
    @contextmenu="handleContextMenu"
  >
    <div class="tab-bar-groups flex min-w-0 items-center" role="tablist" :aria-label="ariaLabel">
      <DragDropProvider
        :sensors="sensors"
        :modifiers="modifiers"
        @drag-start="handleDragStart"
        @drag-end="handleDragEnd"
      >
        <div
          v-if="fixedCount"
          class="tab-bar-fixed tab-bar-list relative flex shrink-0 items-center py-1"
        >
          <TransitionGroup
            :css="false"
            @before-enter="prepareTabEnter"
            @enter="animateTabEnter"
            @enter-cancelled="cancelTabEnter"
            @leave="removeTab"
            @leave-cancelled="cancelTabLeave"
          >
            <TabBarItem
              v-for="tab in fixedTabs"
              :key="tab.id"
              :tab="tab"
              :index="tab.fixedPosition!"
              :active="activeId === tab.id"
              @activate="activate(tab.id)"
            >
              <template v-if="slots.icon" #icon="scope"
                ><slot name="icon" v-bind="scope"
              /></template>
              <template v-if="slots.text" #text="scope"
                ><slot name="text" v-bind="scope"
              /></template>
            </TabBarItem>
          </TransitionGroup>
        </div>

        <div class="tab-bar-scroll-group relative min-w-0 flex-1">
          <div
            ref="viewport"
            class="tab-bar-viewport"
            :class="{
              'can-scroll-left': !arrivedState.left,
              'can-scroll-right': !arrivedState.right
            }"
            @wheel="handleWheel"
            @pointerdown="stopWheelScroll"
          >
            <div
              ref="tabsList"
              class="tab-bar-list relative flex w-full items-center py-1"
              :style="{ '--tab-bar-count': scrollableTabs.length }"
            >
              <TransitionGroup
                :css="false"
                @before-enter="prepareTabEnter"
                @enter="animateTabEnter"
                @enter-cancelled="cancelTabEnter"
                @leave="removeTab"
                @leave-cancelled="cancelTabLeave"
              >
                <TabBarItem
                  v-for="(tab, index) in scrollableTabs"
                  :key="tab.id"
                  :tab="tab"
                  :index="index"
                  :active="activeId === tab.id"
                  @activate="activate(tab.id)"
                >
                  <template v-if="slots.icon" #icon="scope"
                    ><slot name="icon" v-bind="scope"
                  /></template>
                  <template v-if="slots.text" #text="scope"
                    ><slot name="text" v-bind="scope"
                  /></template>
                </TabBarItem>
              </TransitionGroup>
            </div>
          </div>
        </div>
      </DragDropProvider>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RestrictToHorizontalAxis } from '@dnd-kit/abstract/modifiers'
import { PointerActivationConstraints } from '@dnd-kit/dom'
import { DragDropProvider, KeyboardSensor, PointerSensor, type DragEndEvent } from '@dnd-kit/vue'
import { isSortable } from '@dnd-kit/vue/sortable'
import { useMediaQuery, useResizeObserver, useScroll } from '@vueuse/core'
import { animate, useMotionValue } from 'motion-v'
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'

import TabBarItem from './TabBarItem.vue'
import type { TabBarTab, TabBarTabReorder } from './tab-order'
import { getTabReorder, validateTabOrder } from './tab-order'
import './tabs.css'

const TAB_APPEAR_DURATION = 0.22
const TAB_APPEAR_EASE = [0.16, 1, 0.3, 1] as const
const TAB_LEAVE_EASE = [0.4, 0, 0.2, 1] as const

const {
  tabs,
  ariaLabel,
  minTabWidth = 120,
  maxTabWidth = 100
} = defineProps<{
  tabs: TabBarTab[]
  ariaLabel?: string
  minTabWidth?: number
  maxTabWidth?: number
}>()

const activeId = defineModel<string>('activeId', { required: true })

const slots = defineSlots<{
  icon(props: { tab: TabBarTab; active: boolean }): unknown
  text(props: { tab: TabBarTab; active: boolean }): unknown
}>()

const emit = defineEmits<{
  contextmenu: [event: MouseEvent, tab: TabBarTab]
  reorder: [event: TabBarTabReorder]
}>()

const fixedCount = computed(() => validateTabOrder(tabs))
const fixedTabs = computed(() => tabs.slice(0, fixedCount.value))
const scrollableTabs = computed(() => tabs.slice(fixedCount.value))
const root = useTemplateRef<HTMLElement>('root')
const viewport = useTemplateRef<HTMLElement>('viewport')
const tabsList = useTemplateRef<HTMLElement>('tabsList')

const { arrivedState, measure: measureScroll } = useScroll(viewport, {
  offset: { left: 1 }
})
const dragging = ref(false)
const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

const enteringTabs = new Map<Element, () => void>()
const leavingTabs = new Map<Element, () => void>()

const tabWidth = ref(maxTabWidth)
const scrollPosition = useMotionValue(0)
let scrollTarget = 0

const stopScrollWatch = scrollPosition.on('change', (position) => {
  if (viewport.value) {
    viewport.value.scrollLeft = position
  }
})

let dragFinishedAt = 0
const modifiers = [RestrictToHorizontalAxis]
const sensors = [
  PointerSensor.configure({
    activationConstraints: [new PointerActivationConstraints.Distance({ value: 6 })],
    preventActivation: (event) =>
      event.target instanceof Element && Boolean(event.target.closest('[data-tab-action]'))
  }),
  KeyboardSensor
]

function setTabAppearance(element: HTMLElement, progress: number) {
  element.style.marginRight = `calc(var(--tab-bar-gap) * ${progress - 1})`
  element.style.setProperty('--tab-bar-content-scale', String(0.94 + progress * 0.06))
}

function clearTabAppearance(element: HTMLElement) {
  element.classList.remove('is-transitioning')
  for (const property of [
    'width',
    'margin-right',
    'transition',
    '--tab-bar-content-width',
    '--tab-bar-content-scale'
  ]) {
    element.style.removeProperty(property)
  }
}

function prepareTabEnter(element: Element) {
  if (!(element instanceof HTMLElement) || reducedMotion.value) {
    return
  }

  element.style.transition = 'none'
  element.classList.add('is-transitioning')
  element.style.setProperty('--tab-bar-content-width', 'var(--tab-bar-width)')
  element.style.width = '0px'
  setTabAppearance(element, 0)
}

function animateTabEnter(element: Element, done: () => void) {
  if (!(element instanceof HTMLElement) || reducedMotion.value) {
    done()
    return
  }

  const finish = () => {
    clearTabAppearance(element)
    enteringTabs.delete(element)
    done()
    void revealActiveTab()
  }
  const animation = animate(0, 1, {
    duration: TAB_APPEAR_DURATION,
    ease: TAB_APPEAR_EASE,
    onUpdate: (progress) => {
      element.style.width = `calc(var(--tab-bar-width) * ${progress})`
      setTabAppearance(element, progress)
      revealActiveTabNow()
    },
    onComplete: finish
  })
  enteringTabs.set(element, () => {
    animation.stop()
    finish()
  })
}

function cancelTabEnter(element: Element) {
  enteringTabs.get(element)?.()
}

function removeTab(element: Element, done: () => void) {
  const width = element instanceof HTMLElement ? element.offsetWidth : 0
  const contentWidth =
    element instanceof HTMLElement
      ? element.querySelector<HTMLElement>('.tab-bar-tab')!.offsetWidth
      : 0
  cancelTabEnter(element)
  if (!(element instanceof HTMLElement) || reducedMotion.value) {
    done()
    return
  }

  element.style.pointerEvents = 'none'
  element.style.transition = 'none'
  element.classList.add('is-transitioning')
  element.style.setProperty('--tab-bar-content-width', `${contentWidth}px`)
  const finish = () => {
    leavingTabs.delete(element)
    element.style.removeProperty('pointer-events')
    clearTabAppearance(element)
    done()
    void revealActiveTab()
  }
  const animation = animate(1, 0, {
    duration: TAB_APPEAR_DURATION,
    ease: TAB_LEAVE_EASE,
    onUpdate: (progress) => {
      element.style.width = `${width * progress}px`
      setTabAppearance(element, progress)
    },
    onComplete: finish
  })
  leavingTabs.set(element, () => {
    animation.stop()
    finish()
  })
}

function cancelTabLeave(element: Element) {
  leavingTabs.get(element)?.()
}

function activate(id: string) {
  if (dragging.value || Date.now() - dragFinishedAt < 180) {
    return
  }

  activeId.value = id
}

function handleDragStart() {
  stopWheelScroll()
  enteringTabs.forEach((finish) => finish())
  leavingTabs.forEach((finish) => finish())
  dragging.value = true
}

function handleContextMenu(event: MouseEvent) {
  if (dragging.value || !(event.target instanceof Element)) {
    return
  }

  const element = event.target.closest<HTMLElement>('[data-tab-id]')
  if (!element) {
    return
  }

  const tab = tabs.find((tab) => tab.id === element.dataset.tabId)
  if (tab) {
    emit('contextmenu', event, tab)
  }
}

function updateTabWidth() {
  const el = root.value
  const list = tabsList.value
  if (!el || !list || !tabs.length) {
    return
  }

  const gap = Number.parseFloat(getComputedStyle(list).columnGap) || 0
  const availableWidth = el.clientWidth - gap * (tabs.length - 1)
  tabWidth.value = Math.max(minTabWidth, Math.min(maxTabWidth, availableWidth / tabs.length))
}

function handleDragEnd(event: DragEndEvent) {
  dragging.value = false
  dragFinishedAt = Date.now()
  const { source } = event.operation
  if (event.canceled || !isSortable(source)) {
    return
  }

  const reorder = getTabReorder(tabs, String(source.id), source.index)
  if (reorder) {
    emit('reorder', reorder)
  }
}

function stopWheelScroll() {
  scrollPosition.stop()
}

function handleWheel(event: WheelEvent) {
  const el = viewport.value
  if (!el) {
    return
  }

  // Let native horizontal gestures and zoom take over immediately.
  if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
    stopWheelScroll()
    return
  }

  const maxScroll = el.scrollWidth - el.clientWidth
  if (maxScroll <= 0 || event.deltaY === 0 || dragging.value) {
    return
  }

  let unit = 1

  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    unit = 16
  } else if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    unit = el.clientWidth
  }

  const delta = event.deltaY * unit
  if ((delta < 0 && el.scrollLeft <= 1) || (delta > 0 && el.scrollLeft >= maxScroll - 1)) {
    stopWheelScroll()
    return
  }

  event.preventDefault()
  const currentTarget = scrollPosition.isAnimating() ? scrollTarget : el.scrollLeft
  scrollTarget = Math.min(maxScroll, Math.max(0, currentTarget + delta))
  stopWheelScroll()
  scrollPosition.set(el.scrollLeft)

  if (reducedMotion.value) {
    scrollPosition.set(scrollTarget)
    return
  }

  animate(scrollPosition, scrollTarget, {
    duration: 0.16,
    ease: 'easeOut'
  })
}

async function handleKeydown(event: KeyboardEvent) {
  if (
    !(event.target instanceof HTMLElement) ||
    event.target.getAttribute('role') !== 'tab' ||
    dragging.value
  ) {
    return
  }

  const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']

  if (!keys.includes(event.key)) {
    return
  }

  event.preventDefault()
  const ids = tabs.map((tab) => tab.id)
  if (!ids.length) {
    return
  }

  let index = ids.indexOf(activeId.value)

  if (event.key === 'Home') {
    index = 0
  } else if (event.key === 'End') {
    index = ids.length - 1
  } else {
    const direction = event.key === 'ArrowRight' ? 1 : -1
    index = (index + direction + ids.length) % ids.length
  }

  activate(ids[index])
  await nextTick()

  const tabElements = root.value?.querySelectorAll<HTMLElement>('[role="tab"]')
  const targetTab = tabElements?.[index]

  if (targetTab) {
    targetTab.focus()
  }
}

async function revealActiveTab() {
  stopWheelScroll()
  await nextTick()
  // The entering animation follows its growing bounds on every frame.
  if (enteringTabs.size) {
    return
  }
  revealActiveTabNow()
}

function revealActiveTabNow() {
  // Keep the departing tab in view until its leave animation releases its space.
  if (leavingTabs.size) {
    measureScroll()
    return
  }

  const container = viewport.value

  if (!container || dragging.value) {
    measureScroll()
    return
  }

  const tabElements = container.querySelectorAll<HTMLElement>('[data-tab-id]')
  const activeTab = Array.from(tabElements).find((item) => item.dataset.tabId === activeId.value)

  if (activeTab) {
    const bounds = container.getBoundingClientRect()
    const tabBounds = activeTab.getBoundingClientRect()

    if (tabBounds.left < bounds.left) {
      container.scrollLeft += tabBounds.left - bounds.left
    } else if (tabBounds.right > bounds.right) {
      container.scrollLeft += tabBounds.right - bounds.right
    }
  }

  measureScroll()
}

watch(() => [activeId.value, ...tabs.map((tab) => tab.id)], revealActiveTab, {
  immediate: true
})

watch(() => [tabs.length, minTabWidth, maxTabWidth], updateTabWidth, {
  flush: 'post'
})

useResizeObserver(viewport, () => {
  void revealActiveTab()
})
useResizeObserver(root, updateTabWidth)
useResizeObserver(tabsList, measureScroll)

watch(reducedMotion, (reduced) => {
  if (reduced) {
    stopWheelScroll()
    enteringTabs.forEach((finish) => finish())
    leavingTabs.forEach((finish) => finish())
  }
})

onBeforeUnmount(() => {
  enteringTabs.forEach((finish) => finish())
  leavingTabs.forEach((finish) => finish())
  stopWheelScroll()
  stopScrollWatch()
})
</script>
