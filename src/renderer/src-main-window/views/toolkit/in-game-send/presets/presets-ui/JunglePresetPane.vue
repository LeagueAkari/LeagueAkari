<template>
  <div class="flex flex-col pt-2">
    <div class="text-xs leading-relaxed text-black/60 dark:text-white/70">
      {{ t('description') }}
    </div>

    <PresetSendControls :preset="junglePreset" :preset-label="presetLabel" />

    <PreviewPanel :preset="junglePreset" />

    <PresetDisplayOptionsPanel
      :title="t('displayOptionsTitle')"
      :options="displayOptions"
      :selected-options="options"
      @update:selected-options="updateDisplayOptions"
    />

    <PresetDisplayOptionsPanel
      :title="t('configOptionsTitle')"
      :options="configOptions"
      :selected-options="options"
      @update:selected-options="updateConfigOptions"
    />

    <NameDisplayStrategySelector
      :value="options.nameDisplayStrategy"
      @update:value="updateNameDisplayStrategy"
    />

    <PlayerSelectionPanel :selection="junglePreset.playerSelection" />
  </div>
</template>

<script setup lang="ts">
import type {
  InGameSendJunglePresetConfigOptionKey,
  InGameSendJunglePresetDisplayOptionKey,
  InGameSendJunglePresetOptionPatch,
  InGameSendPresetNameDisplayStrategy
} from '@shared/shards/in-game-send'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

import { useJunglePreset } from '../data/jungle'
import type { PresetDisplayOption } from '../types'
import NameDisplayStrategySelector from '../widgets/NameDisplayStrategySelector.vue'
import PlayerSelectionPanel from '../widgets/PlayerSelectionPanel.vue'
import PresetDisplayOptionsPanel from '../widgets/PresetDisplayOptionsPanel.vue'
import PresetSendControls from '../widgets/PresetSendControls.vue'
import PreviewPanel from '../widgets/PreviewPanel.vue'

const junglePreset = useJunglePreset()

const { options, updateOptions } = junglePreset
const { t } = useTranslation('renderer', { keyPrefix: 'toolkit.inGameSend.presets.jungle' })

const presetLabel = computed(() => t('label'))

const displayOptions = computed<PresetDisplayOption<InGameSendJunglePresetDisplayOptionKey>[]>(
  () => [
    {
      label: t('displayOptions.activityPreference.label'),
      value: 'activityPreference',
      description: t('displayOptions.activityPreference.description')
    },
    {
      label: t('displayOptions.firstClearDistribution.label'),
      value: 'firstClearDistribution',
      description: t('displayOptions.firstClearDistribution.description')
    },
    {
      label: t('displayOptions.earlyGank.label'),
      value: 'earlyGank',
      description: t('displayOptions.earlyGank.description')
    },
    {
      label: t('displayOptions.dragonControl.label'),
      value: 'dragonControl',
      description: t('displayOptions.dragonControl.description')
    },
    {
      label: t('displayOptions.monsterControl.label'),
      value: 'monsterControl',
      description: t('displayOptions.monsterControl.description')
    },
    {
      label: t('displayOptions.mainChampions.label'),
      value: 'mainChampions',
      description: t('displayOptions.mainChampions.description')
    }
  ]
)

const configOptions = computed<PresetDisplayOption<InGameSendJunglePresetConfigOptionKey>[]>(() => [
  {
    label: t('configOptions.showCurrentChampion.label'),
    value: 'showCurrentChampion',
    description: t('configOptions.showCurrentChampion.description')
  }
])

function updateDisplayOptions(value: Record<string, boolean>) {
  const patch: InGameSendJunglePresetOptionPatch = {
    activityPreference: value.activityPreference,
    firstClearDistribution: value.firstClearDistribution,
    earlyGank: value.earlyGank,
    dragonControl: value.dragonControl,
    monsterControl: value.monsterControl,
    mainChampions: value.mainChampions
  }

  void updateOptions(patch)
}

function updateConfigOptions(value: Record<string, boolean>) {
  const patch: InGameSendJunglePresetOptionPatch = {
    showCurrentChampion: value.showCurrentChampion
  }

  void updateOptions(patch)
}

function updateNameDisplayStrategy(value: InGameSendPresetNameDisplayStrategy) {
  void updateOptions({
    nameDisplayStrategy: value
  })
}
</script>
