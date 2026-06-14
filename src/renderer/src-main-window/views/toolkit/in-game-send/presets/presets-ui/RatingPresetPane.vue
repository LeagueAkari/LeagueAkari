<template>
  <div class="flex flex-col pt-2">
    <div class="text-xs leading-relaxed text-black/60 dark:text-white/70">
      {{ t('description') }}
    </div>

    <PresetSendControls :preset="ratingPreset" :preset-label="presetLabel" />

    <div class="pt-3">
      <div class="mb-2 text-xs font-semibold text-black/70 dark:text-white/70">
        {{ t('displayOptionsTitle') }}
      </div>
      <NCheckboxGroup v-model:value="selectedDisplayItems">
        <div class="grid grid-cols-2 gap-2">
          <NCheckbox v-for="option of displayOptions" :key="option.value" :value="option.value">
            <div class="flex flex-col leading-tight">
              <span class="text-xs">{{ option.label }}</span>
              <span class="text-[11px] text-black/45 dark:text-white/45">
                {{ option.description }}
              </span>
            </div>
          </NCheckbox>
        </div>
      </NCheckboxGroup>
    </div>

    <PlayerSelectionPanel :selection="ratingPreset.playerSelection" />
    <PreviewPanel :preset="ratingPreset" :preset-label="presetLabel" />
  </div>
</template>

<script setup lang="ts">
import type { InGameSendRatingOptionId } from '@shared/types/shards/in-game-send'
import { useTranslation } from 'i18next-vue'
import { NCheckbox, NCheckboxGroup } from 'naive-ui'
import { computed } from 'vue'

import { useRatingPreset } from '../data/rating'
import type { PresetDisplayOption } from '../types'
import PlayerSelectionPanel from '../widgets/PlayerSelectionPanel.vue'
import PresetSendControls from '../widgets/PresetSendControls.vue'
import PreviewPanel from '../widgets/PreviewPanel.vue'

const ratingPreset = useRatingPreset()

const { options, updateOptions } = ratingPreset
const { t } = useTranslation('renderer', { keyPrefix: 'InGameSend.presets.rating' })

const presetLabel = computed(() => t('label'))

const displayOptions = computed<PresetDisplayOption<InGameSendRatingOptionId>[]>(() => [
  {
    label: t('displayOptions.kda.label'),
    value: 'kda',
    description: t('displayOptions.kda.description')
  },
  {
    label: t('displayOptions.winRate.label'),
    value: 'win-rate',
    description: t('displayOptions.winRate.description')
  },
  {
    label: t('displayOptions.akariScore.label'),
    value: 'akari-score',
    description: t('displayOptions.akariScore.description')
  },
  {
    label: t('displayOptions.gameCount.label'),
    value: 'game-count',
    description: t('displayOptions.gameCount.description')
  },
  {
    label: t('displayOptions.soloKills.label'),
    value: 'solo-kills',
    description: t('displayOptions.soloKills.description')
  },
  {
    label: t('displayOptions.killParticipation.label'),
    value: 'kill-participation',
    description: t('displayOptions.killParticipation.description')
  },
  {
    label: t('displayOptions.damagePerMinute.label'),
    value: 'damage-per-minute',
    description: t('displayOptions.damagePerMinute.description')
  },
  {
    label: t('displayOptions.damageTakenShare.label'),
    value: 'damage-taken-share',
    description: t('displayOptions.damageTakenShare.description')
  }
])

const selectedDisplayItems = computed({
  get: () => options.value.enabledMetrics,
  set: (value) => {
    void updateOptions({ enabledMetrics: [...value] })
  }
})
</script>
