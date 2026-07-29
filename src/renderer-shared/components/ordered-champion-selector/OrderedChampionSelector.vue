<template>
  <DragDropProvider :modifiers="dragModifiers" @drag-end="handleDragEnd">
    <div
      class="flex h-[min(56vh,26rem)] min-h-72 min-w-0 flex-col overflow-hidden"
      :aria-disabled="disabled"
    >
      <div
        class="flex h-10 shrink-0 items-center gap-1 border-b border-black/10 px-3 dark:border-white/10"
      >
        <NInput
          :value="filterInput"
          class="max-w-60 min-w-36 flex-1"
          clearable
          size="tiny"
          :disabled="loading"
          :placeholder="t('automation.orderedChampionList.searchForChampion')"
          @update:value="handleFilterUpdate"
          @compositionstart="handleFilterCompositionStart"
          @compositionend="handleFilterCompositionEnd"
        >
          <template #prefix>
            <NIcon :component="SearchIcon" />
          </template>
        </NInput>
        <ChampionPositionFilter v-if="hasPositionData" v-model="selectedPosition" />
      </div>

      <div
        class="grid min-h-0 flex-1 grid-cols-[minmax(0,5fr)_minmax(0,4fr)] divide-x divide-black/10 dark:divide-white/10"
      >
        <section class="flex min-w-0 flex-col overflow-hidden">
          <div
            class="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-black/10 px-3 dark:border-white/10"
          >
            <span
              class="shrink-0 text-xs font-semibold whitespace-nowrap text-black/82 dark:text-white/88"
            >
              {{ t('automation.orderedChampionList.candidateTitle') }}
            </span>
            <span
              class="shrink-0 text-right text-[10px] text-black/42 [font-variant-numeric:tabular-nums] dark:text-white/42"
            >
              {{ selectedChampionIds.length }} / {{ champions.length }}
            </span>
          </div>

          <div v-if="loading" class="flex min-h-0 flex-1 items-center justify-center">
            <NSpin size="small" :description="t('automation.orderedChampionList.loading')" />
          </div>

          <div
            v-else-if="!filteredChampions.length"
            class="flex min-h-0 flex-1 items-center justify-center px-4 text-center text-xs text-black/40 dark:text-white/40"
          >
            {{ t('automation.orderedChampionList.emptyCandidates') }}
          </div>

          <NScrollbar
            v-else
            ref="candidateScrollbar"
            class="min-h-0 flex-1"
            content-class="box-border py-1"
            @scroll="candidateVirtualContainerProps.onScroll"
          >
            <div v-bind="candidateVirtualWrapperProps" class="flex flex-col">
              <div
                v-for="{ data: champion } in virtualChampions"
                :key="champion.id"
                class="mb-0.5 box-border h-8 shrink-0 px-2"
              >
                <NCheckbox
                  class="box-border h-full w-full rounded px-1.5 py-1 transition-colors hover:bg-black/4 dark:hover:bg-white/5"
                  :class="{
                    'bg-black/4 dark:bg-white/6': selectedPositionById.has(champion.id)
                  }"
                  :checked="selectedPositionById.has(champion.id)"
                  :disabled="disabled"
                  :data-unavailable="champion.unavailable || undefined"
                  @update:checked="(checked) => updateChampionSelection(champion.id, checked)"
                >
                  <span
                    class="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                    :class="{ 'brightness-50': champion.unavailable }"
                  >
                    <ChampionIcon
                      :champion-id="champion.id"
                      :stretched="false"
                      class="size-6 shrink-0 rounded"
                    />
                    <span class="min-w-0 flex-1 truncate text-xs font-medium">
                      {{ champion.name }}
                    </span>
                  </span>
                </NCheckbox>
              </div>
            </div>
          </NScrollbar>
        </section>

        <section class="flex min-w-0 flex-col overflow-hidden">
          <div
            class="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-black/10 px-3 dark:border-white/10"
          >
            <span class="text-xs font-semibold text-black/82 dark:text-white/88">
              {{ t('automation.orderedChampionList.selectedTitle') }}
            </span>
            <div class="flex items-center gap-1.5">
              <NPopconfirm
                type="warning"
                placement="top-end"
                :flip="false"
                :show-icon="false"
                :disabled="disabled || !selectedChampionIds.length"
                :positive-text="t('automation.orderedChampionList.confirmClear')"
                :negative-text="t('automation.orderedChampionList.cancel')"
                :positive-button-props="{ type: 'warning', size: 'tiny' }"
                :negative-button-props="{ size: 'tiny' }"
                @positive-click="clearSelectedChampions"
              >
                <template #trigger>
                  <NButton
                    text
                    size="tiny"
                    class="cursor-pointer"
                    :disabled="disabled || !selectedChampionIds.length"
                    :focusable="false"
                  >
                    {{ t('automation.orderedChampionList.clear') }}
                  </NButton>
                </template>
                {{ t('automation.orderedChampionList.clearConfirm') }}
              </NPopconfirm>
              <span
                class="shrink-0 text-right text-[10px] text-black/42 [font-variant-numeric:tabular-nums] dark:text-white/42"
              >
                {{ selectedChampionIds.length }}
              </span>
            </div>
          </div>

          <div
            v-if="!selectedChampions.length"
            class="flex min-h-0 flex-1 items-center justify-center px-4 text-center text-xs leading-5 text-black/40 dark:text-white/40"
          >
            {{ t('automation.orderedChampionList.emptySelected') }}
          </div>

          <NScrollbar v-else ref="selectedScrollbar" class="min-h-0 flex-1">
            <div class="box-border flex w-full flex-col gap-0.5 p-2 pt-1">
              <SortableChampionRow
                v-for="(champion, index) in selectedChampions"
                :key="champion.id"
                :champion="champion"
                :index="index"
                :disabled="disabled"
                @remove="removeChampion(champion.id)"
              />
            </div>
          </NScrollbar>
        </section>
      </div>
    </div>
  </DragDropProvider>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useCompositionAwareInput } from '@renderer-shared/composables/useCompositionAwareInput'
import { useScrollFollow } from '@renderer-shared/composables/useScrollFollow'
import { isChampionNameMatch } from '@shared/utils/string-match'
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers'
import { DragDropProvider, type DragEndEvent } from '@dnd-kit/vue'
import { isSortable } from '@dnd-kit/vue/sortable'
import { Search as SearchIcon } from '@vicons/carbon'
import { useVirtualList } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { NButton, NCheckbox, NIcon, NInput, NPopconfirm, NScrollbar, NSpin } from 'naive-ui'
import { computed, nextTick, ref, useTemplateRef, watch, watchEffect } from 'vue'

import ChampionPositionFilter from './ChampionPositionFilter.vue'
import SortableChampionRow from './SortableChampionRow.vue'
import type {
  OrderedChampionMatcher,
  OrderedChampionOption,
  OrderedChampionPosition,
  OrderedChampionRowOption
} from './types'

const props = withDefaults(
  defineProps<{
    champions: OrderedChampionOption[]
    loading?: boolean
    disabled?: boolean
    matchChampion?: OrderedChampionMatcher
  }>(),
  {
    loading: false,
    disabled: false,
    matchChampion: undefined
  }
)

const selectedChampionIds = defineModel<number[]>({ default: () => [] })
const { t } = useTranslation()
const dragModifiers = [RestrictToVerticalAxis]
const candidateScrollbar = useTemplateRef('candidateScrollbar')
const selectedScrollbar = useTemplateRef('selectedScrollbar')
const selectedPosition = ref<OrderedChampionPosition | null>(null)
const {
  inputValue: filterInput,
  committedValue: filterQuery,
  handleUpdateValue: handleFilterUpdate,
  handleCompositionStart: handleFilterCompositionStart,
  handleCompositionEnd: handleFilterCompositionEnd
} = useCompositionAwareInput()

useScrollFollow(() => selectedScrollbar.value?.scrollbarInstRef?.containerRef, {
  threshold: 4,
  behavior: 'smooth'
})

const championById = computed(
  () => new Map(props.champions.map((champion) => [champion.id, champion]))
)

const hasPositionData = computed(() =>
  props.champions.some((champion) => champion.positions?.length)
)

const filteredChampions = computed(() => {
  const pattern = filterQuery.value.trim()

  return props.champions.filter((champion) => {
    if (selectedPosition.value && !champion.positions?.includes(selectedPosition.value)) {
      return false
    }

    if (!pattern) {
      return true
    }

    if (props.matchChampion) {
      return props.matchChampion(pattern, champion)
    }

    return isChampionNameMatch(pattern, champion.name) || champion.id.toString().includes(pattern)
  })
})

const {
  list: virtualChampions,
  containerProps: candidateVirtualContainerProps,
  wrapperProps: candidateVirtualWrapperProps,
  scrollTo: scrollCandidateTo
} = useVirtualList(filteredChampions, {
  itemHeight: 34,
  overscan: 6
})

watchEffect(() => {
  candidateVirtualContainerProps.ref.value =
    candidateScrollbar.value?.scrollbarInstRef?.containerRef ?? null
})

watch([filterQuery, selectedPosition], () => {
  nextTick(() => scrollCandidateTo(0))
})

const selectedPositionById = computed(
  () => new Map(selectedChampionIds.value.map((id, index) => [id, index + 1]))
)

const selectedChampions = computed<OrderedChampionRowOption[]>(() =>
  selectedChampionIds.value.map(
    (id) => championById.value.get(id) || { id, name: id.toString(), fallback: true }
  )
)

const updateChampionSelection = (id: number, selected: boolean) => {
  if (props.disabled) {
    return
  }

  if (!selected) {
    removeChampion(id)
    return
  }

  if (selectedPositionById.value.has(id)) {
    return
  }

  selectedChampionIds.value = [...selectedChampionIds.value, id]
}

const removeChampion = (id: number) => {
  if (props.disabled) {
    return
  }

  selectedChampionIds.value = selectedChampionIds.value.filter((championId) => championId !== id)
}

const clearSelectedChampions = () => {
  if (props.disabled) {
    return
  }

  selectedChampionIds.value = []
}

const handleDragEnd = (event: DragEndEvent) => {
  if (props.disabled || event.canceled) {
    return
  }

  const { source } = event.operation

  if (!isSortable(source) || source.initialIndex === source.index) {
    return
  }

  const nextValue = [...selectedChampionIds.value]
  const [movedChampionId] = nextValue.splice(source.initialIndex, 1)

  if (movedChampionId === undefined) {
    return
  }

  nextValue.splice(source.index, 0, movedChampionId)
  selectedChampionIds.value = nextValue
}
</script>
