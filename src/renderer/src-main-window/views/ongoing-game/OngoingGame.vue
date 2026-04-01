<template>
  <div class="h-full">
    <MatchPreviewer
      v-model:show="showPreviewModal"
      :game-id="previewingGame.gameId"
      :source="previewingGame.source"
      :puuid="previewingGame.puuid"
      :summary="previewingGame.summary"
      :hide-privacy="as.settings.streamerMode"
      @navigate-to-summoner-by-puuid="navigateToTabByPuuid"
    />
    <OngoingGamePanel
      :content-width="contentWidth"
      :content-height="contentHeight"
      @navigate-to-summoner-by-puuid="navigateToTabByPuuid"
      @navigate-to-summoner-by-puuid-with-champion="navigateToTabByPuuidWithChampionFilter"
      @navigate-to-summoner-by-puuid-with-position="navigateToTabByPuuidWithPositionFilter"
      @preview-game="handlePreviewGame"
    />
  </div>
</template>

<script lang="ts" setup>
import MatchPreviewer from '@renderer-shared/components/MatchPreviewer.vue'
import OngoingGamePanel from '@renderer-shared/components/ongoing-game-panel/OngoingGamePanel.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import {
  FTUE_TARGET_JUNGLE_PATHING_ONGOING_GAME,
  FTUE_TARGET_ONGOING_GAME_HERO_FILTER_AVATAR,
  FTUE_TARGET_ONGOING_GAME_HERO_FILTER_BUTTON,
  getFtueTargetSelector
} from '@shared/constants/ftue'
import type { MatchParticipantPosition } from '@shared/data-adapter/match-history/participants'
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { useTranslation } from 'i18next-vue'
import { ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'

import { useMainWindowAppContext } from '@main-window/context'
import {
  FTUE_KEY_JUNGLE_PATHING_ONGOING_GAME_CARD,
  FTUE_KEY_ONGOING_GAME_HERO_FILTER_AVATAR,
  FTUE_KEY_ONGOING_GAME_HERO_FILTER_BUTTON
} from '@main-window/shards/ftue/keys'
import { FtueTask, useFtueStore } from '@main-window/shards/ftue/store'
import { PlayerTabsRenderer } from '@main-window/shards/player-tabs'
import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

const { contentWidth, contentHeight } = useMainWindowAppContext()

const pt = useInstance(PlayerTabsRenderer)

const as = useAppCommonStore()
const ogs = useOngoingGameStore()
const sgps = useSgpStore()
const pts = usePlayerTabsStore()
const ftue = useFtueStore()
const route = useRoute()
const router = useRouter()
const { t } = useTranslation()

const { navigateToTabByPuuid } = pt.useNavigateToTab()

const navigateToTabByPuuidWithChampionFilter = (puuid: string, championId: number) => {
  if (!puuid || !championId || Number.isNaN(championId)) {
    navigateToTabByPuuid(puuid)
    return
  }

  const sgpServerId = sgps.availability.sgpServerId
  if (!sgpServerId) {
    navigateToTabByPuuid(puuid)
    return
  }

  const tabId = pt.toUnionId(sgpServerId, puuid)
  pts.setPendingChampionFilter(tabId, championId)
  router.replace({
    name: 'player-tabs',
    params: { puuid, sgpServerId }
  })
}

const navigateToTabByPuuidWithPositionFilter = (
  puuid: string,
  position: MatchParticipantPosition
) => {
  if (!puuid || !position) {
    navigateToTabByPuuid(puuid)
    return
  }

  const sgpServerId = sgps.availability.sgpServerId
  if (!sgpServerId) {
    navigateToTabByPuuid(puuid)
    return
  }

  const tabId = pt.toUnionId(sgpServerId, puuid)
  pts.setPendingPositionFilter(tabId, position)
  router.replace({
    name: 'player-tabs',
    params: { puuid, sgpServerId }
  })
}

const showPreviewModal = ref(false)
const previewingGame = shallowRef({
  gameId: 0,
  summary: undefined as LcuOrSgpGameSummary | undefined,
  puuid: undefined as string | undefined,
  source: 'sgp' as 'sgp' | 'lcu'
})

const handlePreviewGame = (summary: LcuOrSgpGameSummary | number, puuid?: string) => {
  previewingGame.value = {
    gameId: typeof summary === 'object' ? summary.gameId : summary,
    summary: typeof summary === 'object' ? summary : undefined,
    puuid,
    source: typeof summary === 'object' ? summary.source : as.settings.preferredLolSource
  }

  showPreviewModal.value = true
}

const enqueueFtueWhenTargetReady = (task: FtueTask, retries = 40) => {
  const tryEnqueue = (remaining: number) => {
    if (ftue.isCompleted(task.id)) {
      if (import.meta.env.DEV) {
        console.info('[FTUE] ongoing skip enqueue (completed)', task.id)
      }
      return
    }

    if (document.querySelector(task.targetSelector)) {
      if (import.meta.env.DEV) {
        console.info('[FTUE] ongoing enqueue', task.id)
      }
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

watch(
  () => ({
    route: route.name,
    enabled: ogs.settings.showJunglePathing,
    count: Object.keys(ogs.jungleAnalysis || {}).length
  }),
  ({ route, enabled, count }) => {
    if (route !== 'ongoing-game' || !enabled || count <= 0) {
      if (import.meta.env.DEV) {
        console.info('[FTUE] ongoing watch skip', { route, enabled, count })
      }
      return
    }

    enqueueFtueWhenTargetReady({
      id: FTUE_KEY_JUNGLE_PATHING_ONGOING_GAME_CARD,
      title: t('Ftue.junglePathing.ongoingGameCard.title'),
      description: t('Ftue.junglePathing.ongoingGameCard.description'),
      targetSelector: getFtueTargetSelector(FTUE_TARGET_JUNGLE_PATHING_ONGOING_GAME),
      placement: 'right'
    })
  },
  { immediate: true }
)

watch(
  () => ({
    route: route.name,
    count: Object.keys(ogs.summoner || {}).length
  }),
  ({ route, count }) => {
    if (route !== 'ongoing-game' || count <= 0) {
      return
    }

    enqueueFtueWhenTargetReady({
      id: FTUE_KEY_ONGOING_GAME_HERO_FILTER_AVATAR,
      title: t('Ftue.heroFilter.ongoingAvatar.title'),
      description: t('Ftue.heroFilter.ongoingAvatar.description'),
      targetSelector: getFtueTargetSelector(FTUE_TARGET_ONGOING_GAME_HERO_FILTER_AVATAR),
      placement: 'right'
    })

    enqueueFtueWhenTargetReady({
      id: FTUE_KEY_ONGOING_GAME_HERO_FILTER_BUTTON,
      title: t('Ftue.heroFilter.ongoingButton.title'),
      description: t('Ftue.heroFilter.ongoingButton.description'),
      targetSelector: getFtueTargetSelector(FTUE_TARGET_ONGOING_GAME_HERO_FILTER_BUTTON),
      placement: 'bottom'
    })
  },
  { immediate: true }
)
</script>
