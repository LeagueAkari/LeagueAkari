<template>
  <div class="grid items-start gap-4">
    <StoryPanel title="Ranked table">
      <RankedTable :ranked-stats="storyRankedStats" />
    </StoryPanel>

    <StoryPanel title="Jungle pathing maps">
      <div class="flex flex-wrap gap-8">
        <div>
          <div class="mb-2 text-xs font-semibold text-black/70 dark:text-white/70">
            Position + gank markers
          </div>
          <GankMap
            :position-points="storyGankPositionPoints"
            :kill-points="storyGankKillPoints"
            :size="220"
            balance-by-lane
            show-side-fill
            position-dot-size-class="h-1.5 w-1.5"
            kill-marker-size-class="h-4 w-4"
          />
        </div>
        <div>
          <div class="mb-2 text-xs font-semibold text-black/70 dark:text-white/70">Heatmap</div>
          <GankMap
            :position-points="storyGankPositionPoints"
            :kill-points="storyGankKillPoints"
            :size="220"
            heatmap
            :heatmap-grid-size="7"
            :heatmap-cell-limit="14"
          />
        </div>
      </div>
    </StoryPanel>
  </div>
</template>

<script setup lang="ts">
import GankMap from '@renderer-shared/components/ongoing-game-panel/widgets/player-info-card/jungle-pathing-info/GankMap.vue'

import RankedTable from '../../RankedTable.vue'
import { storyGankKillPoints, storyGankPositionPoints, storyRankedStats } from '../fixtures'
import StoryPanel from '../StoryPanel.vue'
</script>
