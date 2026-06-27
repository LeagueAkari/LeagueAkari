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

    <PlayerSelectionPanel :selection="junglePreset.playerSelection" />
  </div>
</template>

<script setup lang="ts">
import type {
  InGameSendJunglePresetConfigOptionKey,
  InGameSendJunglePresetDisplayOptionKey,
  InGameSendJunglePresetNameDisplayStrategy,
  InGameSendJunglePresetOptionPatch
} from '@shared/shards/in-game-send'
import { useTranslation } from 'i18next-vue'
import { NRadio, NRadioGroup } from 'naive-ui'
import { computed } from 'vue'

import { useJunglePreset } from '../data/jungle'
import type { PresetDisplayOption } from '../types'
import PlayerSelectionPanel from '../widgets/PlayerSelectionPanel.vue'
import PresetDisplayOptionsPanel from '../widgets/PresetDisplayOptionsPanel.vue'
import PresetSendControls from '../widgets/PresetSendControls.vue'
import PreviewPanel from '../widgets/PreviewPanel.vue'

const junglePreset = useJunglePreset()

const { options, updateOptions } = junglePreset
const { t } = useTranslation('renderer', { keyPrefix: 'InGameSend.presets.jungle' })

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

const nameDisplayStrategyOptions = computed<
  PresetDisplayOption<InGameSendJunglePresetNameDisplayStrategy>[]
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

function updateNameDisplayStrategy(value: string | number) {
  void updateOptions({
    nameDisplayStrategy: value as InGameSendJunglePresetNameDisplayStrategy
  })
}
</script>
