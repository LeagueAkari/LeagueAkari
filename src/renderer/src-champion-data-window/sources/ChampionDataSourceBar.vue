<template>
  <div
    class="box-border flex h-(--la-titlebar-height) shrink-0 items-stretch border-b border-black/8 [-webkit-app-region:drag] dark:border-white/8"
  >
    <div
      v-if="appCommon.isMacOS"
      class="w-(--la-mac-titlebar-safe-left) shrink-0 [-webkit-app-region:no-drag]"
    />
    <div class="flex min-w-0 flex-1 items-stretch gap-4 px-2">
      <NTooltip v-for="tab in tabs" :key="tab.id" placement="bottom" :disabled="tab.enabled">
        <template #trigger>
          <span
            class="flex shrink-0 [-webkit-app-region:no-drag]"
            :class="{ 'cursor-not-allowed': !tab.enabled }"
          >
            <button
              type="button"
              :aria-pressed="tab.id === activeTab"
              :disabled="!tab.enabled"
              class="relative m-0 flex h-full shrink-0 cursor-pointer appearance-none items-center gap-1.5 border-0 bg-transparent p-0 font-[inherit] text-xs leading-normal text-black/48 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-500 enabled:hover:text-black/80 disabled:pointer-events-none disabled:opacity-35 dark:text-white/48 dark:enabled:hover:text-white/82"
              :class="{
                'text-blue-600! dark:text-blue-400!': tab.id === activeTab
              }"
              @click="$emit('select', tab.id)"
            >
              <NIcon v-if="tab.id === 'settings'" class="size-4 text-base"><Settings /></NIcon>
              <OpggIcon v-else-if="tab.id === 'opgg'" class="size-4" />
              <span
                v-else
                class="flex h-4 min-w-5 items-center justify-center rounded-sm border border-current px-0.5 text-[9px] leading-none font-bold"
              >
                101
              </span>
              <span>{{ tab.label }}</span>
              <span
                v-if="tab.id === activeTab"
                class="absolute right-0 bottom-0 left-0 h-0.5 rounded-t bg-blue-600 dark:bg-blue-400"
              />
            </button>
          </span>
        </template>
        {{ t(tab.available ? 'opgg.sources.disabled' : 'opgg.sources.unavailable') }}
      </NTooltip>
    </div>

    <div
      class="flex h-full justify-end transition-all duration-300 ease-in-out"
      :class="{ 'brightness-80': windowStore.focus === 'blurred' }"
    >
      <NTooltip placement="bottom">
        <template #trigger>
          <div
            class="flex h-full w-11.25 cursor-pointer items-center justify-center text-xs transition-all duration-300 hover:bg-black/10 active:brightness-80 dark:hover:bg-white/10"
            :class="{ 'bg-black/15 dark:bg-white/15': windowStore.settings.pinned }"
            style="-webkit-app-region: no-drag"
            @click="() => windowManager.championDataWindow.setPinned(!windowStore.settings.pinned)"
          >
            <NIcon><PinFilled /></NIcon>
          </div>
        </template>
        {{ windowStore.settings.pinned ? t('opgg.titlebar.unpin') : t('opgg.titlebar.pin') }}
      </NTooltip>
      <NTooltip v-if="!appCommon.isMacOS" placement="bottom">
        <template #trigger>
          <div
            class="flex h-full w-11.25 cursor-pointer items-center justify-center text-xs transition-all duration-300 hover:bg-black/10 active:brightness-80 dark:hover:bg-white/10"
            style="-webkit-app-region: no-drag"
            @click="windowManager.championDataWindow.minimize()"
          >
            <NIcon style="transform: rotate(90deg)"><DividerShort20Regular /></NIcon>
          </div>
        </template>
        {{ t('opgg.titlebar.minimize') }}
      </NTooltip>
      <NTooltip v-if="!appCommon.isMacOS" placement="bottom">
        <template #trigger>
          <div
            class="flex h-full w-11.25 cursor-pointer items-center justify-center text-xs transition-all duration-300 hover:bg-red-600 hover:text-white active:brightness-80 dark:hover:bg-red-500"
            style="-webkit-app-region: no-drag"
            @click="windowManager.championDataWindow.hide()"
          >
            <NIcon><Close /></NIcon>
          </div>
        </template>
        {{ t('opgg.titlebar.close') }}
      </NTooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import OpggIcon from '@renderer-shared/assets/icon/OpggIcon.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useChampionDataWindowStore } from '@renderer-shared/shards/window-manager/store'
import { PinFilled } from '@vicons/carbon'
import { DividerShort20Regular } from '@vicons/fluent'
import type { ChampionDataSourceId } from '@shared/types/champion-data'
import { Close, Settings } from '@vicons/ionicons5'
import { useTranslation } from 'i18next-vue'
import { NIcon, NTooltip } from 'naive-ui'
import { computed } from 'vue'

import type { ChampionDataSourceOption } from './use-champion-data-sources'

const props = defineProps<{
  sources: readonly ChampionDataSourceOption[]
  activeTab: ChampionDataSourceId | 'settings' | null
}>()

defineEmits<{
  select: [tab: ChampionDataSourceId | 'settings']
}>()

const { t } = useTranslation()
const appCommon = useAppCommonStore()
const windowStore = useChampionDataWindowStore()
const windowManager = useInstance(WindowManagerRenderer)

const tabs = computed(() => [
  ...props.sources.map((source) => ({
    ...source,
    label: t(`opgg.filters.sources.${source.id}`)
  })),
  ...(props.sources.some((source) => source.available)
    ? [
        {
          id: 'settings' as const,
          enabled: true,
          available: true,
          label: t('opgg.filters.settings.button')
        }
      ]
    : [])
])
</script>
