<template>
  <!-- expanded details -->
  <div
    class="@container w-full p-2 rounded dark:border-white/20 border-black/20 b b-solid relative overflow-hidden mt-1 box-border transition-[width] dark:bg-neutral-900/95 bg-neutral-100/95"
  >
    <!-- header -->
    <div class="flex gap-1 items-center mb-2">
      <TabSwitch
        class="flex-1"
        v-model:selected-tab="selectedTab"
        :tabs="tabs"
        :win-result="team?.winResult"
      />

      <!-- btns (download replay) -->
      <div class="flex gap-1">
        <NButton
          :theme-overrides="{
            heightMedium: '32px',
            paddingMedium: '0 8px'
          }"
          secondary
          :disabled="
            replayState !== 'download' && replayState !== 'watch' && replayState !== 'downloading'
          "
          :loading="replayState === 'downloading'"
          @click="
            replayState === 'watch'
              ? onWatchReplay(basicInfo.gameId)
              : onLoadReplay(basicInfo.gameId)
          "
          :title="replayButtonTitle"
        >
          <template #icon>
            <NIcon v-if="replayState === 'watch'"><Replay20Filled /></NIcon>
            <NIcon v-else><Replay20Regular /></NIcon>
          </template>
        </NButton>
      </div>
    </div>

    <!-- tab content -->
    <KeepAlive>
      <MatchCardSummaryTab v-if="selectedTab === 'summary'" />
      <MatchCardDetailsTab v-else-if="selectedTab === 'details'" />
      <MatchCardEventsTab v-else-if="selectedTab === 'events'" />
      <MatchCardLineChartTab v-else-if="selectedTab === 'line-chart'" />
      <MatchCardBuildsTab v-else-if="selectedTab === 'builds'" />
    </KeepAlive>
  </div>
</template>

<script lang="ts" setup>
import { Replay20Filled, Replay20Regular } from '@vicons/fluent'
import { NButton, NIcon } from 'naive-ui'
import { computed, ref, watchEffect } from 'vue'

import { useMatchCard } from './context'
import MatchCardBuildsTab from './tabs/MatchCardBuildsTab.vue'
import MatchCardDetailsTab from './tabs/MatchCardDetailsTab.vue'
import MatchCardLineChartTab from './tabs/MatchCardDiffLineChartTab.vue'
import MatchCardEventsTab from './tabs/MatchCardEventsTab.vue'
import MatchCardSummaryTab from './tabs/MatchCardSummaryTab.vue'
import TabSwitch from './widgets/TabSwitch.vue'

const { basicInfo, teams, participants, puuid, replayState, onLoadReplay, onWatchReplay } =
  useMatchCard()

const selfStats = computed(() => {
  return participants.value.find((s) => s.puuid === puuid.value)
})

const team = computed(() => {
  if (!selfStats.value) return null

  return teams.value.teamStatMap[selfStats.value.teamIdentifier]
})

const selectedTab = ref('summary')
const tabs = computed(() => {
  return [
    {
      label: '总览',
      value: 'summary'
    },
    {
      label: '详细数据',
      value: 'details'
    },
    {
      label: '事件',
      value: 'events'
    },
    {
      label: '构建',
      value: 'builds',
      show: basicInfo.value.dataSource === 'sgp'
    },
    {
      label: '线图',
      value: 'line-chart'
    }
  ].filter((tab) => tab.show ?? true)
})

watchEffect(() => {
  if (basicInfo.value.dataSource !== 'sgp' && selectedTab.value === 'builds') {
    selectedTab.value = 'summary'
  }
})

const replayButtonTitle = computed(() => {
  switch (replayState.value) {
    case 'download':
      return '下载回放'
    case 'watch':
      return '观看回放'
    case 'incompatible':
      return '回放不可用'
    default:
      return '回放'
  }
})
</script>

<style scoped>
@import './match-card.css';
</style>
