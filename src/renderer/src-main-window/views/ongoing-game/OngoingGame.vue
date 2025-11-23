<template>
  <div class="og-page">
    <MatchPreviewer
      v-model:show="showPreviewModal"
      :game-id="previewingGame.gameId"
      :source="previewingGame.source"
      :puuid="previewingGame.puuid"
      :summary="previewingGame.summary"
      @navigate-to-summoner-by-puuid="navigateToTabByPuuid"
    />
    <OngoingGamePanel
      @to-summoner="navigateToTabByPuuid"
      @show-game="handleShowGame"
      @show-game-by-id="handleShowGameById"
    />
  </div>
</template>

<script lang="ts" setup>
import MatchPreviewer from '@renderer-shared/components/MatchPreviewer.vue'
import OngoingGamePanel from '@renderer-shared/components/ongoing-game-panel/OngoingGamePanel.vue'
import { useInstance } from '@renderer-shared/shards'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { ref, shallowRef } from 'vue'

import { MatchHistoryTabsRenderer } from '@main-window/shards/match-history-tabs'

const mh = useInstance(MatchHistoryTabsRenderer)

const ogs = useOngoingGameStore()

const { navigateToTabByPuuid } = mh.useNavigateToTab()

const showPreviewModal = ref(false)
const previewingGame = shallowRef({
  gameId: 0,
  summary: undefined as LcuOrSgpGameSummary | undefined,
  puuid: undefined as string | undefined,
  source: 'sgp' as 'sgp' | 'lcu'
})

const handleShowGame = (summary: LcuOrSgpGameSummary, puuid: string) => {
  showPreviewModal.value = true
  previewingGame.value = {
    gameId: summary.gameId,
    summary,
    puuid,
    source: summary.source
  }
}

const handleShowGameById = (id: number, puuid: string) => {
  showPreviewModal.value = true
  previewingGame.value = {
    gameId: id,
    summary: undefined,
    puuid,
    source: ogs.settings.matchHistoryUseSgpApi ? 'sgp' : 'lcu'
  }
}
</script>

<style scoped>
.og-page {
  height: 100%;
}
</style>
