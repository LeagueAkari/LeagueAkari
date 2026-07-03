<template>
  <div class="grid items-start gap-4">
    <StoryPanel
      title="LCU ranked match"
      description="Raw summary/details come from existing LCU match-history fixtures: q_420 game and timeline. Static champion, item, rune, summoner spell, queue, map, and augment resources are loaded through Community Dragon (raw.communitydragon.org)."
    >
      <div class="match-card-story-frame">
        <MatchCard
          v-model:is-expanded="rankedExpanded"
          :summary="storyLcuRankedMatchCard.summary"
          :details="storyLcuRankedMatchCard.details"
          :puuid="storyLcuRankedMatchCard.puuid"
          :replay-state="rankedReplayState"
          can-dry-run-ongoing-game
          @navigate-to-summoner-by-puuid="handleNavigate"
          @load-details="handleLoadDetails"
          @download-replay="handleDownloadReplay"
          @watch-replay="handleWatchReplay"
          @dry-run-ongoing-game="handleDryRunOngoingGame"
        />
      </div>
    </StoryPanel>

    <StoryPanel
      title="LCU arena match"
      description="Raw summary/details come from existing LCU match-history fixtures: q_1700 game and timeline. This scene keeps streamer privacy enabled and covers arena team placement, augments, and special queue/map labels."
    >
      <div class="match-card-story-frame">
        <MatchCard
          v-model:is-expanded="arenaExpanded"
          :summary="storyLcuArenaMatchCard.summary"
          :details="storyLcuArenaMatchCard.details"
          :puuid="storyLcuArenaMatchCard.puuid"
          hide-privacy
          @navigate-to-summoner-by-puuid="handleNavigate"
          @load-details="handleLoadDetails"
        />
      </div>
    </StoryPanel>

    <StoryPanel
      title="SGP arena match with synthetic details"
      description="Raw summary comes from the existing SGP match-history-query q_1700 fixture. The details payload is generated from the LCU q_1700 timeline to cover SGP-only builds and stats-line tabs while keeping participant and event data fixture-backed."
    >
      <div class="match-card-story-frame">
        <MatchCard
          v-model:is-expanded="sgpExpanded"
          :summary="storySgpArenaMatchCard.summary"
          :details="storySgpArenaMatchCard.details"
          :puuid="storySgpArenaMatchCard.puuid"
          :replay-state="sgpReplayState"
          @navigate-to-summoner-by-puuid="handleNavigate"
          @load-details="handleLoadDetails"
          @download-replay="handleDownloadReplay"
          @watch-replay="handleWatchReplay"
        />
      </div>
    </StoryPanel>

    <StoryPanel
      title="Details loading and empty states"
      description="These scenes reuse the same LCU q_420 raw summary and intentionally omit details to cover the card-level loading and refresh empty states."
    >
      <div class="grid gap-3">
        <div class="match-card-story-frame">
          <MatchCard
            is-expanded
            :summary="storyLcuRankedMatchCard.summary"
            :details="null"
            :puuid="storyLcuRankedMatchCard.puuid"
            loading-details
            @load-details="handleLoadDetails"
          />
        </div>
        <div class="match-card-story-frame">
          <MatchCard
            is-expanded
            :summary="storyLcuRankedMatchCard.summary"
            :details="null"
            :puuid="storyLcuRankedMatchCard.puuid"
            @load-details="handleLoadDetails"
          />
        </div>
      </div>
    </StoryPanel>
  </div>
</template>

<script setup lang="ts">
import MatchCard from '@renderer-shared/components/match-card/MatchCard.vue'
import type { DraftOptions } from '@shared/shards/ongoing-game'
import type { ReplayDownloadProgress } from '@shared/types/league-client/replays'
import { ref } from 'vue'

import StoryPanel from '../StoryPanel.vue'
import {
  storyLcuArenaMatchCard,
  storyLcuRankedMatchCard,
  storySgpArenaMatchCard
} from './match-card-fixtures'

const rankedExpanded = ref(true)
const arenaExpanded = ref(false)
const sgpExpanded = ref(true)

const rankedReplayState: ReplayDownloadProgress = {
  gameId: storyLcuRankedMatchCard.summary.gameId,
  state: 'watch',
  downloadProgress: 100
}

const sgpReplayState: ReplayDownloadProgress = {
  gameId: storySgpArenaMatchCard.summary.gameId,
  state: 'download',
  downloadProgress: 0
}

const handleNavigate = (puuid: string, setCurrent?: boolean) => {
  console.info('[storybook] navigateToSummonerByPuuid', puuid, setCurrent)
}

const handleLoadDetails = (gameId: number) => {
  console.info('[storybook] loadDetails', gameId)
}

const handleDownloadReplay = (gameId: number) => {
  console.info('[storybook] downloadReplay', gameId)
}

const handleWatchReplay = (gameId: number) => {
  console.info('[storybook] watchReplay', gameId)
}

const handleDryRunOngoingGame = (draft: DraftOptions) => {
  console.info('[storybook] dryRunOngoingGame', draft)
}
</script>

<style scoped>
.match-card-story-frame {
  max-width: 100%;
  width: 920px;
}
</style>
