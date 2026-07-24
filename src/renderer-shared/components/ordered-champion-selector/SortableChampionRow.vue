<template>
  <div
    ref="element"
    class="group box-border flex min-w-0 items-center gap-1.5 rounded border border-transparent bg-black/3 px-1 py-1 transition-[background-color,border-color,box-shadow,opacity] select-none hover:bg-black/6 dark:bg-white/4 dark:hover:bg-white/7"
    :class="{
      'border-akari-500/35 bg-akari-500/7 dark:border-akari-400/30 dark:bg-akari-400/10':
        isDropTarget && !isDragSource,
      'opacity-55 shadow-lg shadow-black/15 dark:shadow-black/35': isDragSource,
      'opacity-55': champion.fallback,
      'brightness-50': champion.unavailable
    }"
    :data-unavailable="champion.unavailable || undefined"
    :data-fallback="champion.fallback || undefined"
  >
    <button
      ref="handle"
      type="button"
      class="focus-visible:outline-akari-500 m-0 inline-flex size-6 shrink-0 cursor-grab items-center justify-center rounded border-0 bg-transparent p-0 text-black/35 focus-visible:outline-2 focus-visible:outline-offset-1 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-35 dark:text-white/35"
      :aria-label="t('automation.orderedChampionList.dragHandle', { champion: championLabel })"
      :title="t('automation.orderedChampionList.dragHandle', { champion: championLabel })"
      :disabled="disabled"
    >
      <NIcon size="16"><ReOrderDotsVertical20Regular /></NIcon>
    </button>

    <span
      class="w-4 shrink-0 text-center text-[10px] font-medium text-black/35 [font-variant-numeric:tabular-nums] dark:text-white/35"
    >
      {{ index + 1 }}
    </span>

    <span
      v-if="champion.fallback"
      aria-hidden="true"
      class="size-6 shrink-0 rounded bg-black/10 dark:bg-white/10"
    />
    <ChampionIcon
      v-else
      :champion-id="champion.id"
      :stretched="false"
      class="size-6 shrink-0 rounded"
    />

    <span
      class="min-w-0 flex-1 truncate text-xs font-medium text-black/78 dark:text-white/82"
      :class="{ '[font-variant-numeric:tabular-nums]': champion.fallback }"
    >
      {{ championLabel }}
    </span>

    <NButton
      quaternary
      circle
      size="tiny"
      class="shrink-0 opacity-45 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      :disabled="disabled"
      :aria-label="t('automation.orderedChampionList.remove', { champion: championLabel })"
      @click.stop="emit('remove')"
    >
      <template #icon>
        <NIcon>
          <Dismiss20Regular />
        </NIcon>
      </template>
    </NButton>
  </div>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { Dismiss20Regular, ReOrderDotsVertical20Regular } from '@vicons/fluent'
import { useSortable } from '@dnd-kit/vue/sortable'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon } from 'naive-ui'
import { computed, useTemplateRef } from 'vue'

import type { OrderedChampionRowOption } from './types'

const props = withDefaults(
  defineProps<{
    champion: OrderedChampionRowOption
    index: number
    disabled?: boolean
  }>(),
  {
    disabled: false
  }
)

const emit = defineEmits<{
  remove: []
}>()

const { t } = useTranslation()
const element = useTemplateRef<HTMLElement>('element')
const handle = useTemplateRef<HTMLElement>('handle')
const championLabel = computed(() =>
  props.champion.fallback ? props.champion.id.toString() : props.champion.name
)

const { isDragSource, isDropTarget } = useSortable({
  id: computed(() => props.champion.id),
  index: computed(() => props.index),
  group: 'ordered-champion-selector',
  type: 'ordered-champion',
  accept: 'ordered-champion',
  element,
  handle,
  disabled: computed(() => props.disabled),
  data: computed(() => ({ championId: props.champion.id }))
})
</script>
