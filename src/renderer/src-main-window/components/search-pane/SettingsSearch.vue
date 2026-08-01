<template>
  <div :class="styles['settings-search']" @keydown="handleKeydown">
    <div :class="styles['settings-search__input-row']">
      <NInput
        ref="search-input"
        :value="queryInput"
        size="large"
        clearable
        :bordered="false"
        :theme-overrides="searchInputThemeOverrides"
        :aria-label="t('settings.commandPalette.searchAriaLabel')"
        :placeholder="t('settings.commandPalette.searchPlaceholder')"
        @update:value="handleQueryUpdate"
        @compositionstart="handleQueryCompositionStart"
        @compositionend="handleQueryCompositionEnd"
      >
        <template #prefix>
          <NIcon class="text-lg opacity-60">
            <Search20RegularIcon />
          </NIcon>
        </template>
      </NInput>
    </div>

    <div :class="styles['settings-search__results']">
      <NScrollbar
        v-if="filteredResults.length"
        ref="results-scrollbar"
        :class="styles['settings-search__results-scroller']"
        :content-class="styles['settings-search__results-content']"
        @scroll="virtualContainerProps.onScroll"
      >
        <div v-bind="virtualWrapperProps" role="listbox">
          <button
            v-for="{ data: result, index } in virtualResults"
            :key="result.targetId"
            type="button"
            :class="[
              styles['settings-search__result'],
              {
                [styles['settings-search__result--active']]: index === activeIndex
              }
            ]"
            :aria-selected="index === activeIndex"
            :title="result.description || undefined"
            role="option"
            @mousedown.prevent
            @click="selectResult(result.targetId)"
          >
            <span class="flex min-w-0 flex-1 items-center gap-1">
              <template
                v-for="(ancestorLabel, ancestorIndex) in result.ancestorLabels"
                :key="`${result.targetId}:${ancestorIndex}`"
              >
                <span class="max-w-40 truncate text-xs text-black/45 dark:text-white/45">
                  {{ ancestorLabel }}
                </span>
                <NIcon class="shrink-0 text-xs text-black/30 dark:text-white/30">
                  <ChevronRight12RegularIcon />
                </NIcon>
              </template>
              <span class="min-w-0 flex-1 truncate text-sm font-medium">
                {{ result.label }}
              </span>
            </span>
          </button>
        </div>
      </NScrollbar>

      <NEmpty
        v-else
        :class="styles['settings-search__empty']"
        size="small"
        :description="t('settings.commandPalette.empty')"
      />
    </div>

    <div :class="styles['settings-search__footer']">
      <span :class="styles['settings-search__count']">
        {{ filteredResults.length }} / {{ allResults.length }}
      </span>
      <span :class="styles['settings-search__hints']">
        <span :class="styles['settings-search__hint']">
          <kbd>Enter</kbd>
          {{ t('settings.commandPalette.openHint') }}
        </span>
        <span :class="styles['settings-search__hint']">
          <kbd>Esc</kbd>
          {{ t('settings.commandPalette.closeHint') }}
        </span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ChevronRight12Regular as ChevronRight12RegularIcon,
  Search20Regular as Search20RegularIcon
} from '@vicons/fluent'
import { useCompositionAwareInput } from '@renderer-shared/composables/useCompositionAwareInput'
import { useVirtualList } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { NEmpty, NIcon, NInput, NScrollbar, type InputInst } from 'naive-ui'
import { computed, nextTick, ref, useCssModule, useTemplateRef, watch, watchEffect } from 'vue'

import {
  MAIN_WINDOW_PAGE_LABEL_KEYS,
  MAIN_WINDOW_SECTION_LABEL_KEYS,
  SETTINGS_TAB_LABEL_KEYS,
  STORAGE_SETTINGS_TAB_LABEL_KEYS,
  getSettingsNavigationTarget,
  searchableSettingsNavigationTargets,
  type SettingsNavigationTargetId
} from '@main-window/settings-navigation/registry'

interface SettingsNavigationSearchResult {
  targetId: SettingsNavigationTargetId
  label: string
  description: string
  ancestorLabels: string[]
  normalizedLabel: string
  normalizedRoute: string
  searchText: string
}

const RESULT_ITEM_HEIGHT = 36
const RESULTS_SCROLL_PADDING = 6

const emit = defineEmits<{
  navigate: [targetId: SettingsNavigationTargetId]
  close: []
}>()

const { t } = useTranslation()
const styles = useCssModule()
const activeIndex = ref(0)
const searchInput = useTemplateRef<InputInst>('search-input')
const resultsScrollbar = useTemplateRef('results-scrollbar')
const searchInputThemeOverrides = {
  color: 'transparent',
  colorFocus: 'transparent'
}
const {
  inputValue: queryInput,
  committedValue: query,
  isComposing: isQueryComposing,
  setValue: setQuery,
  handleUpdateValue: handleQueryUpdate,
  handleCompositionStart: handleQueryCompositionStart,
  handleCompositionEnd: handleQueryCompositionEnd
} = useCompositionAwareInput()

const normalizeSearchText = (value: string) => value.trim().toLocaleLowerCase()

const allResults = computed<SettingsNavigationSearchResult[]>(() =>
  searchableSettingsNavigationTargets.map((target) => {
    const parent = target.parentId ? getSettingsNavigationTarget(target.parentId) : undefined
    const routeParts: string[] = []

    if ('tab' in target.route) {
      routeParts.push(t(SETTINGS_TAB_LABEL_KEYS[target.route.tab]))

      if (target.route.tab === 'storage') {
        routeParts.push(t(STORAGE_SETTINGS_TAB_LABEL_KEYS[target.route.subTab]))
      }
    } else {
      routeParts.push(t(MAIN_WINDOW_PAGE_LABEL_KEYS[target.route.name]))
      routeParts.push(
        t(MAIN_WINDOW_SECTION_LABEL_KEYS[`${target.route.name}.${target.route.section}`])
      )
    }

    if (parent) {
      const parentLabel = t(parent.labelKey)
      const existingSegments = routeParts.flatMap((part) =>
        part.split('/').map((item) => item.trim())
      )

      if (!existingSegments.includes(parentLabel)) {
        routeParts.push(parentLabel)
      }
    }

    const label = t(target.labelKey)
    const description = target.descriptionKey ? t(target.descriptionKey) : ''
    const keywords = target.keywordKeys?.map((key) => t(key)).join(' ') ?? ''
    const routeLabel = [...new Set(routeParts)].join(' / ')

    return {
      targetId: target.id as SettingsNavigationTargetId,
      label,
      description,
      ancestorLabels: routeParts,
      normalizedLabel: normalizeSearchText(label),
      normalizedRoute: normalizeSearchText(routeLabel),
      searchText: normalizeSearchText(
        [label, description, keywords, routeLabel, target.id].join(' ')
      )
    }
  })
)

const getMatchRank = (result: SettingsNavigationSearchResult, pattern: string) => {
  const labelIndex = result.normalizedLabel.indexOf(pattern)
  if (labelIndex === 0) {
    return 0
  }
  if (labelIndex > 0) {
    return 10 + labelIndex
  }

  const routeIndex = result.normalizedRoute.indexOf(pattern)
  if (routeIndex >= 0) {
    return 100 + routeIndex
  }

  return 1000 + result.searchText.indexOf(pattern)
}

const filteredResults = computed(() => {
  const pattern = normalizeSearchText(query.value)
  if (!pattern) {
    return allResults.value
  }

  return allResults.value
    .filter((result) => result.searchText.includes(pattern))
    .toSorted((left, right) => getMatchRank(left, pattern) - getMatchRank(right, pattern))
})

const {
  list: virtualResults,
  containerProps: virtualContainerProps,
  wrapperProps: virtualWrapperProps,
  scrollTo: scrollToResult
} = useVirtualList(filteredResults, {
  itemHeight: RESULT_ITEM_HEIGHT,
  overscan: 6
})

watchEffect(() => {
  virtualContainerProps.ref.value = resultsScrollbar.value?.scrollbarInstRef?.containerRef ?? null
})

const focusSearchInput = () => {
  searchInput.value?.focus()
}

const scrollActiveResultIntoView = () => {
  void nextTick(() => {
    const container = resultsScrollbar.value?.scrollbarInstRef?.containerRef
    if (!container || activeIndex.value < 0) {
      return
    }

    const itemTop = activeIndex.value * RESULT_ITEM_HEIGHT + RESULTS_SCROLL_PADDING
    const itemBottom = itemTop + RESULT_ITEM_HEIGHT
    const visibleTop = container.scrollTop
    const visibleBottom = visibleTop + container.clientHeight

    if (itemTop < visibleTop + RESULTS_SCROLL_PADDING) {
      container.scrollTop = Math.max(0, itemTop - RESULTS_SCROLL_PADDING)
    } else if (itemBottom > visibleBottom - RESULTS_SCROLL_PADDING) {
      container.scrollTop = itemBottom - container.clientHeight + RESULTS_SCROLL_PADDING
    }
  })
}

const moveActiveResult = (offset: number) => {
  const resultCount = filteredResults.value.length
  if (!resultCount) {
    return
  }

  if (activeIndex.value < 0) {
    activeIndex.value = offset > 0 ? 0 : resultCount - 1
  } else {
    activeIndex.value = (activeIndex.value + offset + resultCount) % resultCount
  }
  scrollActiveResultIntoView()
}

const selectResult = (targetId: SettingsNavigationTargetId) => {
  emit('navigate', targetId)
}

const selectActiveResult = () => {
  const result = filteredResults.value[activeIndex.value]
  if (result) {
    selectResult(result.targetId)
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (isQueryComposing.value || event.isComposing) {
    return
  }

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      moveActiveResult(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      moveActiveResult(-1)
      break
    case 'Enter':
      event.preventDefault()
      selectActiveResult()
      break
    case 'Escape':
      event.preventDefault()
      emit('close')
      break
  }
}

watch(
  () => filteredResults.value,
  (results) => {
    activeIndex.value = results.length ? 0 : -1
    void nextTick(() => scrollToResult(0))
  },
  { immediate: true }
)

const activate = () => {
  setQuery('')
  activeIndex.value = allResults.value.length ? 0 : -1
  void nextTick(() => {
    scrollToResult(0)
    focusSearchInput()
  })
}

defineExpose({ activate })
</script>

<style module>
.settings-search {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  flex-direction: column;
  color: var(--la-color-text-primary);
  -webkit-app-region: no-drag;
}

.settings-search__input-row {
  flex-shrink: 0;
  padding: 8px 0px;
  border-bottom: 1px solid color-mix(in oklch, var(--la-color-text-primary) 12%, transparent);
}

.settings-search__results {
  height: 0;
  min-height: 72px;
  flex: 1;
}

.settings-search__results-scroller {
  height: 100%;
}

.settings-search__results-content {
  padding: 6px;
}

.settings-search__result {
  display: flex;
  width: 100%;
  height: 36px;
  padding: 0 10px;
  appearance: none;
  align-items: center;
  color: inherit;
  border: 0;
  border-radius: 5px;
  outline: 0;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.settings-search__result--active,
.settings-search__result:hover {
  background-color: color-mix(in oklch, var(--la-color-text-primary) 7%, transparent);
}

.settings-search__result:focus-visible {
  outline: 2px solid color-mix(in oklch, var(--la-color-link) 70%, transparent);
  outline-offset: -2px;
}

.settings-search__empty {
  padding: 28px 16px;
}

.settings-search__footer {
  display: flex;
  min-height: 30px;
  padding: 0 10px;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: color-mix(in oklch, var(--la-color-text-primary) 50%, transparent);
  border-top: 1px solid color-mix(in oklch, var(--la-color-text-primary) 10%, transparent);
  font-size: 10px;
}

.settings-search__count {
  font-variant-numeric: tabular-nums;
}

.settings-search__hints,
.settings-search__hint {
  display: flex;
  align-items: center;
}

.settings-search__hints {
  gap: 12px;
}

.settings-search__hint {
  gap: 4px;
}

.settings-search__hint kbd {
  min-width: 18px;
  padding: 1px 4px;
  color: color-mix(in oklch, var(--la-color-text-primary) 72%, transparent);
  border: 1px solid color-mix(in oklch, var(--la-color-text-primary) 16%, transparent);
  border-radius: 3px;
  background-color: color-mix(in oklch, var(--la-color-text-primary) 6%, transparent);
  font-family: inherit;
  font-size: 9px;
  line-height: 14px;
  text-align: center;
}
</style>
