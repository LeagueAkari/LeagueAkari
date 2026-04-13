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
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { ref, shallowRef } from 'vue'

import { useMainWindowAppContext } from '@main-window/context'
import { PlayerTabsRenderer } from '@main-window/shards/player-tabs'

const { contentWidth, contentHeight } = useMainWindowAppContext()

const pt = useInstance(PlayerTabsRenderer)

const as = useAppCommonStore()

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


</script>
