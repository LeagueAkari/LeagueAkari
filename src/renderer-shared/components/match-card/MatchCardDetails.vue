<template>
  <!-- expanded details -->
  <div
    class="transition-width @container relative mt-1 box-border w-full overflow-hidden rounded border border-solid bg-neutral-100/95 p-2 dark:bg-neutral-900/95"
    :class="cardBorderClasses"
  >
    <!-- header -->
    <div class="mb-2 flex items-center gap-1">
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
      <MatchCardRunesTab v-else-if="selectedTab === 'runes'" />
      <MatchCardEventsTab v-else-if="selectedTab === 'events'" />
      <MatchCardLineChartTab v-else-if="selectedTab === 'line-chart'" />
      <MatchCardBuildsTab v-else-if="selectedTab === 'builds'" />
    </KeepAlive>
  </div>
</template>

<script lang="ts" setup>
import { Replay20Filled, Replay20Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon } from 'naive-ui'
import { computed, ref, watchEffect } from 'vue'

import { useMatchCard } from './context'
import MatchCardBuildsTab from './tabs/MatchCardBuildsTab.vue'
import MatchCardDetailsTab from './tabs/MatchCardDetailsTab.vue'
import MatchCardLineChartTab from './tabs/MatchCardDiffLineChartTab.vue'
import MatchCardEventsTab from './tabs/MatchCardEventsTab.vue'
import MatchCardRunesTab from './tabs/MatchCardRunesTab.vue'
import MatchCardSummaryTab from './tabs/MatchCardSummaryTab.vue'
import { useCardBorderTheme } from './utils/theme'
import TabSwitch from './widgets/TabSwitch.vue'

const { basicInfo, teams, participants, puuid, replayState, onLoadReplay, onWatchReplay } =
  useMatchCard()
const { t } = useTranslation()

const selfStats = computed(() => {
  return participants.value.find((s) => s.puuid === puuid.value)
})

const team = computed(() => {
  if (!selfStats.value) return null

  return teams.value.teamStatMap[selfStats.value.teamIdentifier]
})

const perksAvailable = computed(() => {
  return participants.value.some((p) =>
    p.perks.styles.some((s) => s.selections.some((s) => s.perk !== 0))
  )
})

const selectedTab = ref('summary')
const tabs = computed(() => {
  return [
    {
      label: t('MatchCard.tabs.summary'),
      value: 'summary'
    },
    {
      label: t('MatchCard.tabs.details'),
      value: 'details'
    },
    {
      label: t('MatchCard.tabs.runes'),
      value: 'runes',
      show: perksAvailable.value
    },
    {
      label: t('MatchCard.tabs.events'),
      value: 'events'
    },
    {
      label: t('MatchCard.tabs.builds'),
      value: 'builds',
      show: basicInfo.value.dataSource === 'sgp'
    },
    {
      label: t('MatchCard.tabs.lineChart'),
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
      return t('MatchCard.replay.download')
    case 'watch':
      return t('MatchCard.replay.watch')
    case 'incompatible':
      return t('MatchCard.replay.unavailable')
    default:
      return t('MatchCard.replay.label')
  }
})

const cardBorderClasses = useCardBorderTheme()
</script>

<style scoped>
@import './match-card.css';
</style>
