<template>
  <div
    class="box-border flex w-fit flex-col overflow-hidden rounded bg-[#1a1a1da0]"
    ref="wrapper"
    @mouseenter="wm.cdTimerWindow.setIgnoreMouseEvents(false)"
    @mouseleave="wm.cdTimerWindow.setIgnoreMouseEvents(true, { forward: true })"
  >
    <SetupInAppScope />
    <CdTimerWindowTitlebar />
    <SummonerSpellsCdTimer class="opacity-70 transition-opacity hover:opacity-90" />
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { SetupInAppScope } from '@renderer-shared/shards/setup-in-app-scope/setup-in-app-scope-component'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useElementSize } from '@vueuse/core'
import { useTemplateRef, watch } from 'vue'

import CdTimerWindowTitlebar from './components/CdTimerWindowTitlebar.vue'
import SummonerSpellsCdTimer from './components/SummonerSpellsCdTimer.vue'

const wrapperEl = useTemplateRef('wrapper')

const { height, width } = useElementSize(wrapperEl)
const wm = useInstance(WindowManagerRenderer)

watch(
  [() => width.value, () => height.value],
  async ([width, height]) => {
    await wm.cdTimerWindow.setSize(Math.ceil(width), Math.ceil(height))
  },
  {
    immediate: true
  }
)
</script>

<style>
html,
body,
#app {
  width: fit-content;
  height: fit-content;
}
</style>
