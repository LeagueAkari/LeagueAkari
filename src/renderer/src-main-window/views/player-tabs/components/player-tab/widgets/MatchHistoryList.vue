<template>
  <div>
    <!-- loading state -->
    <div
      v-if="
        isLoading &&
        (!pagedMatchHistory ||
          pagedMatchHistory.games.length === 0 ||
          gamesShouldHide.size === pagedMatchHistory.games.length)
      "
      class="flex h-50 items-center justify-center rounded bg-black/5 dark:bg-white/5"
    >
      <div class="flex items-center gap-2">
        <NSpin :size="16" />
        <span class="text-sm text-black/80 dark:text-white/60">{{ t('PlayerTab.loading') }}</span>
      </div>
    </div>

    <template v-else-if="pagedMatchHistory">
      <!-- empty placeholder -->
      <div
        v-if="pagedMatchHistory.games.length === 0"
        class="flex h-50 items-center justify-center rounded bg-black/5 dark:bg-white/5"
      >
        <span class="text-sm text-black/80 dark:text-white/60">{{
          t('PlayerTab.noMatchHistory')
        }}</span>
      </div>

      <!-- empty filtered games -->
      <div
        v-else-if="hasFilters && gamesShouldHide.size === pagedMatchHistory.games.length"
        class="flex h-50 items-center justify-center rounded bg-black/5 dark:bg-white/5"
      >
        <span class="text-sm text-black/80 dark:text-white/60">{{
          t('PlayerTab.noFilteredMatchHistory')
        }}</span>
      </div>
    </template>

    <!-- match history list -->
    <div v-if="pagedMatchHistory && pagedMatchHistory.games.length > 0" class="space-y-1">
      <MatchCard
        :class="{
          'hidden!': gamesShouldHide.has(g.gameId)
        }"
        v-for="g of pagedMatchHistory.games"
        ref="matchCardEls"
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
        :hide-privacy="as.settings.streamerMode"
        :replay-state="pagedMatchHistory.replayMetadata[g.gameId]"
        :show-jungle-pathing="pts.frontendSettings.showJunglePathing"
        :jungle-pathing-data-source="junglePathingDataSource"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import MatchCard from '@renderer-shared/components/match-card/MatchCard.vue'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import {
  getFtueTargetJunglePathingMatchHistory,
  getFtueTargetSelector
} from '@shared/constants/ftue'
import { toBasicInfo } from '@shared/data-adapter/match-history/match-basic'
import { toParticipants } from '@shared/data-adapter/match-history/participants'
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { useTranslation } from 'i18next-vue'
import { NSpin } from 'naive-ui'
import { computed, nextTick, onMounted, onUnmounted, useTemplateRef, watch } from 'vue'

import { FTUE_KEY_JUNGLE_PATHING_MATCH_HISTORY_DETAILS } from '@main-window/shards/ftue/keys'
import { FtueTask, useFtueStore } from '@main-window/shards/ftue/store'
import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

import { usePlayerTab } from '../context'
import { useMatchHistory } from '../data/match-history'
import { useMatchHistoryFilters } from '../data/match-history-filters'
import { shouldHideMatchHistoryGame } from '../data/match-history-visibility'
import { useSpectator } from '../data/spectator'

const as = useAppCommonStore()
const lcs = useLeagueClientStore()
const pts = usePlayerTabsStore()
const ftue = useFtueStore()
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
  pagedMatchHistory,
  isLoading,
  loadDetails: rawLoadDetails,
  downloadReplay,
  launchRelay,
  loadMatchHistory
} = useMatchHistory()

const { loadSpectatorData } = useSpectator()

const { filters, hasFilters } = useMatchHistoryFilters()

const junglePathingDataSource = computed(() => {
  return {
    preferredSource: preferredSource.value,
    sgpServerId: sgpServerId.value,
    isCrossRegion: isCrossRegion.value
  }
})

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

  const { winLoss, selectedChampions, selectedSummoners, showPractice, showIrregularGames } =
    filters.value

  const shouldShow = (g: LcuOrSgpGameSummary) => {
    if (
      shouldHideMatchHistoryGame(g, puuid.value, {
        showPractice,
        showIrregularGames
      })
    ) {
      return false
    }

    const basicInfo = toBasicInfo(g)

    if (!hasFilters.value) {
      return true
    }

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

const maybeEnqueueJunglePathingFtue = (gameId: number) => {
  if (!pts.frontendSettings.showJunglePathing || !pagedMatchHistory.value) {
    return
  }

  const summary = pagedMatchHistory.value.games.find((g) => g.gameId === gameId)

  if (!summary) {
    return
  }

  const participants = toParticipants(summary, toBasicInfo(summary))
  const hasJungler = participants.some((p) => {
    const position = (p.position || '').toUpperCase()
    return position === 'JUNGLE' || position === 'JUG'
  })

  if (!hasJungler) {
    return
  }

  const targetSelector = getFtueTargetSelector(getFtueTargetJunglePathingMatchHistory(gameId))

  enqueueFtueWhenTargetReady({
    id: FTUE_KEY_JUNGLE_PATHING_MATCH_HISTORY_DETAILS,
    title: t('Ftue.junglePathing.matchHistoryDetails.title'),
    description: t('Ftue.junglePathing.matchHistoryDetails.description'),
    targetSelector,
    placement: 'bottom'
  })
}

const enqueueFtueWhenTargetReady = (task: FtueTask, retries = 40) => {
  const tryEnqueue = (remaining: number) => {
    if (ftue.isCompleted(task.id)) {
      return
    }

    if (document.querySelector(task.targetSelector)) {
      ftue.enqueue(task)
      return
    }

    if (remaining <= 0) {
      return
    }

    window.setTimeout(() => {
      tryEnqueue(remaining - 1)
    }, 80)
  }

  tryEnqueue(retries)
}

const loadDetails = (gameId: number) => {
  rawLoadDetails(gameId)
  maybeEnqueueJunglePathingFtue(gameId)
}

const isEndOfGame = computed(
  () => lcs.gameflow.phase === 'EndOfGame' || lcs.gameflow.phase === 'PreEndOfGame'
)

// 页面在游戏结束后刷新对应 tab 的战绩
// 当该页面被 KeepAlive, 即使页面不可见也会触发
watch(
  () => isEndOfGame.value,
  (is, _prevP) => {
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
