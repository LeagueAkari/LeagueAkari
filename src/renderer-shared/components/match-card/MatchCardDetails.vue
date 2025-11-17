<template>
  <!-- expanded details -->
  <VerticalExpand :show="isExpanded">
    <div
      :style="{ width: `${width}px` }"
      class="@container p-2 rounded dark:border-white/20 border-black/20 border border-solid relative overflow-hidden mt-1 box-border transition-[width]"
    >
      <!-- header -->
      <div class="flex gap-1 items-center mb-2">
        <TabSwitch
          class="flex-1"
          v-model:selected-tab="selectedTab"
          :tabs="tabs"
          :win-result="team?.winResult"
        />

        <!-- btns (download replay + share game) -->
        <div class="flex gap-1">
          <NButton
            :theme-overrides="{
              heightMedium: '32px'
            }"
            secondary
          >
            DL
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
  </VerticalExpand>
</template>

<script lang="ts" setup>
import { NButton } from 'naive-ui'
import { computed, ref, watchEffect } from 'vue'

import VerticalExpand from '../VerticalExpand.vue'
import { useMatchCard } from './context'
import MatchCardBuildsTab from './tabs/MatchCardBuildsTab.vue'
import MatchCardDetailsTab from './tabs/MatchCardDetailsTab.vue'
import MatchCardLineChartTab from './tabs/MatchCardDiffLineChartTab.vue'
import MatchCardEventsTab from './tabs/MatchCardEventsTab.vue'
import MatchCardSummaryTab from './tabs/MatchCardSummaryTab.vue'
import TabSwitch from './widgets/TabSwitch.vue'

const { width = 720, isExpanded = false } = defineProps<{
  width?: number
  isExpanded?: boolean
}>()

const { basicInfo, teams, participants, puuid } = useMatchCard()

const selfStats = computed(() => {
  return participants.value.find((s) => s.puuid === puuid.value)
})

const team = computed(() => {
  if (!selfStats.value) return null

  return teams.value.teamStatMap[selfStats.value.teamIdentifier]
})

const selectedTab = ref('builds')
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
</script>

<style scoped>
@import './match-card.css';
</style>
