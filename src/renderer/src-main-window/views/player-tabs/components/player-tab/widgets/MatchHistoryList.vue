<template>
  <div>
    <div
      v-if="isLoading && (!pagedMatchHistory || visibleGames.length === 0)"
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
        class="flex h-50 items-center justify-center rounded bg-black/5 dark:bg-white/5"
      >
        <span class="text-sm text-black/80 dark:text-white/60">{{
          hasActiveFilters ? t('PlayerTab.noFilteredMatchHistory') : t('PlayerTab.noMatchHistory')
        }}</span>
      </div>

      <div
        v-else-if="visibleGames.length === 0"
        class="flex h-50 flex-col items-center justify-center gap-2 rounded bg-black/5 dark:bg-white/5"
      >
        <span class="text-sm text-black/80 dark:text-white/60">{{
          t('PlayerTab.noFilteredMatchHistory')
        }}</span>

        <NButton size="small" tertiary @click="clearFilters">
          {{ t('PlayerTab.clearFilters') }}
        </NButton>
      </div>
    </template>

    <div v-if="pagedMatchHistory && visibleGames.length > 0" class="space-y-1">
      <MatchCard
        v-for="g of visibleGames"
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
import { usePosition } from '@renderer-shared/components/match-card/utils/text'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import {
  FTUE_TARGET_MATCH_HISTORY_HERO_FILTER_AVATAR,
  FTUE_TARGET_MATCH_HISTORY_HERO_FILTER_BUTTON,
  getFtueTargetJunglePathingMatchHistory,
  getFtueTargetSelector
} from '@shared/constants/ftue'
import { toBasicInfo } from '@shared/data-adapter/match-history/match-basic'
import {
  MatchParticipantPosition,
  toParticipants
} from '@shared/data-adapter/match-history/participants'
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { useTranslation } from 'i18next-vue'
import { NButton, NSpin, useMessage } from 'naive-ui'
import { computed, nextTick, onMounted, onUnmounted, useTemplateRef, watch } from 'vue'

import {
  FTUE_KEY_JUNGLE_PATHING_MATCH_HISTORY_DETAILS,
  FTUE_KEY_MATCH_HISTORY_HERO_FILTER_AVATAR,
  FTUE_KEY_MATCH_HISTORY_HERO_FILTER_BUTTON
} from '@main-window/shards/ftue/keys'
import { FtueTask, useFtueStore } from '@main-window/shards/ftue/store'
import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

import { usePlayerTab } from '../context'
import { useMatchHistory } from '../data/match-history'
import { useMatchHistoryFilters } from '../data/match-history-filters'
import { useSpectator } from '../data/spectator'

const as = useAppCommonStore()
const lcs = useLeagueClientStore()
const pts = usePlayerTabsStore()
const ftue = useFtueStore()
const ogs = useOngoingGameStore()
const message = useMessage()

const { t } = useTranslation()
const positionText = usePosition()

const {
  id,
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

const { mode, filters, hasActiveFilters, predicate, setFilters, clearFilters, setMode } =
  useMatchHistoryFilters()

const isSimpleMode = computed(() => mode.value === 'simple')

const junglePathingDataSource = computed(() => {
  return {
    preferredSource: preferredSource.value,
    sgpServerId: sgpServerId.value,
    isCrossRegion: isCrossRegion.value
  }
})

const visibleGames = computed(() => {
  if (!pagedMatchHistory.value) {
    return []
  }

  if (mode.value === 'advanced') {
    return pagedMatchHistory.value.games.filter((g) => predicate.value(g))
  }

  return pagedMatchHistory.value.games
})

const applyChampionFilter = (championId: number) => {
  if (!Number.isInteger(championId) || championId <= 0) {
    return
  }

  if (!isSimpleMode.value) {
    setMode('simple')
  }

  setFilters({
    ...filters.value,
    selectedChampions: [championId]
  })

  const championName = lcs.gameData.champions?.[championId]?.name || `#${championId}`
  message.info(t('PlayerTab.filter.sameChampionApplied', { champion: championName }), {
    duration: 2400,
    keepAliveOnHover: true
  })
}

const applyExclusiveChampionFilter = (championId: number) => {
  if (!Number.isInteger(championId) || championId <= 0) {
    return
  }

  if (!isSimpleMode.value) {
    setMode('simple')
  }

  setFilters({
    ...filters.value,
    selectedChampions: [championId],
    selectedPositions: []
  })

  const championName = lcs.gameData.champions?.[championId]?.name || `#${championId}`
  message.info(t('PlayerTab.filter.sameChampionApplied', { champion: championName }), {
    duration: 2400,
    keepAliveOnHover: true
  })
}

const applyPositionFilter = (position: MatchParticipantPosition) => {
  if (!position) {
    return
  }

  if (!isSimpleMode.value) {
    setMode('simple')
  }

  setFilters({
    ...filters.value,
    selectedChampions: [],
    selectedPositions: [position]
  })

  message.info(t('PlayerTab.filter.samePositionApplied', { position: positionText(position) }), {
    duration: 2400,
    keepAliveOnHover: true
  })
}

watch(
  () => pts.pendingChampionFilterByTab[id.value],
  (pendingChampionId) => {
    if (!pendingChampionId || !Number.isInteger(pendingChampionId) || pendingChampionId <= 0) {
      return
    }

    applyExclusiveChampionFilter(pendingChampionId)

    pts.consumePendingChampionFilter(id.value)
  },
  { immediate: true }
)

watch(
  () => pts.pendingPositionFilterByTab[id.value],
  (pendingPosition) => {
    if (!pendingPosition) {
      return
    }

    applyPositionFilter(pendingPosition)

    pts.consumePendingPositionFilter(id.value)
  },
  { immediate: true }
)

const maybeEnqueueHeroFilterFtue = () => {
  if (!isSimpleMode.value || !pagedMatchHistory.value?.games?.length) {
    return
  }

  enqueueFtueWhenTargetReady({
    id: FTUE_KEY_MATCH_HISTORY_HERO_FILTER_AVATAR,
    title: t('Ftue.heroFilter.avatar.title'),
    description: t('Ftue.heroFilter.avatar.description'),
    targetSelector: getFtueTargetSelector(FTUE_TARGET_MATCH_HISTORY_HERO_FILTER_AVATAR),
    placement: 'left'
  })

  enqueueFtueWhenTargetReady({
    id: FTUE_KEY_MATCH_HISTORY_HERO_FILTER_BUTTON,
    title: t('Ftue.heroFilter.button.title'),
    description: t('Ftue.heroFilter.button.description'),
    targetSelector: getFtueTargetSelector(FTUE_TARGET_MATCH_HISTORY_HERO_FILTER_BUTTON),
    placement: 'left'
  })
}

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

watch(
  () => visibleGames.value.length,
  (gameCount) => {
    if (gameCount > 0) {
      maybeEnqueueHeroFilterFtue()
    }
  },
  { immediate: true }
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
