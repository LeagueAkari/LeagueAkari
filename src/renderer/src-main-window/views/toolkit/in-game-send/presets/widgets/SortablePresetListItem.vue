<template>
  <div
    ref="element"
    class="group box-border flex min-h-8 w-full flex-none items-center justify-between gap-1 rounded-[5px] py-1 pr-0.5 pl-0.5 text-inherit transition-[background-color,box-shadow,opacity] duration-150 select-none"
    :class="[
      active
        ? 'active bg-black/15 hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/10'
        : 'bg-transparent hover:bg-black/10 dark:hover:bg-white/10',
      {
        'ring-akari-500/35 bg-akari-500/8 dark:bg-akari-400/10 ring-1':
          isDropTarget && !isDragSource,
        'z-1 opacity-65 shadow-lg shadow-black/15 dark:shadow-black/35': isDragSource
      }
    ]"
    :data-preset-item-id="id"
  >
    <button
      ref="handle"
      type="button"
      class="inline-flex size-5.5 flex-none cursor-grab items-center justify-center rounded border-0 bg-transparent p-0 text-black/32 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600/50 active:cursor-grabbing dark:text-white/35"
      :aria-label="dragLabel"
      :title="dragLabel"
    >
      <NIcon size="16"><DragHandleIcon /></NIcon>
    </button>

    <button
      type="button"
      class="item-main flex min-h-5.5 min-w-0 flex-1 cursor-pointer items-center justify-start gap-1.5 border-0 bg-transparent p-0 text-left text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600/50"
      @click="emit('select')"
    >
      <slot name="status" />
      <span
        v-if="dirty"
        class="size-1.5 flex-none rounded-full bg-orange-500 dark:bg-orange-400"
        :title="dirtyLabel"
      >
        <span class="sr-only">{{ dirtyLabel }}</span>
      </span>
      <span
        class="item-title min-w-0 overflow-hidden text-[13px] leading-5.5 font-normal text-ellipsis whitespace-nowrap"
        :class="
          active
            ? trimmedTitle
              ? 'font-medium text-black dark:text-white'
              : 'font-medium text-black/52 dark:text-white/55'
            : trimmedTitle
              ? 'text-black/82 dark:text-white/86'
              : 'text-black/38 dark:text-white/38'
        "
      >
        {{ trimmedTitle || unnamedLabel }}
      </span>
    </button>

    <NPopconfirm
      type="warning"
      :keep-alive-on-hover="false"
      :show-icon="false"
      :negative-button-props="{ size: 'tiny' }"
      :positive-button-props="{ type: 'warning', size: 'tiny' }"
      @update:show="deleteConfirmShown = $event"
      @positive-click="emit('delete')"
    >
      <template #trigger>
        <NButton
          size="tiny"
          quaternary
          class="flex-none text-inherit opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500! focus-visible:opacity-100 dark:text-white/80 dark:hover:text-red-400!"
          :class="{ 'opacity-100': deleteConfirmShown }"
          :aria-label="deleteLabel"
          @click.stop
        >
          <template #icon>
            <NIcon><DeleteIcon /></NIcon>
          </template>
        </NButton>
      </template>
      {{ deleteConfirm }}
    </NPopconfirm>
  </div>
</template>

<script setup lang="ts">
import { useSortable } from '@dnd-kit/vue/sortable'
import {
  Delete24Regular as DeleteIcon,
  ReOrderDotsVertical20Regular as DragHandleIcon
} from '@vicons/fluent'
import { NButton, NIcon, NPopconfirm } from 'naive-ui'
import { computed, ref, useTemplateRef } from 'vue'

const props = defineProps<{
  id: string
  index: number
  group: string
  type: string
  title: string
  unnamedLabel: string
  dragLabel: string
  deleteLabel: string
  deleteConfirm: string
  active: boolean
  dirty: boolean
  dirtyLabel: string
}>()

const emit = defineEmits<{
  select: []
  delete: []
}>()

const element = useTemplateRef<HTMLElement>('element')
const handle = useTemplateRef<HTMLElement>('handle')
const deleteConfirmShown = ref(false)
const trimmedTitle = computed(() => props.title.trim())

const { isDragSource, isDropTarget } = useSortable({
  id: computed(() => props.id),
  index: computed(() => props.index),
  group: computed(() => props.group),
  type: computed(() => props.type),
  accept: computed(() => props.type),
  element,
  handle,
  data: computed(() => ({ presetItemId: props.id })),
  transition: {
    duration: 180,
    easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    idle: true
  }
})
</script>
