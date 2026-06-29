<template>
  <div class="pt-3">
    <div class="mb-2 text-xs font-semibold text-black/70 dark:text-white/70">
      {{ t('title') }}
    </div>
    <NRadioGroup :value="value" @update:value="handleUpdate">
      <div class="grid gap-2">
        <NRadio v-for="option of options" :key="option.value" :value="option.value">
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
</template>

<script setup lang="ts">
import type { InGameSendPresetNameDisplayStrategy } from '@shared/shards/in-game-send'
import { useTranslation } from 'i18next-vue'
import { NRadio, NRadioGroup } from 'naive-ui'
import { computed } from 'vue'

import type { PresetDisplayOption } from '../types'

defineProps<{
  value: InGameSendPresetNameDisplayStrategy
}>()

const emit = defineEmits<{
  'update:value': [value: InGameSendPresetNameDisplayStrategy]
}>()

const { t } = useTranslation('renderer', {
  keyPrefix: 'toolkit.inGameSend.presets.nameDisplayStrategy'
})

const options = computed<PresetDisplayOption<InGameSendPresetNameDisplayStrategy>[]>(() => [
  {
    label: t('options.preferChampionName.label'),
    value: 'preferChampionName',
    description: t('options.preferChampionName.description')
  },
  {
    label: t('options.preferName.label'),
    value: 'preferName',
    description: t('options.preferName.description')
  },
  {
    label: t('options.championNameWithName.label'),
    value: 'championNameWithName',
    description: t('options.championNameWithName.description')
  }
])

function handleUpdate(value: string | number) {
  emit('update:value', value as InGameSendPresetNameDisplayStrategy)
}
</script>
