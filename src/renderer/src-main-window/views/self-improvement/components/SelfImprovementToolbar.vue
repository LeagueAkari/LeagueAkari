<template>
  <div
    class="flex flex-wrap items-center gap-3 border-b border-black/10 px-6 py-3 dark:border-white/10"
  >
    <LcuImage v-if="me" class="size-12 shrink-0 rounded" :src="profileIconUri(me.profileIconId)" />

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-2">
        <span class="truncate text-base font-bold text-black/85 dark:text-white/85">
          {{ playerName || t('selfImprovement.player.unknown') }}
        </span>
        <NTag v-if="dataSource" size="small" :bordered="false">
          {{ dataSource === 'sgp' ? 'SGP' : 'LCU' }}
        </NTag>
        <NTag size="small" :bordered="false" type="info">
          {{ t('selfImprovement.controls.queueOnly') }}
        </NTag>
      </div>
      <div class="mt-0.5 text-xs text-black/55 dark:text-white/55">
        {{ t('selfImprovement.description') }}
      </div>
      <div class="mt-0.5 text-[11px] text-black/40 dark:text-white/40">
        <span v-if="isLoading">{{ loadingText }}</span>
        <span v-else-if="lastLoadedAt">
          {{ t('selfImprovement.updatedAt', { time: updatedAtText }) }}
        </span>
      </div>
    </div>

    <div class="flex w-100 shrink-0 items-center gap-2">
      <div class="w-36 shrink-0">
        <NSelect
          v-model:value="matchCount"
          class="w-full"
          size="small"
          :disabled="isLoading"
          :options="matchCountOptions"
        />
      </div>
      <div v-if="positionOptions.length > 0" class="w-36 shrink-0">
        <NSelect
          :value="selectedPosition"
          class="w-full"
          size="small"
          clearable
          :placeholder="t('selfImprovement.positions.all')"
          :options="positionOptions"
          @update:value="handlePositionUpdate"
        />
      </div>
      <NButton size="small" :loading="isLoading" @click="reload">
        <template #icon>
          <NIcon :component="RefreshIcon" />
        </template>
        {{ t('selfImprovement.controls.refresh') }}
      </NButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { profileIconUri } from '@renderer-shared/shards/league-client/game-data-assets'
import { ArrowSync20Filled as RefreshIcon } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NSelect, NTag } from 'naive-ui'

import { useSelfImprovementPageContext } from '../context'

const { t } = useTranslation()
const {
  me,
  playerName,
  dataSource,
  isLoading,
  lastLoadedAt,
  updatedAtText,
  loadingText,
  matchCount,
  matchCountOptions,
  selectedPosition,
  positionOptions,
  handlePositionUpdate,
  reload
} = useSelfImprovementPageContext()
</script>
