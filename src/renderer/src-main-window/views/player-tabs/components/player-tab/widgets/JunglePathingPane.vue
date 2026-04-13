<template>
  <div v-if="shouldShowPane" class="rounded bg-black/5 px-4 py-2 dark:bg-white/5">
    <div class="mb-2 text-base font-bold text-gray-900 dark:text-white">
      {{ t('JunglePathing.title') }}
    </div>

    <JunglePathingInfo v-if="jungleAnalysis" :analysis="jungleAnalysis" :show-copy-all="false" />

    <div
      v-else-if="hasPendingJungleDetails"
      class="flex items-center gap-2 py-1 text-xs text-black/70 dark:text-white/70"
    >
      <NSpin :size="14" />
      <span>{{ t('PlayerTab.loading') }}</span>
    </div>

    <div v-else class="py-1 text-xs text-black/70 dark:text-white/70">
      {{ t('JunglePathing.noData') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import JunglePathingInfo from '@renderer-shared/components/ongoing-game-panel/widgets/JunglePathingInfo.vue'
import { analyzeJunglePathing, filterJungleGames } from '@shared/data-adapter/analysis/jungle'
import { toBasicInfo } from '@shared/data-adapter/match-history/match-basic'
import { toParticipants } from '@shared/data-adapter/match-history/participants'
import { useTranslation } from 'i18next-vue'
import { NSpin } from 'naive-ui'
import { computed, watch, watchEffect } from 'vue'

import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

import { usePlayerTab } from '../context'
import { useMatchHistory } from '../data/match-history'

const JUNGLE_ANALYSIS_DETAILS_MAX = 12
const NO_CHAMPION_ID = -1

const { t } = useTranslation()
const pts = usePlayerTabsStore()
const { puuid } = usePlayerTab()
const { page: pagedMatchHistory, loadDetails } = useMatchHistory()
const requestedDetailGameIds = new Set<number>()

const jungleGameIds = computed(() => {
  if (!pagedMatchHistory.value?.games?.length) {
    return []
  }

  return filterJungleGames(pagedMatchHistory.value.games, puuid.value).slice(
    0,
    JUNGLE_ANALYSIS_DETAILS_MAX
  )
})

const jungleGameIdSet = computed(() => new Set(jungleGameIds.value))

watchEffect(() => {
  const paged = pagedMatchHistory.value
  if (!paged) return

  for (const gameId of jungleGameIds.value) {
    if (
      !paged.details[gameId] &&
      !paged.detailsLoading[gameId] &&
      !requestedDetailGameIds.has(gameId)
    ) {
      requestedDetailGameIds.add(gameId)
      void loadDetails(gameId)
    }
  }
})

watch(
  () => pagedMatchHistory.value,
  () => {
    requestedDetailGameIds.clear()
  }
)

const loadedJungleDetails = computed(() => {
  const paged = pagedMatchHistory.value
  if (!paged) return []

  return jungleGameIds.value.map((gameId) => paged.details[gameId]).filter((detail) => !!detail)
})

const hasPendingJungleDetails = computed(() => {
  const paged = pagedMatchHistory.value
  if (!paged) return false

  return jungleGameIds.value.some((gameId) => {
    return !paged.details[gameId] && !!paged.detailsLoading[gameId]
  })
})

const recentJungleChampionId = computed(() => {
  const paged = pagedMatchHistory.value
  if (!paged) return NO_CHAMPION_ID

  for (const summary of paged.games) {
    if (!jungleGameIdSet.value.has(summary.gameId)) {
      continue
    }

    const participant = toParticipants(summary, toBasicInfo(summary)).find(
      (p) => p.puuid === puuid.value
    )
    if (participant) {
      return participant.championId
    }
  }

  return NO_CHAMPION_ID
})

const jungleAnalysis = computed(() => {
  const paged = pagedMatchHistory.value
  if (!paged || loadedJungleDetails.value.length === 0) {
    return null
  }

  const detailGameIdSet = new Set(loadedJungleDetails.value.map((d) => d.gameId))
  const summaries = paged.games.filter((g) => detailGameIdSet.has(g.gameId))

  return analyzeJunglePathing(
    loadedJungleDetails.value,
    summaries,
    puuid.value,
    recentJungleChampionId.value
  )
})

const shouldShowPane = computed(() => {
  return pts.frontendSettings.showJunglePathing && jungleGameIds.value.length > 0
})
</script>
