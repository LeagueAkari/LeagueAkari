<template>
  <div class="flex flex-col pt-2">
    <div class="text-xs leading-relaxed text-black/60 dark:text-white/70">
      {{ t('description') }}
    </div>

    <PresetSendControls :preset="junglePreset" :preset-label="presetLabel" />

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

    <PlayerSelectionPanel :selection="junglePreset.playerSelection" />
    <PreviewPanel :preset="junglePreset" :preset-label="presetLabel" />
  </div>
</template>

<script setup lang="ts">
import type { InGameSendJungleOptionId } from '@shared/types/shards/in-game-send'
import { useTranslation } from 'i18next-vue'
import { NCheckbox, NCheckboxGroup } from 'naive-ui'
import { computed } from 'vue'

import { useJunglePreset } from '../data/jungle'
import type { PresetDisplayOption } from '../types'
import PlayerSelectionPanel from '../widgets/PlayerSelectionPanel.vue'
import PresetSendControls from '../widgets/PresetSendControls.vue'
import PreviewPanel from '../widgets/PreviewPanel.vue'

const junglePreset = useJunglePreset()

const { options, updateOptions } = junglePreset
const { t } = useTranslation('renderer', { keyPrefix: 'InGameSend.presets.jungle' })

const presetLabel = computed(() => t('label'))

const displayOptions = computed<PresetDisplayOption<InGameSendJungleOptionId>[]>(() => [
  {
    label: t('displayOptions.firstClearRoute.label'),
    value: 'first-clear-route',
    description: t('displayOptions.firstClearRoute.description')
  },
  {
    label: t('displayOptions.firstClearSide.label'),
    value: 'first-clear-side',
    description: t('displayOptions.firstClearSide.description')
  },
  {
    label: t('displayOptions.gankLanes.label'),
    value: 'gank-lanes',
    description: t('displayOptions.gankLanes.description')
  },
  {
    label: t('displayOptions.invadeTendency.label'),
    value: 'invade-tendency',
    description: t('displayOptions.invadeTendency.description')
  },
  {
    label: t('displayOptions.scuttleControl.label'),
    value: 'scuttle-control',
    description: t('displayOptions.scuttleControl.description')
  },
  {
    label: t('displayOptions.objectivePriority.label'),
    value: 'objective-priority',
    description: t('displayOptions.objectivePriority.description')
  },
  {
    label: t('displayOptions.counterJungleRisk.label'),
    value: 'counter-jungle-risk',
    description: t('displayOptions.counterJungleRisk.description')
  },
  {
    label: t('displayOptions.duoLaneLink.label'),
    value: 'duo-lane-link',
    description: t('displayOptions.duoLaneLink.description')
  }
])

const selectedDisplayItems = computed({
  get: () => options.value.enabledModules,
  set: (value) => {
    void updateOptions({ enabledModules: [...value] })
  }
})
</script>
