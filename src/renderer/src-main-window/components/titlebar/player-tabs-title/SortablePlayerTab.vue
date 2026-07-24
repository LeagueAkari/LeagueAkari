<template>
  <div
    ref="element"
    class="tab"
    :class="{
      active,
      'drag-hover': isDropTarget && !isDragSource,
      'drag-source': isDragSource
    }"
    :data-player-tab-id="displayTab.id"
    role="tab"
    :aria-selected="active"
    :tabindex="active ? 0 : -1"
    @click="emit('activate')"
    @dblclick="emit('close')"
    @contextmenu="emit('contextmenu', $event)"
    @keydown.enter="emit('activate')"
    @keydown.space.prevent="emit('activate')"
    @mouseup="handleMouseUp"
  >
    <Transition name="fade" mode="out-in">
      <NSpin v-if="displayTab.loading" :size="12" class="tab-icon" />
      <ChampionIcon
        v-else-if="displayTab.championId"
        class="tab-icon"
        :stretched="false"
        :champion-id="displayTab.championId"
      />
      <LcuImage
        v-else-if="displayTab.profileIconId !== undefined"
        class="tab-icon"
        :src="profileIconUri(displayTab.profileIconId)"
      />
      <div v-else class="tab-icon tab-icon-placeholder" />
    </Transition>

    <div v-if="displayTab.serverLabel" class="sgp-server">{{ displayTab.serverLabel }}</div>

    <div v-if="displayTab.gameName" class="summoner-name">
      <span class="game-name-line">{{ displayTab.gameName }}</span>
      <span v-if="displayTab.tagLine" class="tag-line"> #{{ displayTab.tagLine }}</span>
    </div>
    <span v-else-if="displayTab.loading" class="empty-placeholder-text">
      {{ t('playerTabs.titlebar.loading') }}.
    </span>
    <span v-else class="empty-placeholder-text">{{ fallbackId }}</span>

    <button
      type="button"
      class="close-icon"
      :aria-label="t('playerTabs.titlebar.close')"
      :title="t('playerTabs.titlebar.close')"
      @click.stop="emit('close')"
      @dblclick.stop
    >
      <NIcon><CloseIcon /></NIcon>
    </button>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { profileIconUri } from '@renderer-shared/shards/league-client/game-data-assets'
import { useSortable } from '@dnd-kit/vue/sortable'
import { Close as CloseIcon } from '@vicons/carbon'
import { useTranslation } from 'i18next-vue'
import { NIcon, NSpin } from 'naive-ui'
import { computed, shallowRef, useTemplateRef, watch } from 'vue'

import type { PlayerTabStripItem } from './types'

const props = defineProps<{
  tab: PlayerTabStripItem
  index: number
  active: boolean
}>()

const emit = defineEmits<{
  activate: []
  close: []
  contextmenu: [event: MouseEvent]
}>()

const { t } = useTranslation()
const element = useTemplateRef<HTMLElement>('element')

const { isDragSource, isDropTarget, isDropping } = useSortable({
  id: computed(() => props.tab.id),
  index: computed(() => props.index),
  group: 'player-tabs-title',
  type: 'player-tab',
  accept: 'player-tab',
  element,
  handle: element,
  data: computed(() => ({ tabId: props.tab.id })),
  transition: {
    duration: 180,
    easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    idle: true
  }
})

const frozenTab = shallowRef<PlayerTabStripItem | null>(null)

watch(
  [isDragSource, isDropping],
  ([dragSource, dropping]) => {
    if (dragSource && !frozenTab.value) {
      frozenTab.value = { ...props.tab }
    } else if (!dragSource && !dropping) {
      frozenTab.value = null
    }
  },
  { flush: 'sync' }
)

const displayTab = computed(() => frozenTab.value || props.tab)
const fallbackId = computed(() => `${displayTab.value.id.slice(0, 16)}...`)

const handleMouseUp = (event: MouseEvent) => {
  if (event.button === 1) {
    emit('close')
  }
}
</script>

<style scoped>
.tab {
  height: 100%;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0 4px 0 8px;
  box-sizing: border-box;
  border-radius: 4px;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  cursor: pointer;
  user-select: none;
  -webkit-app-region: no-drag;
  transition:
    background-color 0.2s,
    filter 0.2s,
    opacity 0.2s;
  line-height: 1;
  filter: brightness(0.7);
  border: 1px solid rgba(0, 0, 0, 0);
  background-color: rgba(0, 0, 0, 0.1);

  [data-theme='dark'] & {
    background-color: rgba(255, 255, 255, 0.05);
  }

  &:hover {
    filter: brightness(0.8);
    background-color: rgba(0, 0, 0, 0.1);

    [data-theme='dark'] & {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }

  &:focus-visible {
    outline: 2px solid var(--la-color-link);
    outline-offset: -2px;
  }

  &.drag-source {
    z-index: 1;
    cursor: grabbing;
    filter: brightness(1);
    opacity: 0.78;
  }

  &.drag-hover {
    filter: brightness(0.8);
    background-color: rgba(0, 0, 0, 0.4);

    [data-theme='dark'] & {
      background-color: rgba(255, 255, 255, 0.4);
    }
  }

  &.active {
    filter: brightness(1);
    background-color: rgba(0, 0, 0, 0);
    border-top: 1px solid rgba(0, 0, 0, 0.2);
    border-left: 1px solid rgba(0, 0, 0, 0.2);
    border-right: 1px solid rgba(0, 0, 0, 0.2);

    [data-theme='dark'] & {
      background-color: rgba(255, 255, 255, 0.12);
      border-top: 1px solid rgba(0, 0, 0, 0);
      border-left: 1px solid rgba(0, 0, 0, 0);
      border-right: 1px solid rgba(0, 0, 0, 0);
    }
  }
}

.tab-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 4px;
  width: 16px;
  height: 16px;
  border-radius: 2px;
}

.tab-icon-placeholder {
  background-color: rgba(0, 0, 0, 0.1);

  [data-theme='dark'] & {
    background-color: rgba(255, 255, 255, 0.1);
  }
}

.close-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin: 0 0 0 4px;
  padding: 0;
  border: 0;
  border-radius: 2px;
  background: transparent;
  color: rgba(0, 0, 0, 0.8);
  font: inherit;
  font-size: 16px;
  line-height: 0;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.2);
  }

  &:focus-visible {
    outline: 1px solid currentColor;
    outline-offset: 1px;
  }

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.8);

    &:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
  }
}

.sgp-server {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: bold;
  margin-right: 4px;
  color: rgba(111, 151, 136, 0.9);

  [data-theme='dark'] & {
    color: rgba(174, 245, 219, 0.8);
  }
}

.summoner-name {
  display: flex;
  align-items: flex-end;
  white-space: nowrap;
}

.empty-placeholder-text {
  flex-shrink: 0;
  white-space: nowrap;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.8);

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.8);
  }
}

.game-name-line {
  font-size: 12px;
  font-weight: bold;
  margin-right: 4px;
  color: rgba(0, 0, 0, 1);

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 1);
  }
}

.tag-line {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.8);

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.8);
  }
}

[data-theme-id]:not([data-theme-id='light']):not([data-theme-id='dark']) .tab {
  background-color: rgb(var(--la-card-tint-rgb) / 0.08);
  border-color: rgb(var(--la-card-border-rgb) / 0);

  &:hover {
    background-color: color-mix(in oklch, var(--la-color-link) 18%, transparent);
  }

  .tab-icon-placeholder {
    background-color: rgb(var(--la-card-tint-rgb) / 0.18);
  }

  .close-icon {
    color: color-mix(in oklch, var(--la-color-text-themed) 86%, transparent);

    &:hover {
      background-color: color-mix(in oklch, var(--la-color-link) 24%, transparent);
    }
  }

  .sgp-server {
    color: color-mix(in oklch, var(--la-color-link) 90%, transparent);
  }

  .empty-placeholder-text {
    color: color-mix(in oklch, var(--la-color-text-themed) 86%, transparent);
  }

  .game-name-line {
    color: var(--la-color-text-themed);
  }

  .tag-line {
    color: color-mix(in oklch, var(--la-color-text-themed) 74%, transparent);
  }

  &.active {
    background-color: color-mix(in oklch, var(--la-color-link) 22%, transparent);
    border-top: 1px solid rgb(var(--la-card-border-rgb) / 0.32);
    border-left: 1px solid rgb(var(--la-card-border-rgb) / 0.32);
    border-right: 1px solid rgb(var(--la-card-border-rgb) / 0.32);
  }

  &.drag-hover {
    background-color: color-mix(in oklch, var(--la-color-link) 35%, transparent);
  }
}

.fade-enter-active {
  position: relative;
  transition: opacity 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
}

.fade-enter-to {
  opacity: 1;
}
</style>
