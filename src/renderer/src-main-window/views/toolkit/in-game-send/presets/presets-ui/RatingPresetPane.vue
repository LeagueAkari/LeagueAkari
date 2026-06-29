<template>
  <div class="flex flex-col pt-2">
    <div class="text-xs leading-relaxed text-black/60 dark:text-white/70">
      {{ t('description') }}
    </div>

    <PresetSendControls :preset="ratingPreset" :preset-label="presetLabel" />
    <PreviewPanel :preset="ratingPreset" />

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

    <PlayerSelectionPanel :selection="ratingPreset.playerSelection" />
  </div>
</template>

<script setup lang="ts">
import type {
  InGameSendRatingPresetConfigOptionKey,
  InGameSendRatingPresetDisplayOptionKey,
  InGameSendRatingPresetOptionPatch,
  InGameSendPresetNameDisplayStrategy
} from '@shared/shards/in-game-send'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

import { useRatingPreset } from '../data/rating'
import type { PresetDisplayOption } from '../types'
import NameDisplayStrategySelector from '../widgets/NameDisplayStrategySelector.vue'
import PlayerSelectionPanel from '../widgets/PlayerSelectionPanel.vue'
import PresetDisplayOptionsPanel from '../widgets/PresetDisplayOptionsPanel.vue'
import PresetSendControls from '../widgets/PresetSendControls.vue'
import PreviewPanel from '../widgets/PreviewPanel.vue'

const ratingPreset = useRatingPreset()

const { options, updateOptions } = ratingPreset
const { t } = useTranslation('renderer', { keyPrefix: 'toolkit.inGameSend.presets.rating' })

const presetLabel = computed(() => t('label'))

const displayOptions = computed<PresetDisplayOption<InGameSendRatingPresetDisplayOptionKey>[]>(
  () => [
    {
      label: t('displayOptions.winRate.label'),
      value: 'winRate',
      description: t('displayOptions.winRate.description')
    },
    {
      label: t('displayOptions.kda.label'),
      value: 'kda',
      description: t('displayOptions.kda.description')
    },
    {
      label: t('displayOptions.avgSoloKills.label'),
      value: 'avgSoloKills',
      description: t('displayOptions.avgSoloKills.description')
    },
    {
      label: t('displayOptions.avgVisionScore.label'),
      value: 'avgVisionScore',
      description: t('displayOptions.avgVisionScore.description')
    },
    {
      label: t('displayOptions.avgChampionDamage.label'),
      value: 'avgChampionDamage',
      description: t('displayOptions.avgChampionDamage.description')
    },
    {
      label: t('displayOptions.avgDamageTaken.label'),
      value: 'avgDamageTaken',
      description: t('displayOptions.avgDamageTaken.description')
    },
    {
      label: t('displayOptions.avgGold.label'),
      value: 'avgGold',
      description: t('displayOptions.avgGold.description')
    },
    {
      label: t('displayOptions.avgCsPerMinute.label'),
      value: 'avgCsPerMinute',
      description: t('displayOptions.avgCsPerMinute.description')
    },
    {
      label: t('displayOptions.avgKillParticipation.label'),
      value: 'avgKillParticipation',
      description: t('displayOptions.avgKillParticipation.description')
    },
    {
      label: t('displayOptions.avgDamageGoldEfficiency.label'),
      value: 'avgDamageGoldEfficiency',
      description: t('displayOptions.avgDamageGoldEfficiency.description')
    },
    {
      label: t('displayOptions.mainChampions.label'),
      value: 'mainChampions',
      description: t('displayOptions.mainChampions.description')
    },
    {
      label: t('displayOptions.mainPositions.label'),
      value: 'mainPositions',
      description: t('displayOptions.mainPositions.description')
    }
  ]
)

const configOptions = computed<PresetDisplayOption<InGameSendRatingPresetConfigOptionKey>[]>(() => [
  {
    label: t('configOptions.showCurrentChampion.label'),
    value: 'showCurrentChampion',
    description: t('configOptions.showCurrentChampion.description')
  }
])

function updateDisplayOptions(value: Record<string, boolean>) {
  const patch: InGameSendRatingPresetOptionPatch = {
    winRate: value.winRate,
    kda: value.kda,
    avgSoloKills: value.avgSoloKills,
    avgVisionScore: value.avgVisionScore,
    avgChampionDamage: value.avgChampionDamage,
    avgDamageTaken: value.avgDamageTaken,
    avgGold: value.avgGold,
    avgCsPerMinute: value.avgCsPerMinute,
    avgKillParticipation: value.avgKillParticipation,
    avgDamageGoldEfficiency: value.avgDamageGoldEfficiency,
    mainChampions: value.mainChampions,
    mainPositions: value.mainPositions
  }

  void updateOptions(patch)
}

function updateConfigOptions(value: Record<string, boolean>) {
  const patch: InGameSendRatingPresetOptionPatch = {
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
