<template>
  <div class="flex flex-col pt-2">
    <div class="text-xs leading-relaxed text-black/60 dark:text-white/70">
      {{ t('description') }}
    </div>

    <PresetSendControls :preset="premadePreset" :preset-label="presetLabel" />
    <PremadeSelectionPanel :selection="premadePreset.premadeSelection" />
    <PreviewPanel :preset="premadePreset" :preset-label="presetLabel" />
  </div>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

import { usePremadePreset } from '../data/premade'
import PremadeSelectionPanel from '../widgets/PremadeSelectionPanel.vue'
import PresetSendControls from '../widgets/PresetSendControls.vue'
import PreviewPanel from '../widgets/PreviewPanel.vue'

const premadePreset = usePremadePreset()
const { t } = useTranslation('renderer', { keyPrefix: 'InGameSend.presets.premade' })
const presetLabel = computed(() => t('label'))
</script>
