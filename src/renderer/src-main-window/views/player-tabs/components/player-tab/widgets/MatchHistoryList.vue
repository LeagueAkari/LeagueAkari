<template>
  <div>
    <div
      v-if="isLoading && (!pagedMatchHistory || displayedGames.length === 0)"
      class="flex h-50 items-center justify-center rounded bg-black/5 dark:bg-white/5"
    >
      <div class="flex items-center gap-2">
        <NSpin :size="16" />
        <span class="text-sm text-black/80 dark:text-white/60">{{ t('PlayerTab.loading') }}</span>
      </div>
    </div>

    <template v-else-if="pagedMatchHistory">
      <div
        v-if="pagedMatchHistory.games.length === 0"
        class="flex h-50 flex-col items-center justify-center gap-2 rounded bg-black/5 dark:bg-white/5"
      >
        <span class="text-sm text-black/80 dark:text-white/60">{{
          rootHasCombinator ? t('PlayerTab.noFilteredMatchHistory') : t('PlayerTab.noMatchHistory')
        }}</span>

        <NButton v-if="rootHasCombinator" size="small" tertiary @click="clearFilters">
          {{ t('PlayerTab.clearFilters') }}
        </NButton>
      </div>
    </template>

    <div v-if="pagedMatchHistory && displayedGames.length > 0" class="space-y-1">
      <MatchCard
        v-for="g of displayedGames"
        ref="matchCardEls"
        :summary="g"
        :puuid="puuid"
        :key="`${g.source}${g.gameId}`"
        :theme="as.colorTheme"
        @navigate-to-summoner-by-puuid="navigateToSummonerByPuuid"
        @load-details="loadDetails(g.gameId)"
        @download-replay="downloadReplay(g.gameId)"
        @watch-replay="launchRelay(g.gameId)"
        @filter-by-champion="applyChampionFilter"
        :details="pagedMatchHistory.details[g.gameId]"
        :loading-details="pagedMatchHistory.detailsLoading[g.gameId]"
        :hide-privacy="as.settings.streamerMode"
        :replay-state="pagedMatchHistory.replayMetadata[g.gameId]"
        :show-jungle-pathing="pts.frontendSettings.showJunglePathing"
        :jungle-pathing-data-source="junglePathingDataSource"
      />

      <div
        v-if="isLoading"
        class="flex items-center justify-center gap-2 py-2 text-xs text-black/65 dark:text-white/50"
      >
        <NSpin :size="12" />
        <span>{{ t('PlayerTab.loading') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MatchCard from '@renderer-shared/components/match-card/MatchCard.vue'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { useTranslation } from 'i18next-vue'
import { NButton, NSpin } from 'naive-ui'
import { computed, nextTick, onMounted, onUnmounted, useTemplateRef, watch } from 'vue'

import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

import { usePlayerTab } from '../context'
import { useMatchHistory } from '../data/match-history'
import { useMatchHistoryFilters } from '../data/match-history-filters'
import { useSpectator } from '../data/spectator'

const as = useAppCommonStore()
const lcs = useLeagueClientStore()
const pts = usePlayerTabsStore()
const ogs = useOngoingGameStore()

const { t } = useTranslation()

const {
  puuid,
  events,
  navigateToSummonerByPuuid,
  previewGame,
  preferredSource,
  sgpServerId,
  isCrossRegion
} = usePlayerTab()
const {
  page: pagedMatchHistory,
  isLoading,
  loadDetails: rawLoadDetails,
  downloadReplay,
  launchRelay,
  loadMatchHistory
} = useMatchHistory()

const { loadSpectatorData } = useSpectator()

const { rootHasCombinator, clearPredicate: clearFilters } = useMatchHistoryFilters()

const junglePathingDataSource = computed(() => {
  return {
    preferredSource: preferredSource.value,
    sgpServerId: sgpServerId.value,
    isCrossRegion: isCrossRegion.value
  }
})

const displayedGames = computed(() => {
  if (!pagedMatchHistory.value) {
    return []
  }

  return pagedMatchHistory.value.games
})

const applyChampionFilter = (_championId: number) => {
  // TODO: integrate with predicate-based filter system
}

const loadDetails = (gameId: number) => {
  rawLoadDetails(gameId)
}

const isEndOfGame = computed(
  () => lcs.gameflow.phase === 'EndOfGame' || lcs.gameflow.phase === 'PreEndOfGame'
)

watch(
  () => isEndOfGame.value,
  (is) => {
    if (pts.frontendSettings.refreshTabsAfterGameEnds && is) {
      if (!ogs.teams) {
        return
      }

      const allPlayerPuuids = Object.values(ogs.teams).flat()

      if (allPlayerPuuids.includes(puuid.value)) {
        loadSpectatorData()

        if (
          !pagedMatchHistory.value ||
          (pagedMatchHistory.value.queryParams.startIndex || 0) === 0
        ) {
          loadMatchHistory({
            startIndex: 0,
            count: pts.frontendSettings.loadCount
          })
        }
      }
    }
  }
)

const matchCardEls = useTemplateRef('matchCardEls')

const handleFocusGame = ({ summary }: { summary: LcuOrSgpGameSummary | number }) => {
  const extractedGameId = typeof summary === 'number' ? summary : summary.gameId
  const el = matchCardEls.value?.find((el) => el?.$props.summary?.gameId === extractedGameId)

  if (el) {
    el.setExpanded(true)

    nextTick(() => {
      ;(el.$el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  } else {
    previewGame(summary)
  }
}

onMounted(() => {
  events.on('focusGame', handleFocusGame)
})

onUnmounted(() => {
  events.off('focusGame', handleFocusGame)
})
</script>
