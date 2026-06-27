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

    <PlayerSelectionPanel :selection="ratingPreset.playerSelection" />
  </div>
</template>

<script setup lang="ts">
import type {
  InGameSendRatingPresetConfigOptionKey,
  InGameSendRatingPresetDisplayOptionKey,
  InGameSendRatingPresetNameDisplayStrategy,
  InGameSendRatingPresetOptionPatch
} from '@shared/shards/in-game-send'
import { useTranslation } from 'i18next-vue'
import { NRadio, NRadioGroup } from 'naive-ui'
import { computed } from 'vue'

import { useRatingPreset } from '../data/rating'
import type { PresetDisplayOption } from '../types'
import PlayerSelectionPanel from '../widgets/PlayerSelectionPanel.vue'
import PresetDisplayOptionsPanel from '../widgets/PresetDisplayOptionsPanel.vue'
import PresetSendControls from '../widgets/PresetSendControls.vue'
import PreviewPanel from '../widgets/PreviewPanel.vue'

const ratingPreset = useRatingPreset()

const { options, updateOptions } = ratingPreset
const { t } = useTranslation('renderer', { keyPrefix: 'InGameSend.presets.rating' })

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

const nameDisplayStrategyOptions = computed<
  PresetDisplayOption<InGameSendRatingPresetNameDisplayStrategy>[]
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

function updateDisplayOptions(value: Record<string, boolean>) {
  const patch: InGameSendRatingPresetOptionPatch = {
    winRate: value.winRate,
    kda: value.kda,
    avgSoloKills: value.avgSoloKills,
    avgVisionScore: value.avgVisionScore,
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

function updateNameDisplayStrategy(value: string | number) {
  void updateOptions({
    nameDisplayStrategy: value as InGameSendRatingPresetNameDisplayStrategy
  })
}
</script>
