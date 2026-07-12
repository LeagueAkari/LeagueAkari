<template>
  <div v-if="championUsage.length" class="mb-1 flex w-full gap-1">
    <NPopover v-for="c of championUsage" :key="c.id" :delay="50">
      <template #trigger>
        <div
          class="relative h-5 w-5 transition-[filter]"
          :class="{ 'cursor-pointer hover:brightness-110': canCollectByChampion }"
          @click.stop="() => collectByChampion(c.id)"
        >
          <ChampionIcon
            :ring-color="
              c.analysis
                ? c.analysis.winLoss.all.winRate >= 0.5
                  ? '#2368ca'
                  : '#c94f4f'
                : undefined
            "
            :champion-id="c.id"
            ring
            :ring-width="1"
            class="h-full w-full rounded"
          />
          <StarRoundIcon
            v-if="c.mastery && c.mastery.championLevel >= STARRED_CHAMPION_LEVEL"
            class="absolute -right-0.5 -bottom-0.5 h-3 w-3 text-[#fff838]"
          />
        </div>
      </template>
      <div>
        <ChampionAnalysisContent
          v-if="c.analysis"
          :analysis="c.analysis"
          :mastery="c.mastery"
          :on-collect-matches="canCollectByChampion ? () => collectByChampion(c.id) : undefined"
        />

        <template v-else>
          <div class="mb-2 flex items-center gap-2 text-xs">
            <ChampionIcon ring :ring-width="1" round class="h-5.5 w-5.5" :champion-id="c.id" />
            <div class="text-xs font-bold text-black/80 dark:text-white/80">
              {{ resources.champions.name(c.id) }}
            </div>
          </div>
          <ChampionMasteryContent v-if="c.mastery" :mastery="c.mastery" />
        </template>
      </div>
    </NPopover>
  </div>
</template>

<script setup lang="ts">
import {
  ChampionAnalysisContent,
  ChampionMasteryContent
} from '@renderer-shared/components/champion-analysis'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useGameResourceProvider } from '@renderer-shared/providers/game-resource'
import { StarRound as StarRoundIcon } from '@vicons/material'
import { NPopover } from 'naive-ui'
import { computed } from 'vue'

import { STARRED_CHAMPION_LEVEL } from '../../constants'
import { useOngoingGamePanel } from '../../context'
import { createCollectByChampionInitParams } from './player-actions'

const { puuid } = defineProps<{
  puuid: string
}>()

const { ongoingGame, navigateToSummonerByPuuid, isStandaloneOngoingGameWindow } =
  useOngoingGamePanel()
const resources = useGameResourceProvider()

const analysis = computed(() => ongoingGame.value.analysis?.players[puuid])
const championMastery = computed(() => ongoingGame.value.championMastery[puuid])

const FREQUENT_USED_CHAMPIONS_MAX_COUNT = 9

const canCollectByChampion = computed(() => !isStandaloneOngoingGameWindow.value)

const collectByChampion = (championId: number) => {
  if (!canCollectByChampion.value) {
    return
  }

  navigateToSummonerByPuuid(
    puuid,
    createCollectByChampionInitParams(championId, ongoingGame.value.settings.matchHistoryLoadCount)
  )
}

const championUsage = computed(() => {
  if (ongoingGame.value.settings.showChampionUsage === 'recent') {
    if (!analysis.value) {
      return []
    }

    const truncated = Object.values(analysis.value.champions)
      .toSorted((a, b) => {
        return b.winLoss.all.count - a.winLoss.all.count
      })
      .slice(0, FREQUENT_USED_CHAMPIONS_MAX_COUNT)
      .map((c) => ({
        id: c.championId,
        analysis: c,
        mastery: championMastery.value && championMastery.value[c.championId]
      }))

    return truncated
  } else if (ongoingGame.value.settings.showChampionUsage === 'mastery') {
    if (!championMastery.value) {
      return []
    }

    const truncated = Object.values(championMastery.value)
      .toSorted((a, b) => {
        return b.championPoints - a.championPoints
      })
      .slice(0, FREQUENT_USED_CHAMPIONS_MAX_COUNT)
      .map((m) => ({
        id: m.championId,
        analysis: analysis.value?.champions[m.championId],
        mastery: m
      }))

    return truncated
  }

  return []
})
</script>
