<template>
  <DragDropProvider
    :sensors="sensors"
    :modifiers="modifiers"
    @drag-start="handleDragStart"
    @drag-end="handleDragEnd"
  >
    <div ref="root" class="player-tab-strip">
      <NDropdown
        placement="bottom-start"
        trigger="manual"
        :show="contextMenu.show"
        :x="contextMenu.x"
        :y="contextMenu.y"
        :options="contextMenuOptions"
        size="small"
        :theme-overrides="{ fontSizeSmall: '13px', optionHeightSmall: '26px' }"
        @clickoutside="handleContextMenuClickOutside"
        @select="handleContextMenuSelect"
      />

      <NScrollbar
        ref="scrollbar"
        :class="$style.scrollbar"
        :content-class="$style['scrollbar-content']"
        x-scrollable
        @wheel="handleWheel"
      >
        <div ref="tabsList" class="tabs-list" role="tablist">
          <SortablePlayerTab
            v-for="(tab, index) in tabs"
            :key="tab.id"
            :tab="tab"
            :index="index"
            :active="activeTabId === tab.id"
            @activate="handleTabActivate(tab.id)"
            @close="emit('close', tab.id)"
            @contextmenu="handleContextMenu($event, tab.id)"
          />
        </div>
      </NScrollbar>

      <div class="divider" />

      <NPopconfirm
        :disabled="!requireSearchConfirmation"
        :positive-button-props="{ type: 'warning', size: 'tiny' }"
        :negative-button-props="{ size: 'tiny' }"
        @positive-click="emit('search', true)"
      >
        <template #trigger>
          <div
            class="search-area"
            role="button"
            tabindex="0"
            @click="!requireSearchConfirmation && emit('search', false)"
            @keydown.enter="!requireSearchConfirmation && emit('search', false)"
            @keydown.space.prevent="!requireSearchConfirmation && emit('search', false)"
          >
            <NIcon class="search-icon"><SearchIcon /></NIcon>
            <span class="search-label">{{ t('playerTabs.titlebar.search') }}</span>
          </div>
        </template>
        {{ t('playerTabs.titlebar.searchButtonStreamerModeWarning') }}
      </NPopconfirm>
    </div>
  </DragDropProvider>
</template>

<script setup lang="ts">
import { RestrictToHorizontalAxis } from '@dnd-kit/abstract/modifiers'
import { PointerActivationConstraints } from '@dnd-kit/dom'
import {
  DragDropProvider,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/vue'
import { isSortable } from '@dnd-kit/vue/sortable'
import { Search as SearchIcon } from '@vicons/carbon'
import { CloseRound as CloseRoundIcon, RefreshRound as RefreshRoundIcon } from '@vicons/material'
import { useRafFn, useResizeObserver } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { NDropdown, NIcon, NPopconfirm, NScrollbar } from 'naive-ui'
import type { DropdownMixedOption } from 'naive-ui/es/dropdown/src/interface'
import { computed, h, nextTick, reactive, ref, useTemplateRef, watch } from 'vue'

import SortablePlayerTab from './SortablePlayerTab.vue'
import type {
  PlayerTabStripExpose,
  PlayerTabStripItem,
  PlayerTabStripReorderEvent,
  PlayerTabStripScrollOptions
} from './types'

const props = withDefaults(
  defineProps<{
    tabs: PlayerTabStripItem[]
    activeTabId: string | null
    requireSearchConfirmation?: boolean
    contextMenuOffsetY?: number
  }>(),
  {
    requireSearchConfirmation: false,
    contextMenuOffsetY: 0
  }
)

const emit = defineEmits<{
  activate: [id: string]
  close: [id: string]
  refresh: [id: string]
  closeOthers: [id: string]
  closeToRight: [id: string]
  search: [confirmed: boolean]
  reorder: [event: PlayerTabStripReorderEvent]
  dragStart: [id: string]
  dragEnd: [id: string]
}>()

const { t } = useTranslation()
const root = useTemplateRef<HTMLElement>('root')
const tabsList = useTemplateRef<HTMLElement>('tabsList')
const scrollbar = useTemplateRef('scrollbar')
const dragInProgress = ref(false)
let dragFinishedAt = 0

const sensors = [
  PointerSensor.configure({
    activationConstraints: [new PointerActivationConstraints.Distance({ value: 5 })],
    preventActivation(event) {
      const target = event.target

      return (
        target instanceof Element &&
        Boolean(target.closest('button, input, select, textarea, a[href], [role="button"]'))
      )
    }
  }),
  KeyboardSensor
]
const modifiers = [RestrictToHorizontalAxis]

const contextMenu = reactive({
  show: false,
  x: 0,
  y: 0,
  id: ''
})

const contextTabIndex = computed(() => props.tabs.findIndex((tab) => tab.id === contextMenu.id))
const contextTab = computed(() => props.tabs[contextTabIndex.value])
const contextMenuOptions = computed<DropdownMixedOption[]>(() => [
  {
    label: t('playerTabs.titlebar.refresh'),
    key: 'refresh',
    disabled: !contextTab.value || contextTab.value.loading,
    icon: () => h(NIcon, null, { default: () => h(RefreshRoundIcon) })
  },
  {
    type: 'divider',
    key: 'divider-1'
  },
  {
    label: t('playerTabs.titlebar.close'),
    key: 'close',
    disabled: !contextTab.value,
    icon: () => h(NIcon, null, { default: () => h(CloseRoundIcon) })
  },
  {
    label: t('playerTabs.titlebar.closeOthers'),
    key: 'close-others',
    disabled: !contextTab.value || props.tabs.length < 2
  },
  {
    label: t('playerTabs.titlebar.closeToTheRight'),
    key: 'close-to-the-right',
    disabled: contextTabIndex.value < 0 || contextTabIndex.value === props.tabs.length - 1
  }
])

const getScrollContainer = () =>
  scrollbar.value?.scrollbarInstRef?.containerRef as HTMLElement | undefined

const findTabElement = (id: string) => {
  const elements = root.value?.querySelectorAll<HTMLElement>('[data-player-tab-id]')

  return Array.from(elements || []).find((element) => element.dataset.playerTabId === id)
}

const scrollToTab: PlayerTabStripExpose['scrollToTab'] = async (
  id,
  options: PlayerTabStripScrollOptions = {}
) => {
  await nextTick()

  const container = getScrollContainer()
  const tab = findTabElement(id)

  if (!container || !tab) {
    return false
  }

  const containerRect = container.getBoundingClientRect()
  const tabRect = tab.getBoundingClientRect()
  let left = 0

  if (options.inline === 'center') {
    left = tabRect.left + tabRect.width / 2 - (containerRect.left + containerRect.width / 2)
  } else if (tabRect.left < containerRect.left) {
    left = tabRect.left - containerRect.left
  } else if (tabRect.right > containerRect.right) {
    left = tabRect.right - containerRect.right
  }

  if (Math.abs(left) > 0.5) {
    container.scrollBy({ left, behavior: options.behavior || 'smooth' })
  }

  return true
}

const { resume: scheduleActiveTabScroll } = useRafFn(
  () => {
    if (props.activeTabId) {
      void scrollToTab(props.activeTabId, { behavior: 'auto' })
    }
  },
  { immediate: false, once: true }
)

useResizeObserver(tabsList, () => {
  if (dragInProgress.value || !props.activeTabId) {
    return
  }

  scheduleActiveTabScroll()
})

defineExpose<PlayerTabStripExpose>({ scrollToTab })

const handleWheel = (event: WheelEvent) => {
  const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY * 0.75
  getScrollContainer()?.scrollBy({ left: delta })
}

const handleTabActivate = (id: string) => {
  if (Date.now() - dragFinishedAt < 120) {
    return
  }

  emit('activate', id)
}

const handleDragStart = (event: DragStartEvent) => {
  const id = String(event.operation.source?.id || '')

  dragInProgress.value = true
  contextMenu.show = false

  if (id) {
    emit('dragStart', id)
  }
}

const handleDragEnd = (event: DragEndEvent) => {
  const { source } = event.operation
  const id = source ? String(source.id) : ''

  dragInProgress.value = false
  dragFinishedAt = Date.now()

  if (id) {
    emit('dragEnd', id)
  }

  if (event.canceled || !isSortable(source)) {
    return
  }

  const fromIndex = props.tabs.findIndex((tab) => tab.id === id)
  const toIndex = Math.min(Math.max(source.index, 0), props.tabs.length - 1)

  if (fromIndex < 0 || fromIndex === toIndex) {
    return
  }

  emit('reorder', { id, fromIndex, toIndex })
  void scrollToTab(id, { behavior: 'auto' })
}

const handleContextMenu = (event: MouseEvent, id: string) => {
  event.preventDefault()
  contextMenu.x = event.clientX
  contextMenu.y = event.clientY - props.contextMenuOffsetY
  contextMenu.id = id
  contextMenu.show = true
}

const handleContextMenuClickOutside = (event: MouseEvent) => {
  const target = event.target

  if (event.button === 2 && target instanceof Element && target.closest('[data-player-tab-id]')) {
    return
  }

  contextMenu.show = false
}

const handleContextMenuSelect = (key: string | number) => {
  const id = contextMenu.id

  switch (key) {
    case 'refresh':
      emit('refresh', id)
      break
    case 'close':
      emit('close', id)
      break
    case 'close-others':
      emit('closeOthers', id)
      break
    case 'close-to-the-right':
      emit('closeToRight', id)
      break
  }

  contextMenu.show = false
}

watch(
  () => props.activeTabId,
  (id) => {
    if (id) {
      void scrollToTab(id)
    }
  },
  { immediate: true }
)

watch(
  () => props.tabs.map((tab) => tab.id),
  (nextTabIds) => {
    if (contextMenu.id && !nextTabIds.includes(contextMenu.id)) {
      contextMenu.show = false
    }
  }
)
</script>

<style scoped>
.player-tab-strip {
  display: flex;
  align-items: center;
  flex: 1;
  width: 100%;
  min-width: 0;
  height: 100%;
}

.tabs-list {
  display: flex;
  padding-top: 4px;
  box-sizing: border-box;
  flex: 1;
  height: 100%;
  align-items: center;
  width: max-content;
  gap: 2px;
}

.search-area {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  -webkit-app-region: no-drag;
  padding: 0 12px 0 10px;
  border-radius: 2px;
  height: 24px;
  box-sizing: border-box;
  cursor: pointer;
  line-height: 1;
  transition:
    border-color 0.2s,
    background-color 0.2s,
    color 0.2s;
  border: 1px solid rgba(0, 0, 0, 0);
  background-color: rgba(0, 0, 0, 0.1);
  color: rgba(0, 0, 0, 0.8);

  [data-theme='dark'] & {
    border: 1px solid rgba(255, 255, 255, 0);
    background-color: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
  }

  &:hover {
    border-color: rgba(0, 0, 0, 0.4);
    color: rgba(0, 0, 0, 1);

    [data-theme='dark'] & {
      border-color: rgba(255, 255, 255, 0.4);
      color: rgba(255, 255, 255, 1);
    }
  }

  &:active {
    background-color: rgba(0, 0, 0, 0.05);

    [data-theme='dark'] & {
      background-color: rgba(255, 255, 255, 0.05);
    }
  }

  &:focus-visible {
    outline: 1px solid currentColor;
    outline-offset: 1px;
  }
}

.search-icon {
  font-size: 12px;
  margin-right: 4px;
  transition: color 0.2s;
}

.search-label {
  font-size: 12px;
  transition: color 0.2s;
}

.divider {
  width: 1px;
  height: 40%;
  box-sizing: border-box;
  margin: 0 8px;
  background-color: rgba(0, 0, 0, 0.15);

  [data-theme='dark'] & {
    background-color: rgba(255, 255, 255, 0.15);
  }
}

[data-theme-id]:not([data-theme-id='light']):not([data-theme-id='dark']) {
  .search-area {
    border-color: rgb(var(--la-card-border-rgb) / 0);
    background-color: rgb(var(--la-card-tint-rgb) / 0.12);
    color: color-mix(in oklch, var(--la-color-text-themed) 90%, transparent);

    &:hover {
      border-color: rgb(var(--la-card-border-rgb) / 0.45);
      color: var(--la-color-text-themed);
    }

    &:active {
      background-color: color-mix(in oklch, var(--la-color-link) 18%, transparent);
    }
  }

  .divider {
    background-color: rgb(var(--la-card-border-rgb) / 0.28);
  }
}
</style>

<style module>
.scrollbar {
  height: 100%;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;

  :global(.n-scrollbar-container) {
    width: auto;
    -webkit-app-region: no-drag;
  }

  :global(.n-scrollbar-rail.n-scrollbar-rail--horizontal) {
    height: 4px;
  }

  :global(.n-scrollbar-rail.n-scrollbar-rail--horizontal .n-scrollbar-rail__scrollbar) {
    position: relative;
    bottom: -4px;
    height: 4px;
  }
}

.scrollbar-content {
  height: 100%;
  min-width: 0 !important;
}
</style>
