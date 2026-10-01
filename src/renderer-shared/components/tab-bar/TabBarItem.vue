<template>
  <div
    ref="element"
    class="tab-bar-item group"
    :class="{ 'is-active': active, 'is-dragging': isDragSource }"
    :data-tab-id="tab.id"
    :style="{ '--tab-bar-actions-width': `${actionsWidth}px` }"
  >
    <div class="tab-bar-item-viewport">
      <div class="tab-bar-tab" :class="{ 'is-active': active, 'is-dragging': isDragSource }">
        <NPopover trigger="hover" placement="top" :delay="600" :disabled="isDragSource">
          <template #trigger>
            <button
              ref="handle"
              type="button"
              role="tab"
              class="tab-bar-label cursor-pointer"
              :aria-selected="active"
              :tabindex="active ? 0 : -1"
              @click="emit('activate')"
            >
              <span
                v-if="tab.icon || slots.icon"
                class="tab-bar-icon flex size-3.5 shrink-0 items-center justify-center"
              >
                <slot name="icon" :tab="tab" :active="active">
                  <component :is="tab.icon" v-if="tab.icon" class="size-3.5 shrink-0" />
                </slot>
              </span>
              <span ref="name" class="tab-bar-name" :class="{ 'is-overflowing': nameOverflows }"
                ><slot name="text" :tab="tab" :active="active">{{ tab.name }}</slot></span
              >
            </button>
          </template>
          {{ tab.name }}
        </NPopover>
        <div class="pointer-events-none absolute inset-y-0 right-1 flex items-center gap-0.5">
          <NPopover
            v-for="action in actions"
            :key="action.id"
            trigger="hover"
            placement="top"
            :delay="600"
            :disabled="isDragSource"
          >
            <template #trigger>
              <button
                type="button"
                data-tab-action
                class="tab-bar-action"
                :aria-label="action.label"
                :disabled="action.disabled || action.loading"
                @click.stop="action.onClick(tab)"
              >
                <component
                  :is="action.icon"
                  class="size-3.5"
                  :class="{ 'motion-safe:animate-spin': action.loading }"
                />
              </button>
            </template>
            {{ action.label }}
          </NPopover>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSortable } from '@dnd-kit/vue/sortable'
import { useOverflow } from '@renderer-shared/composables/useOverflowDetection'
import { useMutationObserver } from '@vueuse/core'
import { NPopover } from 'naive-ui'
import { computed, useTemplateRef, watch } from 'vue'

import type { TabBarTab } from './tab-order'

const { tab, index, active } = defineProps<{
  tab: TabBarTab
  index: number
  active: boolean
}>()

const slots = defineSlots<{
  icon(props: { tab: TabBarTab; active: boolean }): unknown
  text(props: { tab: TabBarTab; active: boolean }): unknown
}>()

const emit = defineEmits<{ activate: [] }>()

const element = useTemplateRef<HTMLElement>('element')
const handle = useTemplateRef<HTMLElement>('handle')
const name = useTemplateRef<HTMLElement>('name')

const { horizontal: nameOverflows, update: updateNameOverflow } = useOverflow(name)

const actions = computed(() =>
  (tab.actions ?? []).filter((action) => action.kind !== 'close' || tab.closable !== false)
)
const actionsWidth = computed(() => actions.value.length * 22 + 8)
const isFixed = computed(() => tab.fixedPosition !== undefined)

watch(() => tab.name, updateNameOverflow, { flush: 'post' })
useMutationObserver(name, updateNameOverflow, {
  childList: true,
  characterData: true,
  subtree: true
})

const { isDragSource } = useSortable({
  id: computed(() => tab.id),
  index: computed(() => index),
  disabled: isFixed,
  element: computed(() => (isFixed.value ? undefined : element.value)),
  handle: computed(() => (isFixed.value ? undefined : handle.value)),
  group: computed(() => (isFixed.value ? 'akari-fixed-tabs' : 'akari-tab-bar')),
  type: computed(() => (isFixed.value ? 'akari-fixed-tab' : 'akari-tab')),
  accept: 'akari-tab',
  transition: { duration: 180, easing: 'ease-out', idle: false }
})
</script>
