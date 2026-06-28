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
      <NTabPane :name="ratingPresetSlot" :tab="t('rating.label')">
        <RatingPresetPane />
      </NTabPane>
      <NTabPane :name="junglePresetSlot" :tab="t('jungle.label')">
        <JunglePresetPane />
      </NTabPane>
      <NTabPane :name="premadePresetSlot" :tab="t('premade.label')">
        <PremadePresetPane />
      </NTabPane>
      <NTabPane :name="fixedTextPresetSlot" :tab="t('fixedText.label')">
        <FixedTextPresetPane />
      </NTabPane>
    </NTabs>
  </div>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue'
import { NTabPane, NTabs } from 'naive-ui'

import { fixedTextPresetSlot } from './data/fixed-text'
import { junglePresetSlot } from './data/jungle'
import { premadePresetSlot } from './data/premade'
import { ratingPresetSlot } from './data/rating'
import FixedTextPresetPane from './presets-ui/FixedTextPresetPane.vue'
import JunglePresetPane from './presets-ui/JunglePresetPane.vue'
import PremadePresetPane from './presets-ui/PremadePresetPane.vue'
import RatingPresetPane from './presets-ui/RatingPresetPane.vue'
import { useInGameSendPresetsPanel } from './provider'

const { t } = useTranslation('renderer', { keyPrefix: 'InGameSend.presets' })
const { activePreset } = useInGameSendPresetsPanel()
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
