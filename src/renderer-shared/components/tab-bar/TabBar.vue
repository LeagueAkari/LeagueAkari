<template>
  <div
    class="akari-tab-bar"
    :class="{ 'is-sorting': dragging }"
    :style="{
      '--tab-bar-width': `${strip.width.value}px`,
      '--tab-motion-duration': `${TAB_MOTION.presenceMs}ms`,
      '--tab-enter-ease': TAB_MOTION.enterEase,
      '--tab-leave-ease': TAB_MOTION.leaveEase
    }"
  >
    <div
      ref="layout"
      class="tab-bar-groups flex min-w-0 items-center"
      role="tablist"
      :aria-label="ariaLabel"
    >
      <DragDropProvider
        :sensors="sensors"
        :plugins="plugins"
        :modifiers="modifiers"
        @drag-start="handleDragStart"
        @drag-end="handleDragEnd"
      >
        <div
          v-for="group in groups"
          :key="group.id"
          class="tab-bar-group relative min-w-0"
          :class="{
            'tab-bar-fixed': group.fixed,
            'tab-bar-scroll-group': !group.fixed,
            'has-add': hasAdd
          }"
          :style="{ '--tab-bar-count': group.tabs.length }"
        >
          <div
            :ref="group.fixed ? undefined : setViewport"
            :class="{
              'tab-bar-fixed-viewport': group.fixed,
              'tab-bar-viewport': !group.fixed,
              'can-scroll-left': !group.fixed && !strip.arrivedState.left,
              'can-scroll-right': !group.fixed && !strip.arrivedState.right
            }"
            @wheel="!group.fixed && strip.handleWheel($event)"
            @pointerdown="strip.stopScroll"
          >
            <TransitionGroup
              name="tab-presence"
              tag="div"
              class="tab-bar-list relative flex items-center py-1"
              :css="!reducedMotion && !dragging"
              @before-leave="leavingCount++"
              @after-leave="leavingCount--"
              @leave-cancelled="leavingCount--"
            >
              <TabBarItem
                v-for="(tab, index) in group.tabs"
                :key="tab.id"
                :ref="(item) => setTabRef(tab.id, item)"
                :tab="tab"
                :index="index"
                :active="activeId === tab.id"
                :width="strip.width.value"
                @activate="activate(tab.id)"
                @keydown="handleKeydown"
                @contextmenu="(event) => !dragging && emit('contextmenu', event, tab)"
              >
                <template v-if="slots.icon" #icon="scope">
                  <slot name="icon" v-bind="scope" />
                </template>

                <template v-if="slots.tooltip" #tooltip="scope">
                  <slot name="tooltip" v-bind="scope" />
                </template>

                <template v-if="slots.text" #text="scope">
                  <slot name="text" v-bind="scope" />
                </template>
              </TabBarItem>
            </TransitionGroup>
          </div>
        </div>
      </DragDropProvider>

      <div v-if="hasAdd" ref="addControl" class="flex shrink-0 items-center">
        <TabBarAddMenu
          :options="addOptions"
          :label="addLabel ?? t('tabBar.add')"
          @select="emit('add', $event)"
        >
          <template v-if="slots['add-menu']" #default="scope">
            <slot name="add-menu" v-bind="scope" />
          </template>
        </TabBarAddMenu>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RestrictToHorizontalAxis } from '@dnd-kit/abstract/modifiers'
import { AutoScroller, PointerActivationConstraints, defaultPreset } from '@dnd-kit/dom'
import { DragDropProvider, KeyboardSensor, PointerSensor, type DragEndEvent } from '@dnd-kit/vue'
import { isSortable } from '@dnd-kit/vue/sortable'
import { useMediaQuery } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import {
  computed,
  nextTick,
  ref,
  shallowReactive,
  useTemplateRef,
  watch,
  type ComponentPublicInstance
} from 'vue'

import TabBarItem from './TabBarItem.vue'
import TabBarAddMenu from './TabBarAddMenu.vue'
import {
  getReorderedTabIds,
  resolveTabOrder,
  type TabBarItems,
  type TabBarTab,
  type TabBarAddOption
} from './tab-order'
import { DEFAULT_TAB_WIDTH, TAB_INPUT, TAB_MOTION } from './tab-settings'
import { useTabStrip } from './use-tab-strip'
import './tabs.css'

const {
  items,
  ariaLabel,
  addOptions = [],
  addLabel,
  minTabWidth = DEFAULT_TAB_WIDTH.min,
  maxTabWidth = DEFAULT_TAB_WIDTH.max,
  resizeIdleMs = TAB_MOTION.resizeIdleMs
} = defineProps<{
  items: TabBarItems
  ariaLabel?: string
  addOptions?: TabBarAddOption[]
  addLabel?: string
  /** Minimum item width before horizontal scrolling begins, in CSS pixels. */
  minTabWidth?: number
  /** Maximum item width when space is available, in CSS pixels. */
  maxTabWidth?: number
  /** Time tabs must remain still after closing before widths are redistributed, in milliseconds. */
  resizeIdleMs?: number
}>()

const activeId = defineModel<string>('activeId', { required: true })
/** Ordered IDs, including the fixed prefix. Metadata lives in items. */
const order = defineModel<string[]>('order', { required: true })

const slots = defineSlots<{
  'add-menu'(props: { close: () => void; select: (id: string) => void }): unknown
  icon(props: { tab: TabBarTab; active: boolean }): unknown
  tooltip(props: { tab: TabBarTab; active: boolean }): unknown
  text(props: { tab: TabBarTab; active: boolean }): unknown
}>()

const emit = defineEmits<{
  add: [id: string]
  contextmenu: [event: MouseEvent, tab: TabBarTab]
}>()

const { t } = useTranslation()

const hasAdd = computed(() => addOptions.length > 0 || Boolean(slots['add-menu']))
const ordered = computed(() => resolveTabOrder(items, order.value))
const tabs = computed(() => ordered.value.tabs)

const groups = computed(() => {
  const { tabs, fixedCount } = ordered.value

  return [
    { id: 'fixed', fixed: true, tabs: tabs.slice(0, fixedCount) },
    { id: 'scrollable', fixed: false, tabs: tabs.slice(fixedCount) }
  ].filter((group) => group.tabs.length || (!group.fixed && !hasAdd.value))
})

const layout = useTemplateRef<HTMLElement>('layout')
const addControl = useTemplateRef<HTMLElement>('addControl')
const viewport = ref<HTMLElement | null>(null)
const tabRefs = shallowReactive(new Map<string, InstanceType<typeof TabBarItem>>())

const dragging = ref(false)
const leavingCount = ref(0)
const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

const strip = useTabStrip({
  layout,
  viewport,
  addControl,
  dragging,
  reducedMotion,
  leaving: computed(() => leavingCount.value > 0),
  order: () => order.value,
  minWidth: () => minTabWidth,
  maxWidth: () => maxTabWidth,
  resizeIdleMs: () => resizeIdleMs,
  activeElement: () => tabRefs.get(activeId.value)?.getElement(),
  elements: () => [...tabRefs.values()].map((item) => item.getElement()).filter((el) => el !== null)
})

// A reorder changes positions without changing the item dimensions.
watch(
  () => order.value.slice(),
  (ids, previousIds) => {
    if (ids.length !== previousIds.length || ids.some((id, index) => id !== previousIds[index])) {
      strip.revealActive()
    }
  },
  { flush: 'post' }
)

const setViewport = (element: Element | ComponentPublicInstance | null) => {
  viewport.value = element as HTMLElement | null
}

const setTabRef = (id: string, item: Element | ComponentPublicInstance | null) => {
  if (item) {
    tabRefs.set(id, item as InstanceType<typeof TabBarItem>)
  } else {
    tabRefs.delete(id)
  }
}

let dragFinishedAt = -Infinity
const modifiers = [RestrictToHorizontalAxis]

const plugins = defaultPreset.plugins.map((plugin) =>
  plugin === AutoScroller
    ? AutoScroller.configure({ threshold: TAB_INPUT.dragScrollThreshold })
    : plugin
)

// Only the label is a drag handle; action buttons cannot activate either sensor.
const sensors = [
  PointerSensor.configure({
    activationConstraints: [
      new PointerActivationConstraints.Distance({ value: TAB_INPUT.dragDistancePx })
    ]
  }),
  KeyboardSensor
]

const activate = async (id: string) => {
  if (dragging.value || performance.now() - dragFinishedAt < TAB_INPUT.clickGuardMs) {
    return false
  }

  activeId.value = id

  await nextTick()
  strip.revealActive('smooth')

  return true
}

const handleDragStart = () => {
  strip.stopScroll()
  dragging.value = true
}

const handleDragEnd = (event: DragEndEvent) => {
  dragging.value = false
  dragFinishedAt = performance.now()

  const { source } = event.operation

  if (event.canceled || !isSortable(source)) {
    return
  }

  const next = getReorderedTabIds(items, order.value, String(source.id), source.index)

  if (next) {
    order.value = next
  }
}

const handleKeydown = async (event: KeyboardEvent) => {
  if (dragging.value || tabs.value.length === 0) {
    return
  }

  let index = tabs.value.findIndex((tab) => tab.id === activeId.value)

  switch (event.key) {
    case 'Home':
      index = 0
      break
    case 'End':
      index = tabs.value.length - 1
      break
    case 'ArrowLeft':
      index = (index - 1 + tabs.value.length) % tabs.value.length
      break
    case 'ArrowRight':
      index = (index + 1) % tabs.value.length
      break
    default:
      return
  }

  event.preventDefault()

  const target = tabs.value[index]

  if (target && (await activate(target.id))) {
    tabRefs.get(target.id)?.focus()
  }
}
</script>
