<template>
  <div class="grid gap-4">
    <MatchPreviewer
      v-model:show="showPreviewModal"
      :summary="previewingGame.summary"
      :details="previewingGame.details"
      :puuid="previewingGame.puuid"
      @load-details="handleLoadPreviewDetails"
      @navigate-to-summoner-by-puuid="handleNavigate"
      @dry-run-ongoing-game="handleDryRunOngoingGame"
    />

    <StoryPanel title="Current ranked game" :description="activeDescription">
      <div class="panel-size-controls">
        <div class="control-row">
          <div class="control-label">Width</div>
          <NSlider v-model:value="panelWidth" :min="720" :max="1400" :step="20" />
          <NInputNumber
            :value="panelWidth"
            :min="720"
            :max="1400"
            :step="20"
            size="small"
            @update:value="setPanelWidth"
          />
        </div>
        <div class="control-row">
          <div class="control-label">Height</div>
          <NSlider v-model:value="panelHeight" :min="360" :max="1600" :step="20" />
          <NInputNumber
            :value="panelHeight"
            :min="360"
            :max="1600"
            :step="20"
            size="small"
            @update:value="setPanelHeight"
          />
        </div>
      </div>

      <div class="ongoing-game-story-frame" :style="{ width: `${panelWidth}px` }">
        <OngoingGameProvider :value="activeOngoingGame">
          <OngoingGamePanel
            :content-width="panelWidth"
            :content-height="panelHeight"
            @navigate-to-summoner-by-puuid="handleNavigate"
            @preview-game="handlePreviewGame"
          />
        </OngoingGameProvider>
      </div>
    </StoryPanel>

    <StoryPanel
      title="Empty states"
      description="These provider values keep the same Storybook resource runtime but intentionally provide no active game data, covering the disconnected, idle, and disabled panel states without touching League Akari stores."
    >
      <div class="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div class="empty-state-frame">
          <OngoingGameProvider :value="disconnectedOngoingGame">
            <OngoingGamePanel :content-width="360" :content-height="260" />
          </OngoingGameProvider>
        </div>
        <div class="empty-state-frame">
          <OngoingGameProvider :value="noGameOngoingGame">
            <OngoingGamePanel :content-width="360" :content-height="260" />
          </OngoingGameProvider>
        </div>
        <div class="empty-state-frame">
          <OngoingGameProvider :value="disabledOngoingGame">
            <OngoingGamePanel :content-width="360" :content-height="260" />
          </OngoingGameProvider>
        </div>
      </div>
    </StoryPanel>
  </div>
</template>

<script setup lang="ts">
import MatchPreviewer from '@renderer-shared/components/match-preview/MatchPreviewer.vue'
import {
  type MatchPreviewPayload,
  type MatchPreviewState,
  toMatchPreviewState
} from '@renderer-shared/components/match-preview'
import OngoingGamePanel from '@renderer-shared/components/ongoing-game-panel/OngoingGamePanel.vue'
import { OngoingGameProvider } from '@renderer-shared/providers/ongoing-game'
import {
  createStoryOngoingGameProviderValue,
  storyOngoingGamePanelPreviewSummary,
  storyOngoingGamePanelSource
} from '@renderer-shared/providers/ongoing-game/storybook'
import type { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import type { DraftOptions } from '@shared/shards/ongoing-game'
import { NInputNumber, NSlider } from 'naive-ui'
import { ref, shallowRef, watch } from 'vue'

import StoryPanel from '../StoryPanel.vue'

const props = withDefaults(
  defineProps<{
    initialPanelWidth?: number
    initialPanelHeight?: number
  }>(),
  {
    initialPanelWidth: 1320,
    initialPanelHeight: 920
  }
)

const activeOngoingGame = createStoryOngoingGameProviderValue()
const disconnectedOngoingGame = createStoryOngoingGameProviderValue('disconnected')
const noGameOngoingGame = createStoryOngoingGameProviderValue('no-game')
const disabledOngoingGame = createStoryOngoingGameProviderValue('disabled')
const panelWidth = ref(props.initialPanelWidth)
const panelHeight = ref(props.initialPanelHeight)
const showPreviewModal = ref(false)
const previewingGame = shallowRef<MatchPreviewState>({
  gameId: storyOngoingGamePanelPreviewSummary.gameId,
  source: storyOngoingGamePanelPreviewSummary.source,
  puuid: storyOngoingGamePanelSource.currentPlayerPuuid,
  summary: storyOngoingGamePanelPreviewSummary
})

const activeDescription = `Current roster comes from ${storyOngoingGamePanelSource.currentGame}. ${storyOngoingGamePanelSource.currentPlayerName}'s ${storyOngoingGamePanelSource.currentPlayerHistoryCount} match-history entries and aggregate analysis come from ${storyOngoingGamePanelSource.currentPlayerHistory}; the other current-game players intentionally keep empty history/analysis to avoid data conflicts. Champion, queue, spell, image, and other static resources are loaded through ${storyOngoingGamePanelSource.staticResources}.`

const handleNavigate = (puuid: string, initParams?: unknown) => {
  console.info('[storybook] navigateToSummonerByPuuid', puuid, initParams)
}

const handlePreviewGame = (payload: MatchPreviewPayload) => {
  console.info('[storybook] previewGame', payload)
  const previewState = toMatchPreviewState(
    payload,
    storyOngoingGamePanelPreviewSummary.source,
    storyOngoingGamePanelSource.currentPlayerPuuid
  )

  if (!previewState.summary && previewState.gameId === storyOngoingGamePanelPreviewSummary.gameId) {
    previewState.summary = storyOngoingGamePanelPreviewSummary
  }

  previewingGame.value = previewState
  showPreviewModal.value = true
}

const handleLoadPreviewDetails = (summary: LcuOrSgpGameSummary) => {
  console.info('[storybook] loadPreviewDetails', summary.gameId, summary.source)
}

const handleDryRunOngoingGame = (draft: DraftOptions) => {
  console.info('[storybook] dryRunOngoingGame', draft)
}

const setPanelWidth = (value: number | null) => {
  if (typeof value === 'number') {
    panelWidth.value = value
  }
}

const setPanelHeight = (value: number | null) => {
  if (typeof value === 'number') {
    panelHeight.value = value
  }
}

watch(
  () => props.initialPanelWidth,
  (value) => {
    panelWidth.value = value
  }
)

watch(
  () => props.initialPanelHeight,
  (value) => {
    panelHeight.value = value
  }
)
</script>

<style scoped>
.panel-size-controls {
  display: grid;
  gap: 10px;
  margin-bottom: 12px;
}

.control-row {
  display: grid;
  grid-template-columns: 48px minmax(160px, 1fr) 112px;
  align-items: center;
  gap: 12px;
}

.control-label {
  font-size: 12px;
  font-weight: 600;
  color: color-mix(in oklch, var(--la-color-text-primary) 70%, transparent);
}

.ongoing-game-story-frame {
  max-width: 100%;
}

.empty-state-frame {
  min-width: 0;
  overflow: hidden;
}
</style>
