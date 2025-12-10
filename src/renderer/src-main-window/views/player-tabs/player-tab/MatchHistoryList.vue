<template>
  <!-- loading state -->
  <div
    v-if="isLoading && !pagedMatchHistory"
    class="h-50 flex items-center justify-center dark:bg-white/5 bg-black/5 rounded"
  >
    <div class="flex items-center gap-2">
      <NSpin :size="16" />
      <span class="text-sm dark:text-white/60 text-black/80">{{ t('PlayerTab.loading') }}</span>
    </div>
  </div>

  <!-- empty placeholder -->
  <div
    v-else-if="pagedMatchHistory && pagedMatchHistory.games.length === 0"
    class="h-50 flex items-center justify-center dark:bg-white/5 bg-black/5 rounded"
  >
    <span class="text-sm dark:text-white/60 text-black/80">{{
      t('PlayerTab.noMatchHistory')
    }}</span>
  </div>

  <!-- empty filtered games -->
  <div
    v-else-if="
      pagedMatchHistory && hasFilters && gamesShouldHide.size === pagedMatchHistory.games.length
    "
    class="h-50 flex items-center justify-center dark:bg-white/5 bg-black/5 rounded"
  >
    <span class="text-sm dark:text-white/60 text-black/80">{{
      t('PlayerTab.noFilteredMatchHistory')
    }}</span>
  </div>

  <!-- match history list -->
  <div v-else-if="pagedMatchHistory" class="space-y-1">
    <MatchCard
      :class="{
        '!hidden': gamesShouldHide.has(g.gameId)
      }"
      v-for="g of pagedMatchHistory.games"
      :summary="g"
      :puuid="puuid"
      :key="`${g.source}${g.gameId}`"
      :theme="as.colorTheme"
      @navigate-to-summoner-by-puuid="navigateToSummonerByPuuid"
      @load-details="loadDetails(g.gameId)"
      @download-replay="downloadReplay(g.gameId)"
      @watch-replay="launchRelay(g.gameId)"
      :details="pagedMatchHistory.details[g.gameId]"
      :loading-details="pagedMatchHistory.detailsLoading[g.gameId]"
      :hide-privacy="hidePrivacy"
      :replay-state="pagedMatchHistory.replayMetadata[g.gameId]?.state"
    />
  </div>
</template>

<script setup lang="ts">
import MatchCard from '@renderer-shared/components/match-card/MatchCard.vue'
import { useStreamerModeMaskedText } from '@renderer-shared/composables/useStreamerModeMaskedText'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { toBasicInfo } from '@shared/data-adapter/match-history/match-basic'
import { toParticipants } from '@shared/data-adapter/match-history/participants'
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { useTranslation } from 'i18next-vue'
import { NSpin } from 'naive-ui'
import { computed } from 'vue'

import { usePlayerTab } from './context'
import { useMatchHistory } from './data/match-history'
import { useMatchHistoryFilters } from './data/match-history-filters'

const as = useAppCommonStore()
const { t } = useTranslation()
const { masked } = useStreamerModeMaskedText()

const { puuid, navigateToSummonerByPuuid } = usePlayerTab()
const { pagedMatchHistory, isLoading, loadDetails, downloadReplay, launchRelay } = useMatchHistory()

const { filters, hasFilters } = useMatchHistoryFilters()

const isSubset = <T = string | number,>(a: Set<T>, b: Set<T>) => {
  if (a.size > b.size) {
    return false
  }

  for (const item of a) {
    if (!b.has(item)) {
      return false
    }
  }
  return true
}

const gamesShouldHide = computed(() => {
  if (!pagedMatchHistory.value) {
    return new Set<number>()
  }

  if (!hasFilters.value) {
    return new Set<number>()
  }

  const { winLoss, selectedChampions, selectedSummoners } = filters.value

  const shouldShow = (g: LcuOrSgpGameSummary) => {
    const basicInfo = toBasicInfo(g)
    const participants = toParticipants(g, basicInfo)
    const participant = participants.find((p) => p.puuid === puuid.value)

    if (!participant) {
      return false
    }

    if (winLoss !== 'all' && participant.winResult !== winLoss) {
      return false
    }

    if (selectedChampions.length > 0) {
      const targetChampionIds = new Set<number>(selectedChampions)
      const championIds = new Set<number>([...participants.map((p) => p.championId)])

      if (!isSubset(targetChampionIds, championIds)) {
        return false
      }
    }

    if (selectedSummoners.length > 0) {
      const targetSummoners = new Set<string>(selectedSummoners)
      const summoners = new Set<string>([...participants.map((p) => p.puuid)])

      if (!isSubset(targetSummoners, summoners)) {
        return false
      }
    }

    return true
  }

  return pagedMatchHistory.value.games.reduce(
    (acc, g) => (shouldShow(g) ? acc : acc.add(g.gameId)),
    new Set<number>()
  )
})

// trick
const hidePrivacy = computed(() => masked('__streamer_flag__') !== '__streamer_flag__')
</script>
