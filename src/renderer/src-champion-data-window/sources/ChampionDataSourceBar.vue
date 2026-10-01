<template>
  <div
    class="box-border flex h-(--la-titlebar-height) shrink-0 items-stretch border-b border-black/8 [-webkit-app-region:drag] dark:border-white/8"
  >
    <div
      v-if="appCommon.isMacOS"
      class="w-(--la-mac-titlebar-safe-left) shrink-0 [-webkit-app-region:no-drag]"
    />
    <div class="flex min-w-0 flex-1 items-stretch gap-4 px-2">
      <button
        v-for="source in sources"
        :key="source"
        type="button"
        :aria-pressed="source === activeSource"
        class="relative m-0 flex shrink-0 cursor-pointer appearance-none items-center gap-1.5 border-0 bg-transparent p-0 font-[inherit] text-xs leading-normal text-black/48 transition-colors [-webkit-app-region:no-drag] hover:text-black/80 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-500 dark:text-white/48 dark:hover:text-white/82"
        :class="{
          'text-blue-600! dark:text-blue-400!': source === activeSource
        }"
        @click="$emit('select', source)"
      >
        <OpggIcon v-if="source === 'opgg'" class="size-4" />
        <span
          v-else
          class="flex h-4 min-w-5 items-center justify-center rounded-sm border border-current px-0.5 text-[9px] leading-none font-bold"
        >
          101
        </span>
        <span>{{ t(`opgg.filters.sources.${source}`) }}</span>
        <span
          v-if="source === activeSource"
          class="absolute right-0 bottom-0 left-0 h-0.5 rounded-t bg-blue-600 dark:bg-blue-400"
        />
      </button>
    </div>

    <div class="flex shrink-0 items-center gap-1 pr-2 [-webkit-app-region:no-drag]">
      <NButton
        v-if="activeSource === 'qq101'"
        text
        size="tiny"
        class="size-6!"
        :focusable="false"
        :title="t('opgg.filters.refresh')"
        :disabled="sources.length === 0"
        :loading="isLoading"
        @click="refresh"
      >
        <template #icon>
          <NIcon>
            <RefreshSharp />
          </NIcon>
        </template>
      </NButton>
      <NButton
        text
        size="tiny"
        class="size-6!"
        :focusable="false"
        :title="t('opgg.filters.settings.button')"
        @click="settingsShown = true"
      >
        <template #icon>
          <NIcon>
            <Settings />
          </NIcon>
        </template>
      </NButton>
    </div>
    <div
      class="flex h-full justify-end transition-all duration-300 ease-in-out"
      :class="{ 'brightness-80': windowStore.focus === 'blurred' }"
    >
      <div
        :title="windowStore.settings.pinned ? t('opgg.titlebar.unpin') : t('opgg.titlebar.pin')"
        class="flex h-full w-11.25 cursor-pointer items-center justify-center text-xs transition-all duration-300 hover:bg-black/10 active:brightness-80 dark:hover:bg-white/10"
        :class="{ 'bg-black/15 dark:bg-white/15': windowStore.settings.pinned }"
        style="-webkit-app-region: no-drag"
        @click="() => windowManager.championDataWindow.setPinned(!windowStore.settings.pinned)"
      >
        <NIcon><PinFilled /></NIcon>
      </div>
      <div
        v-if="!appCommon.isMacOS"
        :title="t('opgg.titlebar.minimize')"
        class="flex h-full w-11.25 cursor-pointer items-center justify-center text-xs transition-all duration-300 hover:bg-black/10 active:brightness-80 dark:hover:bg-white/10"
        style="-webkit-app-region: no-drag"
        @click="windowManager.championDataWindow.minimize()"
      >
        <NIcon style="transform: rotate(90deg)"><DividerShort20Regular /></NIcon>
      </div>
      <div
        v-if="!appCommon.isMacOS"
        :title="t('opgg.titlebar.close')"
        class="flex h-full w-11.25 cursor-pointer items-center justify-center text-xs transition-all duration-300 hover:bg-red-600 hover:text-white active:brightness-80 dark:hover:bg-red-500"
        style="-webkit-app-region: no-drag"
        @click="windowManager.championDataWindow.hide()"
      >
        <NIcon><Close /></NIcon>
      </div>
    </div>

    <NModal v-model:show="settingsShown" transform-origin="center">
      <div class="w-125 max-w-[90vw]">
        <SettingsPane @close="settingsShown = false" />
      </div>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import OpggIcon from '@renderer-shared/assets/icon/OpggIcon.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { ChampionDataRenderer } from '@renderer-shared/shards/champion-data'
import { useChampionDataStore } from '@renderer-shared/shards/champion-data/store'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useChampionDataWindowStore } from '@renderer-shared/shards/window-manager/store'
import { PinFilled } from '@vicons/carbon'
import { DividerShort20Regular } from '@vicons/fluent'
import type { ChampionDataSourceId } from '@shared/types/champion-data'
import { Close, RefreshSharp, Settings } from '@vicons/ionicons5'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NModal } from 'naive-ui'
import { computed, ref } from 'vue'

import SettingsPane from '../opgg/widgets/Settings.vue'

defineProps<{
  sources: readonly ChampionDataSourceId[]
  activeSource: ChampionDataSourceId | null
}>()

defineEmits<{
  select: [source: ChampionDataSourceId]
}>()

const { t } = useTranslation()
const appCommon = useAppCommonStore()
const windowStore = useChampionDataWindowStore()
const windowManager = useInstance(WindowManagerRenderer)
const championData = useInstance(ChampionDataRenderer)
const store = useChampionDataStore()
const isLoading = computed(() => store.qq101.isLoading)
const settingsShown = ref(false)

const refresh = () => {
  void championData.qq101.refresh()
}
</script>
