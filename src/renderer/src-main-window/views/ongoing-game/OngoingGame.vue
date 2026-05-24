<template>
  <div class="h-full">
    <MatchPreviewer
      v-model:show="showPreviewModal"
      :game-id="previewingGame.gameId"
      :source="previewingGame.source"
      :puuid="previewingGame.puuid"
      :summary="previewingGame.summary"
      :details="previewingGame.details"
      :hide-privacy="as.settings.streamerMode"
      can-dry-run-ongoing-game
      @navigate-to-summoner-by-puuid="navigateToTabByPuuid"
      @dry-run-ongoing-game="handleDryRunOngoingGame"
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
import MatchPreviewer from '@renderer-shared/components/match-preview/MatchPreviewer.vue'
import OngoingGamePanel from '@renderer-shared/components/ongoing-game-panel/OngoingGamePanel.vue'
import {
  type MatchPreviewPayload,
  type MatchPreviewState,
  toMatchPreviewState
} from '@renderer-shared/components/match-preview'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { OngoingGameRenderer } from '@renderer-shared/shards/ongoing-game'
import { DraftOptions } from '@shared/types/shards/ongoing-game'
import { ref, shallowRef } from 'vue'

import { useMainWindowAppContext } from '@main-window/context'
import { PlayerTabsRenderer } from '@main-window/shards/player-tabs'

const { contentWidth, contentHeight } = useMainWindowAppContext()

const pt = useInstance(PlayerTabsRenderer)
const og = useInstance(OngoingGameRenderer)

const as = useAppCommonStore()

const { navigateToTabByPuuid } = pt.useNavigateToTab()

const showPreviewModal = ref(false)
const previewingGame = shallowRef<MatchPreviewState>({
  gameId: 0,
  source: 'sgp'
})

const handlePreviewGame = (payload: MatchPreviewPayload) => {
  previewingGame.value = toMatchPreviewState(payload, as.settings.preferredLolSource)
  showPreviewModal.value = true
}

const handleDryRunOngoingGame = async (draft: DraftOptions) => {
  await og.setDraft(draft)
  showPreviewModal.value = false
}
</script>
