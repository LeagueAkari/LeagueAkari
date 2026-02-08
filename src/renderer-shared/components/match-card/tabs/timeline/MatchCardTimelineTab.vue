<template>
  <div v-if="details" class="flex h-142 min-h-0 w-full flex-col">
    <!-- sub tab -->
    <div class="mb-2 box-border w-full px-2" v-if="details.source === 'sgp'">
      <NTabs size="small" type="line" v-model:value="currentSection">
        <NTab name="diff-line-chart">差距线图表</NTab>
        <NTab name="stats-line">属性时间线</NTab>
      </NTabs>
    </div>

    <MatchCardDiffLineChart v-if="currentSection === 'diff-line-chart'" class="min-h-0 flex-1" />
    <MatchCardStatsLine v-if="currentSection === 'stats-line'" class="min-h-0 flex-1" />
  </div>
  <div
    v-else
    class="flex h-142 w-full items-center justify-center text-sm text-black/60 dark:text-white/60"
  >
    <template v-if="loadingDetails">
      <div class="flex items-center gap-2">
        <NSpin :size="16" />
        <span>{{ t('MatchCard.common.loading') }}</span>
      </div>
    </template>
    <template v-else>
      <div class="flex items-center gap-2">
        <span>{{ t('MatchCard.common.noData') }}</span>
        <NButton type="primary" size="small" @click="onLoadDetails(basicInfo.gameId)">
          {{ t('MatchCard.common.refresh') }}
        </NButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue'
import { NButton, NSpin, NTab, NTabs } from 'naive-ui'
import { ref, watch } from 'vue'

import { useMatchCard } from '../../context'
import MatchCardDiffLineChart from './MatchCardDiffLineChart.vue'
import MatchCardStatsLine from './MatchCardStatsLine.vue'

const { t } = useTranslation()

const { basicInfo, details, loadingDetails, onLoadDetails } = useMatchCard()

const currentSection = ref<'diff-line-chart' | 'stats-line'>('diff-line-chart')

watch(
  [details, loadingDetails, () => basicInfo.value.gameId],
  ([d, l, g]) => {
    if (!d && !l) {
      onLoadDetails(g)
    }
  },
  { immediate: true }
)

// lcu 不支持 stats-line
watch(
  () => details.value?.source,
  (source) => {
    if (source === 'lcu' && currentSection.value === 'stats-line') {
      currentSection.value = 'diff-line-chart'
    }
  }
)
</script>
