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
              class="group relative m-0 flex h-full shrink-0 cursor-pointer appearance-none items-center gap-1.5 border-0 bg-transparent p-0 font-[inherit] text-xs leading-normal text-black/48 transition-colors focus-visible:outline-hidden enabled:hover:text-black/80 disabled:pointer-events-none disabled:opacity-35 dark:text-white/48 dark:enabled:hover:text-white/82"
              :class="{
                'text-blue-600! dark:text-blue-400!': tab.id === activeTab
              }"
              @click="$emit('select', tab.id)"
            >
              <NIcon v-if="tab.id === 'activity'" :size="16"><Pulse /></NIcon>
              <OpggIcon v-else-if="tab.id === 'opgg'" class="size-4" />
              <span
                v-else
                class="flex h-4 min-w-5 items-center justify-center rounded-sm border border-current px-0.5 text-[9px] leading-none font-bold"
              >
                101
              </span>
              <span class="underline-offset-4 group-focus-visible:underline">{{ tab.label }}</span>
              <span
                v-if="tab.id === activeTab"
                class="absolute right-0 bottom-0 left-0 h-0.5 rounded-t bg-blue-600 dark:bg-blue-400"
              />
            </button>
          </span>
        </template>
        {{ t('opgg.sources.disabled') }}
      </NTooltip>
    </div>

    <div
      class="flex h-full shrink-0 items-center justify-end transition-all duration-300 ease-in-out"
      :class="{ 'brightness-80': windowStore.focus === 'blurred' }"
    >
      <div
        class="flex items-center gap-1 px-2 [-webkit-app-region:no-drag]"
        @mousedown.left.prevent
      >
        <NTooltip placement="bottom">
          <template #trigger>
            <NButton
              size="tiny"
              quaternary
              :type="windowStore.settings.pinned ? 'primary' : 'default'"
              :aria-pressed="windowStore.settings.pinned"
              :aria-label="pinLabel"
              class="h-7! w-7! p-0!"
              @click="windowManager.secondaryWindow.setPinned(!windowStore.settings.pinned)"
            >
              <template #icon>
                <NIcon :size="16"
                  ><PinFilled v-if="windowStore.settings.pinned" /><Pin v-else
                /></NIcon>
              </template>
            </NButton>
          </template>
          {{ pinLabel }}
        </NTooltip>
        <NTooltip placement="bottom">
          <template #trigger>
            <NButton
              size="tiny"
              quaternary
              :aria-label="t('secondaryWindow.settings')"
              class="h-7! w-7! p-0!"
              @click="$emit('settings')"
            >
              <template #icon
                ><NIcon :size="16"><Settings /></NIcon
              ></template>
            </NButton>
          </template>
          {{ t('secondaryWindow.settings') }}
        </NTooltip>
      </div>
      <NTooltip v-if="!appCommon.isMacOS" placement="bottom">
        <template #trigger>
          <button
            type="button"
            tabindex="-1"
            :aria-label="t('secondaryWindow.minimize')"
            class="m-0 flex h-full w-11.25 cursor-pointer appearance-none items-center justify-center border-0 bg-transparent p-0 font-[inherit] text-xs text-inherit transition-colors duration-300 [-webkit-app-region:no-drag] hover:bg-black/10 active:brightness-80 dark:hover:bg-white/10"
            @mousedown.left.prevent
            @click="windowManager.secondaryWindow.minimize()"
          >
            <NIcon style="transform: rotate(90deg)"><DividerShort20Regular /></NIcon>
          </button>
        </template>
        {{ t('secondaryWindow.minimize') }}
      </NTooltip>
      <NTooltip v-if="!appCommon.isMacOS" placement="bottom">
        <template #trigger>
          <button
            type="button"
            tabindex="-1"
            :aria-label="t('secondaryWindow.close')"
            class="m-0 flex h-full w-11.25 cursor-pointer appearance-none items-center justify-center border-0 bg-transparent p-0 font-[inherit] text-xs text-inherit transition-colors duration-300 [-webkit-app-region:no-drag] hover:bg-red-600 hover:text-white active:brightness-80 dark:hover:bg-red-500"
            @mousedown.left.prevent
            @click="windowManager.secondaryWindow.hide()"
          >
            <NIcon><Close /></NIcon>
          </button>
        </template>
        {{ t('secondaryWindow.close') }}
      </NTooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import OpggIcon from '@renderer-shared/assets/icon/OpggIcon.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useSecondaryWindowStore } from '@renderer-shared/shards/window-manager/store'
import { Pin, PinFilled } from '@vicons/carbon'
import { DividerShort20Regular } from '@vicons/fluent'
import type { ChampionDataSourceId } from '@shared/types/champion-data'
import { Close, Pulse, Settings } from '@vicons/ionicons5'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NTooltip } from 'naive-ui'
import { computed } from 'vue'

import type { ChampionDataSourceOption } from '../sources/use-champion-data-sources'

const props = defineProps<{
  sources: readonly ChampionDataSourceOption[]
  activeTab: ChampionDataSourceId | 'activity' | null
}>()

defineEmits<{
  select: [tab: ChampionDataSourceId | 'activity']
  settings: []
}>()

const { t } = useTranslation()
const appCommon = useAppCommonStore()
const windowStore = useSecondaryWindowStore()
const windowManager = useInstance(WindowManagerRenderer)

const tabs = computed(() => [
  { id: 'activity' as const, label: t('activity.title'), enabled: true },
  ...props.sources.map((source) => ({
    ...source,
    label: t(`opgg.filters.sources.${source.id}`)
  }))
])

const pinLabel = computed(() =>
  windowStore.settings.pinned ? t('secondaryWindow.unpin') : t('secondaryWindow.pin')
)
</script>
