<template>
  <div class="flex flex-col pt-2">
    <div class="text-xs leading-relaxed text-black/60 dark:text-white/70">
      {{ t('description') }}
    </div>

    <PresetSendControls :preset="premadePreset" :preset-label="presetLabel" />
    <PreviewPanel :preset="premadePreset" />

    <div class="pt-3">
      <div class="mb-2 text-xs font-semibold text-black/70 dark:text-white/70">
        {{ t('nameDisplayStrategy.title') }}
      </div>
      <NRadioGroup :value="options.nameDisplayStrategy" @update:value="updateNameDisplayStrategy">
        <div class="grid gap-2">
          <NRadio
            v-for="option of nameDisplayStrategyOptions"
            :key="option.value"
            :value="option.value"
          >
            <div class="flex flex-col leading-tight">
              <span class="text-xs">{{ option.label }}</span>
              <span class="text-[11px] text-black/45 dark:text-white/45">
                {{ option.description }}
              </span>
            </div>
          </NRadio>
        </div>
      </NRadioGroup>
    </div>

    <PremadeSelectionPanel :selection="premadePreset.premadeSelection" />
  </div>
</template>

<script setup lang="ts">
import type {
  InGameSendPremadePresetOptionPatch,
  InGameSendPresetNameDisplayStrategy
} from '@shared/shards/in-game-send'
import { useTranslation } from 'i18next-vue'
import { NRadio, NRadioGroup } from 'naive-ui'
import { computed } from 'vue'

import { usePremadePreset } from '../data/premade'
import type { PresetDisplayOption } from '../types'
import PremadeSelectionPanel from '../widgets/PremadeSelectionPanel.vue'
import PresetSendControls from '../widgets/PresetSendControls.vue'
import PreviewPanel from '../widgets/PreviewPanel.vue'

const premadePreset = usePremadePreset()
const { options, updateOptions } = premadePreset
const { t } = useTranslation('renderer', { keyPrefix: 'InGameSend.presets.premade' })
const presetLabel = computed(() => t('label'))

const nameDisplayStrategyOptions = computed<
  PresetDisplayOption<InGameSendPresetNameDisplayStrategy>[]
>(() => [
  {
    label: t('nameDisplayStrategy.options.preferChampionName.label'),
    value: 'preferChampionName',
    description: t('nameDisplayStrategy.options.preferChampionName.description')
  },
  {
    label: t('nameDisplayStrategy.options.preferName.label'),
    value: 'preferName',
    description: t('nameDisplayStrategy.options.preferName.description')
  },
  {
    label: t('nameDisplayStrategy.options.championNameWithName.label'),
    value: 'championNameWithName',
    description: t('nameDisplayStrategy.options.championNameWithName.description')
  }
])

function updateNameDisplayStrategy(value: string | number) {
  const patch: InGameSendPremadePresetOptionPatch = {
    nameDisplayStrategy: value as InGameSendPresetNameDisplayStrategy
  }

  void updateOptions(patch)
}
</script>
