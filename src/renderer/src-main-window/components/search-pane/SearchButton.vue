<template>
  <NTooltip :disabled="!compact" :z-index="TITLEBAR_TOOLTIP_Z_INDEX">
    <template #trigger>
      <button
        type="button"
        class="search-button"
        :class="{ 'is-compact': compact }"
        :aria-label="t('titlebar.search.open')"
        @click="openSearch()"
      >
        <NIcon class="search-button__icon" aria-hidden="true"><Search20RegularIcon /></NIcon>
        <span class="search-button__label">{{ t('titlebar.search.open') }}</span>
        <kbd class="search-button__shortcut" aria-hidden="true">{{ shortcutLabel }}</kbd>
      </button>
    </template>
    {{ t('titlebar.search.open') }}
  </NTooltip>
</template>

<script setup lang="ts">
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { Search20Regular as Search20RegularIcon } from '@vicons/fluent'
import { useEventListener } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { NIcon, NTooltip } from 'naive-ui'
import { computed } from 'vue'

import { useMainWindowAppContext } from '@main-window/context'

const TITLEBAR_TOOLTIP_Z_INDEX = 75000

defineProps<{ compact: boolean }>()

const { t } = useTranslation()
const { openSearch } = useMainWindowAppContext()
const appCommon = useAppCommonStore()
const shortcutLabel = computed(() => (appCommon.isMacOS ? '⌘ K' : 'Ctrl K'))

useEventListener(window, 'keydown', (event) => {
  const usesPlatformModifier = appCommon.isMacOS
    ? event.metaKey && !event.ctrlKey
    : event.ctrlKey && !event.metaKey

  if (
    event.repeat ||
    event.altKey ||
    event.shiftKey ||
    !usesPlatformModifier ||
    event.key.toLowerCase() !== 'k'
  ) {
    return
  }

  event.preventDefault()
  openSearch()
})
</script>

<style scoped>
.search-button {
  display: flex;
  height: 24px;
  margin-right: 4px;
  padding: 0 7px 0 8px;
  appearance: none;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  box-sizing: border-box;
  color: rgba(0, 0, 0, 0.66);
  border: 1px solid rgba(0, 0, 0, 0.18);
  border-radius: 6px;
  outline: 0;
  background-color: rgba(0, 0, 0, 0.06);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.16);
  font: inherit;
  line-height: 1;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background-color 0.2s,
    color 0.2s,
    box-shadow 0.2s;
  -webkit-app-region: no-drag;

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.7);
    border-color: rgba(255, 255, 255, 0.2);
    background-color: rgba(255, 255, 255, 0.1);
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  &:hover {
    color: rgba(0, 0, 0, 0.76);
    border-color: rgba(0, 0, 0, 0.28);
    background-color: rgba(0, 0, 0, 0.06);

    [data-theme='dark'] & {
      color: rgba(255, 255, 255, 0.9);
      border-color: rgba(255, 255, 255, 0.32);
      background-color: rgba(255, 255, 255, 0.15);
    }
  }

  &:active {
    background-color: rgba(0, 0, 0, 0.09);

    [data-theme='dark'] & {
      background-color: rgba(255, 255, 255, 0.12);
    }
  }

  &:focus-visible {
    border-color: color-mix(in oklch, var(--la-color-link) 70%, transparent);
    box-shadow: 0 0 0 2px color-mix(in oklch, var(--la-color-link) 20%, transparent);
  }
}

.search-button__icon {
  flex-shrink: 0;
  font-size: 14px;
}

.search-button__label {
  font-size: 12px;
  white-space: nowrap;
}

.search-button__shortcut {
  display: inline-flex;
  height: 17px;
  padding: 0 5px;
  flex-shrink: 0;
  align-items: center;
  box-sizing: border-box;
  color: rgba(0, 0, 0, 0.46);
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.38);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
  font-family: inherit;
  font-size: 9px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.46);
    border-color: rgba(255, 255, 255, 0.12);
    background-color: rgba(255, 255, 255, 0.06);
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.12);
  }
}

[data-theme-id]:not([data-theme-id='light']):not([data-theme-id='dark']) {
  .search-button {
    color: color-mix(in oklch, var(--la-color-text-themed) 72%, transparent);
    border-color: rgb(var(--la-card-border-rgb) / 0.38);
    background-color: rgb(var(--la-card-tint-rgb) / 0.15);

    &:hover {
      color: color-mix(in oklch, var(--la-color-text-themed) 92%, transparent);
      border-color: rgb(var(--la-card-border-rgb) / 0.55);
      background-color: rgb(var(--la-card-tint-rgb) / 0.22);
    }

    &:active {
      background-color: color-mix(in oklch, var(--la-color-link) 18%, transparent);
    }
  }

  .search-button__shortcut {
    color: color-mix(in oklch, var(--la-color-text-themed) 52%, transparent);
    border-color: rgb(var(--la-card-border-rgb) / 0.28);
    background-color: rgb(var(--la-card-tint-rgb) / 0.1);
  }
}

.search-button.is-compact {
  width: 30px;
  padding: 0;
  justify-content: center;

  .search-button__icon {
    font-size: 15px;
  }

  .search-button__label,
  .search-button__shortcut {
    display: none;
  }
}
</style>
