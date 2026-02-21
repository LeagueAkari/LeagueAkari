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
import {
  FTUE_TARGET_JUNGLE_PATHING_ONGOING_GAME,
  getFtueTargetSelector
} from '@shared/constants/ftue'
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { useTranslation } from 'i18next-vue'
import { ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'

import { useAppContext } from '@main-window/context'
import { FTUE_KEY_JUNGLE_PATHING_ONGOING_GAME_CARD } from '@main-window/shards/ftue/keys'
import { FtueTask, useFtueStore } from '@main-window/shards/ftue/store'
import { PlayerTabsRenderer } from '@main-window/shards/player-tabs'

const { contentWidth, contentHeight } = useAppContext()

const pt = useInstance(PlayerTabsRenderer)

const as = useAppCommonStore()
const ogs = useOngoingGameStore()
const ftue = useFtueStore()
const route = useRoute()
const { t } = useTranslation()

const { navigateToTabByPuuid } = pt.useNavigateToTab()

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
</script>
