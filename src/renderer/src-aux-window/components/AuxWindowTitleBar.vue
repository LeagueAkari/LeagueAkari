<template>
  <div
    class="relative z-10000000 flex h-(--la-titlebar-height) items-center [-webkit-app-region:drag]"
    :class="{ 'brightness-80': aws.focus === 'blurred' }"
  >
    <div
      class="flex h-full flex-1 items-center px-2 pt-1 pb-0.5 transition-all"
      :class="{ 'brightness-80': aws.focus === 'blurred' }"
    >
      <span class="text-xs text-black/90 dark:text-white/90"
        >{{ t('appName', { ns: 'common' }) }} - Mini</span
      >
    </div>
    <div
      class="flex h-full justify-end transition-all"
      :class="{ 'brightness-80': aws.focus === 'blurred' }"
    >
      <div
        :title="aws.settings.pinned ? t('AuxWindowTitlebar.unpin') : t('AuxWindowTitlebar.pin')"
        class="flex h-full w-[45px] cursor-pointer items-center justify-center text-xs text-black/80 transition-all [-webkit-app-region:no-drag] active:brightness-80 dark:text-white/80"
        :class="{
          'bg-black/15 dark:bg-white/15': aws.settings.pinned,
          'hover:bg-black/20 hover:text-black dark:hover:bg-white/20 dark:hover:text-white':
            !aws.settings.pinned
        }"
        @click="() => handlePin(!aws.settings.pinned)"
      >
        <NIcon><PinFilledIcon /></NIcon>
      </div>
      <div
        :title="t('AuxWindowTitlebar.minimize')"
        class="flex h-full w-[45px] cursor-pointer items-center justify-center text-xs text-black/80 transition-all [-webkit-app-region:no-drag] hover:bg-black/20 hover:text-black active:brightness-80 dark:text-white/80 dark:hover:bg-white/20 dark:hover:text-white"
        @click="handleMinimize"
      >
        <NIcon class="rotate-90"><DividerShort20RegularIcon /></NIcon>
      </div>
      <div
        :title="t('AuxWindowTitlebar.close')"
        class="flex h-full w-[45px] cursor-pointer items-center justify-center text-xs transition-all [-webkit-app-region:no-drag] hover:bg-red-600 hover:text-white active:brightness-80"
        @click="handleClose"
      >
        <NIcon><CloseIcon /></NIcon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useAuxWindowStore } from '@renderer-shared/shards/window-manager/store'
import { PinFilled as PinFilledIcon } from '@vicons/carbon'
import { DividerShort20Regular as DividerShort20RegularIcon } from '@vicons/fluent'
import { Close as CloseIcon } from '@vicons/ionicons5'
import { useTranslation } from 'i18next-vue'
import { NIcon } from 'naive-ui'

const { t } = useTranslation()

const wm = useInstance(WindowManagerRenderer)
const aws = useAuxWindowStore()

const handleClose = () => {
  return wm.auxWindow.hide()
}

const handleMinimize = () => {
  return wm.auxWindow.minimize()
}

const handlePin = (b: boolean) => {
  return wm.auxWindow.setPinned(b)
}
</script>

<style scoped></style>
