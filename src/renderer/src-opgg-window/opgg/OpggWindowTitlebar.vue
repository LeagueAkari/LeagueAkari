<template>
  <div
    class="relative z-10000000 flex h-(--la-titlebar-height) items-center"
    :class="{ blurred: ws.focus === 'blurred' }"
    style="-webkit-app-region: drag"
  >
    <div
      v-if="isMacOS"
      class="h-full w-(--la-mac-titlebar-safe-left) shrink-0 [-webkit-app-region:no-drag]"
    />

    <div
      class="box-border flex h-full flex-1 items-center pt-1 pr-1 pb-0.5 pl-2 transition-all duration-300"
      :class="{ 'brightness-80': ws.focus === 'blurred' }"
    >
      <span
        class="text-xs text-black/85 dark:text-white/85"
        :class="{ 'brightness-80': ws.focus === 'blurred' }"
      >
        {{ $t('appName', { ns: 'common' }) }} - OP.GG
      </span>
    </div>
    <div
      class="flex h-full justify-end transition-all duration-300 ease-in-out"
      :class="{ 'brightness-80': ws.focus === 'blurred' }"
    >
      <div
        :title="ws.settings.pinned ? t('OpggWindowTitlebar.unpin') : t('OpggWindowTitlebar.pin')"
        class="flex h-full w-[45px] cursor-pointer items-center justify-center text-xs transition-all duration-300 hover:bg-black/10 active:brightness-80 dark:hover:bg-white/10"
        :class="{ 'bg-black/15 dark:bg-white/15': ws.settings.pinned }"
        style="-webkit-app-region: no-drag"
        @click="() => handlePin(!ws.settings.pinned)"
      >
        <NIcon><PinFilledIcon /></NIcon>
      </div>
      <div
        :title="t('OpggWindowTitlebar.minimize')"
        class="flex h-full w-[45px] cursor-pointer items-center justify-center text-xs transition-all duration-300 hover:bg-black/10 active:brightness-80 dark:hover:bg-white/10"
        style="-webkit-app-region: no-drag"
        @click="handleMinimize"
      >
        <NIcon style="transform: rotate(90deg)"><DividerShort20RegularIcon /></NIcon>
      </div>
      <div
        :title="t('OpggWindowTitlebar.close')"
        class="flex h-full w-[45px] cursor-pointer items-center justify-center text-xs transition-all duration-300 hover:bg-red-600 hover:text-white active:brightness-80 dark:hover:bg-red-500"
        style="-webkit-app-region: no-drag"
        @click="handleClose"
      >
        <NIcon><CloseIcon /></NIcon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlatform } from '@renderer-shared/composables/usePlatform'
import { useInstance } from '@renderer-shared/shards'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useOpggWindowStore } from '@renderer-shared/shards/window-manager/store'
import { PinFilled as PinFilledIcon } from '@vicons/carbon'
import { DividerShort20Regular as DividerShort20RegularIcon } from '@vicons/fluent'
import { Close as CloseIcon } from '@vicons/ionicons5'
import { useTranslation } from 'i18next-vue'
import { NIcon } from 'naive-ui'

const { t } = useTranslation()

const wm = useInstance(WindowManagerRenderer)
const ws = useOpggWindowStore()
const { isMacOS } = usePlatform()

const handleClose = () => {
  return wm.opggWindow.hide()
}

const handleMinimize = () => {
  return wm.opggWindow.minimize()
}

const handlePin = (b: boolean) => {
  return wm.opggWindow.setPinned(b)
}
</script>

<style scoped></style>
