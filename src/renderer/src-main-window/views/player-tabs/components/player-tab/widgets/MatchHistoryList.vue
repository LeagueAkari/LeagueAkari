<template>
  <div>
    <div
      v-if="isLoading && (!page || visibleGamesCount === 0)"
      class="flex h-50 items-center justify-center rounded bg-black/5 dark:bg-white/5"
    >
      <div class="flex items-center gap-2">
        <NSpin :size="16" />
        <span class="text-sm text-black/80 dark:text-white/60">{{ t('PlayerTab.loading') }}</span>
      </div>
    </div>

    <template v-else-if="page">
      <div
        v-if="visibleGamesCount === 0"
        class="flex h-50 flex-col items-center justify-center gap-2 rounded bg-black/5 dark:bg-white/5"
      >
        <span class="text-sm text-black/80 dark:text-white/60">{{
          rootHasCombinator ? t('PlayerTab.noFilteredMatchHistory') : t('PlayerTab.noMatchHistory')
        }}</span>

        <NButton
          v-if="rootHasCombinator && !page.isLoadedByCollectMode"
          size="small"
          tertiary
          @click="clearPredicate"
        >
          {{ t('PlayerTab.clearFilters') }}
        </NButton>
      </div>

      <div v-if="page.games.length > 0" v-show="visibleGamesCount > 0" class="flex flex-col gap-1">
        <MatchCard
          v-for="g of page.games"
          v-show="isGameVisible(g)"
          ref="matchCardEls"
          :summary="g"
          :puuid="puuid"
          :key="toGameKey(g)"
          :theme="as.colorTheme"
          @navigate-to-summoner-by-puuid="navigateToSummonerByPuuid"
          @load-details="loadDetails(g.gameId)"
          @download-replay="downloadReplay(g.gameId)"
          @watch-replay="launchRelay(g.gameId)"
          @dry-run-ongoing-game="handleDryRunOngoingGame"
          :details="page.details[g.gameId]"
          :loading-details="page.detailsLoading[g.gameId]"
          :hide-privacy="as.settings.streamerMode"
          :replay-state="page.replayMetadata[g.gameId]"
          :can-dry-run-ongoing-game="canDryRunOngoingGame"
        />
      </div>
    </template>

    <div
      v-else-if="!page"
      class="flex h-50 flex-col items-center justify-center gap-2 rounded bg-black/5 dark:bg-white/5"
    >
      <span class="text-sm text-black/80 dark:text-white/60">{{
        t('PlayerTab.noMatchHistory')
      }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import MatchCard from '@renderer-shared/components/match-card/MatchCard.vue'
import type { MatchPreviewPayload } from '@renderer-shared/components/match-preview'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { OngoingGameRenderer } from '@renderer-shared/shards/ongoing-game'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { DraftOptions } from '@shared/types/shards/ongoing-game'
import { useTranslation } from 'i18next-vue'
import { NButton, NSpin } from 'naive-ui'
import { computed, nextTick, onMounted, onUnmounted, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'

import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

import { usePlayerTab } from '../context'
import { useMatchHistory } from '../data/match-history'
import { useMatchHistoryFilters } from '../data/match-history-filters'
import { useSpectator } from '../data/spectator'

const as = useAppCommonStore()
const lcs = useLeagueClientStore()
const pts = usePlayerTabsStore()
const ogs = useOngoingGameStore()
const og = useInstance(OngoingGameRenderer)
const router = useRouter()

const { t } = useTranslation()

const { puuid, events, isCrossRegion, navigateToSummonerByPuuid, previewGame } = usePlayerTab()
const {
  page,
  isLoading,
  filteredGames,
  loadDetails,
  downloadReplay,
  launchRelay,
  loadMatchHistory
} = useMatchHistory()

const { loadSpectatorData } = useSpectator()

const { rootHasCombinator, clearPredicate } = useMatchHistoryFilters()

const toGameKey = (game: LcuOrSgpGameSummary) => {
  return `${game.source}:${game.gameId}`
}

const visibleGameKeys = computed(() => {
  return new Set(filteredGames.value.map(toGameKey))
})

const visibleGamesCount = computed(() => {
  return filteredGames.value.length
})

const isGameVisible = (game: LcuOrSgpGameSummary) => {
  return visibleGameKeys.value.has(toGameKey(game))
}

const handleDryRunOngoingGame = async (draft: DraftOptions) => {
  if (!canDryRunOngoingGame.value) {
    return
  }

  await og.setDraft(draft)
  await router.replace({ name: 'ongoing-game' })
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

        if (!page.value || (page.value.queryParams.startIndex || 0) === 0) {
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

watch(visibleGameKeys, () => {
  nextTick(() => {
    matchCardEls.value?.forEach((el) => {
      const summary = el?.$props.summary as LcuOrSgpGameSummary | undefined

      if (summary && !isGameVisible(summary)) {
        el?.setExpanded(false)
      }
    })
  })
})

const handleFocusGame = (payload: MatchPreviewPayload) => {
  const { summary } = payload
  const extractedGameId = typeof summary === 'number' ? summary : summary.gameId
  const el = matchCardEls.value?.find((el) => {
    const cardSummary = el?.$props.summary as LcuOrSgpGameSummary | undefined

    return cardSummary?.gameId === extractedGameId && isGameVisible(cardSummary)
  })

  if (el) {
    el.setExpanded(true)

    nextTick(() => {
      ;(el.$el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  } else {
    const localSummary =
      typeof summary === 'number'
        ? page.value?.games.find((game) => game.gameId === summary)
        : summary

    previewGame({
      ...payload,
      summary: localSummary ?? summary,
      details:
        payload.details ?? (localSummary ? page.value?.details[localSummary.gameId] : undefined)
    })
  }
}

// 目前的对局分析模块强依赖当前大区的玩家数据，因此暂时只支持本区玩家模拟
const canDryRunOngoingGame = computed(() => {
  return !isCrossRegion.value
})

onMounted(() => {
  events.on('focusGame', handleFocusGame)
})

onUnmounted(() => {
  events.off('focusGame', handleFocusGame)
})
</script>
