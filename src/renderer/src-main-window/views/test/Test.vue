<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper">
      <MatchCard
        :width="selectedOption"
        :summary="mockData2.summary"
        :details="mockData2.details"
        :puuid="mockData2.puuid"
        :theme="as.colorTheme"
      />

      <!-- Radio Group dev -->
      <div
        :style="{ width: `${selectedOption}px` }"
        class="mt-1 p-4 rounded dark:bg-white/5 bg-black/5 box-border transition-[width]"
      >
        <div class="dark:text-white/80 text-black/80 text-sm font-semibold mb-2">宽度</div>
        <NRadioGroup v-model:value="selectedOption">
          <div class="flex gap-2 flex-wrap">
            <NRadio :value="680" label="680px" />
            <NRadio :value="720" label="720px" />
            <NRadio :value="760" label="760px" />
            <NRadio :value="800" label="800px" />
            <NRadio :value="840" label="840px" />
            <NRadio :value="880" label="880px" />
            <NRadio :value="920" label="920px" />
            <NRadio :value="960" label="960px" />
            <NRadio :value="1000" label="1000px" />
          </div>
        </NRadioGroup>
      </div>

      <div
        :style="{ width: `${selectedOption}px` }"
        class="mt-1 p-4 rounded dark:bg-white/5 bg-black/5 box-border transition-[width]"
      >
        <div class="dark:text-white/80 text-black/80 text-sm font-semibold mb-2">数据类型</div>
        <NRadioGroup v-model:value="selectedDataType">
          <div class="flex gap-2 flex-wrap">
            <NRadio value="lcu" label="lcu" />
            <NRadio value="sgp" label="sgp" />
          </div>
        </NRadioGroup>
      </div>

      <div
        :style="{ width: `${selectedOption}px` }"
        class="mt-1 p-4 rounded dark:bg-white/5 bg-black/5 box-border transition-[width]"
      >
        <div class="dark:text-white/80 text-black/80 text-sm font-semibold mb-2">主题</div>
        <NRadioGroup :value="as.colorTheme" @update:value="app.setTheme($event)">
          <div class="flex gap-2 flex-wrap">
            <NRadio value="dark" label="dark" />
            <NRadio value="light" label="light" />
          </div>
        </NRadioGroup>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import MatchCard from '@renderer-shared/components/match-card/MatchCard.vue'
import { useInstance } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { Game, GameTimeline } from '@shared/types/league-client/match-history'
import { SgpGameDetailsLol, SgpGameSummaryLol } from '@shared/types/sgp/match-history'
import { NRadio, NRadioGroup, NScrollbar } from 'naive-ui'
import { computed, ref } from 'vue'

import lcuGameData from './lcu/kiwi-game_10358513149.json'
import lcuTimeline from './lcu/kiwi-gameline_10358513149.json'
import lcuRankSummary from './lcu/rank-game_summary_8457979403.json'
import lcuRankTimeline from './lcu/rank-gameline_details_8457979403.json'
import sgpTimeline from './sgp/kiwi-game-details_10358513149.json'
import sgpGameData from './sgp/kiwi-game-summary_10358513149.json'
import sgpRankTimeline from './sgp/rank-game-details_8457979403.json'
import sgpRankSummary from './sgp/rank-game-summary_8457979403.json'

const as = useAppCommonStore()
const app = useInstance(AppCommonRenderer)

const selectedOption = ref(800)
const selectedDataType = ref('sgp')

const mockData = computed(() => {
  if (selectedDataType.value === 'lcu') {
    return {
      summary: {
        source: 'lcu',
        data: lcuGameData as unknown as Game
      } as const,
      details: {
        source: 'lcu',
        data: lcuTimeline as unknown as GameTimeline
      } as const,
      puuid: 'd7d4997b-2e3e-5c9e-a57e-487d83564a16'
    }
  }

  return {
    summary: {
      source: 'sgp',
      data: sgpGameData as unknown as SgpGameSummaryLol
    } as const,
    details: {
      source: 'sgp',
      data: sgpTimeline as unknown as SgpGameDetailsLol
    } as const,
    puuid: 'd7d4997b-2e3e-5c9e-a57e-487d83564a16'
  }
})

const mockData2 = computed(() => {
  if (selectedDataType.value === 'lcu') {
    return {
      summary: {
        source: 'lcu',
        gameId: lcuRankSummary.gameId,
        data: lcuRankSummary as unknown as Game
      } as const,
      details: {
        source: 'lcu',
        gameId: lcuRankSummary.gameId,
        data: lcuRankTimeline as unknown as GameTimeline
      } as const,
      puuid: 'ac39ac3a-b873-5667-b70f-096bf1b28241'
    }
  }

  return {
    summary: {
      source: 'sgp',
      gameId: sgpRankSummary.json.gameId,
      data: sgpRankSummary as unknown as SgpGameSummaryLol
    } as const,
    details: {
      source: 'sgp',
      gameId: sgpRankTimeline.json.gameId,
      data: sgpRankTimeline as unknown as SgpGameDetailsLol
    } as const,
    puuid: 'ac39ac3a-b873-5667-b70f-096bf1b28241'
  }
})
</script>

<style scoped>
.single-root {
  height: 100%;
}

.markdown-text {
  user-select: text;

  max-width: 800px;
}

.colors-container {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;

  .card {
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .title {
    font-size: 1.5em;
    font-weight: bold;
    margin-bottom: 8px;
  }

  .info {
    font-size: 0.9em;
    margin-bottom: 4px;
  }
}

.section-icon-container {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
  color: #fffa;
  padding: 0 4px;

  .section-icon {
    font-size: 16px;
  }

  .session-label {
    font-size: 12px;
    font-weight: bold;
  }
}
</style>
