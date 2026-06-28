<template>
  <div class="flex flex-col pt-2">
    <div class="text-xs leading-relaxed text-black/60 dark:text-white/70">
      {{ t('description') }}
    </div>

    <PresetSendControls :preset="premadePreset" :preset-label="presetLabel" />
    <PreviewPanel :preset="premadePreset" />

    <NameDisplayStrategySelector
      :value="options.nameDisplayStrategy"
      @update:value="updateNameDisplayStrategy"
    />

    <PremadeSelectionPanel :selection="premadePreset.premadeSelection" />
  </div>
</template>

<script setup lang="ts">
import type {
  InGameSendPremadePresetOptionPatch,
  InGameSendPresetNameDisplayStrategy
} from '@shared/shards/in-game-send'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

import { usePremadePreset } from '../data/premade'
import NameDisplayStrategySelector from '../widgets/NameDisplayStrategySelector.vue'
import PremadeSelectionPanel from '../widgets/PremadeSelectionPanel.vue'
import PresetSendControls from '../widgets/PresetSendControls.vue'
import PreviewPanel from '../widgets/PreviewPanel.vue'

const premadePreset = usePremadePreset()
const { options, updateOptions } = premadePreset
const { t } = useTranslation('renderer', { keyPrefix: 'InGameSend.presets.premade' })
const presetLabel = computed(() => t('label'))

function updateNameDisplayStrategy(value: InGameSendPresetNameDisplayStrategy) {
  const patch: InGameSendPremadePresetOptionPatch = {
    nameDisplayStrategy: value
  }

  void updateOptions(patch)
}
</script>
