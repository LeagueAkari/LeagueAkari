<template>
  <div class="in-game-send-presets-panel">
    <NTabs
      v-model:value="activePreset"
      class="preset-tabs"
      type="line"
      size="medium"
      animated
      justify-content="start"
    >
      <NTabPane :name="ratingPreset.preset.id" :tab="ratingPreset.preset.label">
        <RatingPresetPane />
      </NTabPane>
      <NTabPane :name="junglePreset.preset.id" :tab="junglePreset.preset.label">
        <JunglePresetPane />
      </NTabPane>
      <NTabPane :name="premadePreset.preset.id" :tab="premadePreset.preset.label">
        <PremadePresetPane />
      </NTabPane>
    </NTabs>
  </div>
</template>

<script setup lang="ts">
import { NTabPane, NTabs } from 'naive-ui'

import JunglePresetPane from './JunglePresetPane.vue'
import PremadePresetPane from './PremadePresetPane.vue'
import { useInGameSendPresetsTestProvider } from './provider'
import RatingPresetPane from './RatingPresetPane.vue'

const { activePreset, ratingPreset, junglePreset, premadePreset } =
  useInGameSendPresetsTestProvider()
</script>

<style scoped>
.in-game-send-presets-panel {
  max-width: 100%;
  overflow: hidden;
}

.preset-tabs :deep(.n-tabs-nav) {
  padding: 8px 12px 0;
}

.preset-tabs :deep(.n-tab-pane) {
  box-sizing: border-box;
  padding: 8px 16px 16px;
}
</style>
