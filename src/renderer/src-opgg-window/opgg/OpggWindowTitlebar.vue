<template>
  <div
    class="relative z-10000000 flex h-(--la-titlebar-height) items-center"
    :class="{ blurred: ws.focus === 'blurred' }"
    style="-webkit-app-region: drag"
  >
    <div
      v-if="as.isMacOS"
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
        :title="ws.settings.pinned ? t('opgg.titlebar.unpin') : t('opgg.titlebar.pin')"
        class="flex h-full w-11.25 cursor-pointer items-center justify-center text-xs transition-all duration-300 hover:bg-black/10 active:brightness-80 dark:hover:bg-white/10"
        :class="{ 'bg-black/15 dark:bg-white/15': ws.settings.pinned }"
        style="-webkit-app-region: no-drag"
        @click="() => handlePin(!ws.settings.pinned)"
      >
        <NIcon><PinFilledIcon /></NIcon>
      </div>
      <div
        v-if="!as.isMacOS"
        :title="t('opgg.titlebar.minimize')"
        class="flex h-full w-11.25 cursor-pointer items-center justify-center text-xs transition-all duration-300 hover:bg-black/10 active:brightness-80 dark:hover:bg-white/10"
        style="-webkit-app-region: no-drag"
        @click="handleMinimize"
      >
        <NIcon style="transform: rotate(90deg)"><DividerShort20RegularIcon /></NIcon>
      </div>
      <div
        v-if="!as.isMacOS"
        :title="t('opgg.titlebar.close')"
        class="flex h-full w-11.25 cursor-pointer items-center justify-center text-xs transition-all duration-300 hover:bg-red-600 hover:text-white active:brightness-80 dark:hover:bg-red-500"
        style="-webkit-app-region: no-drag"
        @click="handleClose"
      >
        <NIcon><CloseIcon /></NIcon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
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
const as = useAppCommonStore()

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
