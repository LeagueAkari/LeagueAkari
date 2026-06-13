<template>
  <div class="flex flex-col pt-2">
    <div class="text-xs leading-relaxed text-black/60 dark:text-white/70">
      {{ preset.description }}
    </div>

    <PresetSendControls />
    <PremadeSelectionPanel />
    <PreviewPanel />
  </div>
</template>

<script setup lang="ts">
import { provideCurrentPreset, providePremadeSelectionPreset, usePremadePreset } from './context'
import PremadeSelectionPanel from './PremadeSelectionPanel.vue'
import PresetSendControls from './PresetSendControls.vue'
import PreviewPanel from './PreviewPanel.vue'

const premadePreset = usePremadePreset()
const { preset } = premadePreset

provideCurrentPreset(premadePreset)
providePremadeSelectionPreset(premadePreset.premadeSelection)
</script>
