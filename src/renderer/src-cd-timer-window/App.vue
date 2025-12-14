<template>
  <div class="cd-timer-wrapper" ref="wrapper">
    <SetupInAppScope />
    <CdTimerWindowTitlebar />
    <SummonerSpellsCdTimer class="content" />
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { SetupInAppScope } from '@renderer-shared/shards/setup-in-app-scope/comp'
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

.cd-timer-wrapper {
  width: fit-content;
  display: flex;
  flex-direction: column;
  background-color: #1a1a1da0;
  border-radius: 4px;
  box-sizing: border-box;
  overflow: hidden;

  .content {
    opacity: 0.7;
    transition: opacity 0.3s;

    &:hover {
      opacity: 0.9;
    }
  }
}
</style>
