<template>
  <div class="relative h-full">
    <!-- spinning... -->
    <NSpin v-if="isLoading" class="absolute inset-0 z-10 dark:bg-black/50">
      <template #description>
        <div class="flex flex-col items-center gap-2">
          <NButton size="tiny" secondary @click="cancel">
            {{ t('Opgg.cancel') }}
          </NButton>
        </div>
      </template>
    </NSpin>

    <NScrollbar v-if="champion">
      <!-- summary -->
      <div class="flex h-20 items-center gap-3 px-2 pt-1 pb-3" v-if="summary">
        <ChampionIcon
          round
          class="size-14 ring-2 dark:ring-amber-400/80"
          :champion-id="summary.id"
        />

        <!-- T 级 / 名字 / 位置 -->
        <div class="mr-auto">
          <div class="text-lg font-bold">
            {{ lcs.gameData.championName(summary.id) }}
          </div>
          <div class="flex items-center gap-2">
            <div
              v-if="summary.average_stats"
              class="text-sm font-bold"
              :class="getTierTextColorClass(summary.average_stats.tier)"
            >
              {{ tierText }}
            </div>
            <div
              class="text-[13px] text-black/80 dark:text-white/80"
              v-if="position && position !== 'none'"
            >
              {{ t(`Opgg.positions.${position}`) || position }}
            </div>
          </div>
        </div>

        <!-- stats -->
        <div
          class="flex w-[172px] flex-wrap justify-end gap-2 self-end"
          v-if="summary.average_stats"
        >
          <!-- cherry 平均排名 -->
          <div
            class="w-[50px]"
            v-if="summary.average_stats.total_place && summary.average_stats.play"
          >
            <div class="text-[11px] text-black/70 dark:text-white/70">
              {{ t('OpggChampion.avgPlace') }}
            </div>
            <div class="text-[13px] font-bold">
              {{
                (summary.average_stats.total_place / (summary.average_stats.play || 1)).toFixed(2)
              }}
            </div>
          </div>

          <!-- cherry 吃鸡率 -->
          <div
            class="w-[50px]"
            v-if="summary.average_stats.first_place && summary.average_stats.play"
          >
            <div class="text-[11px] text-black/70 dark:text-white/70">
              {{ t('OpggChampion.1st') }}
            </div>
            <div class="text-[13px] font-bold">
              {{
                (
                  (summary.average_stats.first_place / (summary.average_stats.play || 1)) *
                  100
                ).toFixed(2)
              }}%
            </div>
          </div>

          <!-- 胜率 1 -->
          <div class="w-[50px]" v-if="summary.average_stats.win_rate">
            <div class="text-[11px] text-black/70 dark:text-white/70">
              {{ t('OpggChampion.winRate') }}
            </div>
            <div class="text-[13px] font-bold">
              {{ (summary.average_stats.win_rate * 100).toFixed(2) }}%
            </div>
          </div>

          <!-- 备选胜率 2  -->
          <div class="w-[50px]" v-if="summary.average_stats.play && summary.average_stats.win">
            <div class="text-[11px] text-black/70 dark:text-white/70">
              {{ t('OpggChampion.winRate') }}
            </div>
            <div class="text-[13px] font-bold">
              {{
                ((summary.average_stats.win / (summary.average_stats.play || 1)) * 100).toFixed(2)
              }}%
            </div>
          </div>

          <!-- 选取率 -->
          <div class="w-[50px]" v-if="summary.average_stats.pick_rate">
            <div class="text-[11px] text-black/70 dark:text-white/70">
              {{ t('OpggChampion.pickRate') }}
            </div>
            <div class="text-[13px] font-bold">
              {{ (summary.average_stats.pick_rate * 100).toFixed(2) }}%
            </div>
          </div>

          <!-- 禁用率 -->
          <div class="w-[50px]" v-if="summary.average_stats.ban_rate">
            <div class="text-[11px] text-black/70 dark:text-white/70">
              {{ t('OpggChampion.banRate') }}
            </div>
            <div class="text-[13px] font-bold">
              {{ (summary.average_stats.ban_rate * 100).toFixed(2) }}%
            </div>
          </div>
        </div>
      </div>

      <!-- 堆叠的艺术 -->
      <OpggChampionCounters />
      <OpggChampionSpells />
      <OpggChampionRunes />
      <OpggChampionSynergies />
      <OpggChampionAugments />
      <OpggChampionSkills />
      <OpggChampionImportItemSet />
      <OpggChampionStarterItems />
      <OpggChampionBoots />
      <OpggChampionPrismItems />
      <OpggChampionCoreItems />
      <OpggChampionLastItems />
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NButton, NScrollbar, NSpin } from 'naive-ui'
import { computed } from 'vue'

import { useOpgg } from './context'
import { getTierTextColorClass } from './utils/theme'
import OpggChampionAugments from './widgets/OpggChampionAugments.vue'
import OpggChampionBoots from './widgets/OpggChampionBoots.vue'
import OpggChampionCoreItems from './widgets/OpggChampionCoreItems.vue'
import OpggChampionCounters from './widgets/OpggChampionCounters.vue'
import OpggChampionImportItemSet from './widgets/OpggChampionImportItemSet.vue'
import OpggChampionLastItems from './widgets/OpggChampionLastItems.vue'
import OpggChampionPrismItems from './widgets/OpggChampionPrismItems.vue'
import OpggChampionRunes from './widgets/OpggChampionRunes.vue'
import OpggChampionSkills from './widgets/OpggChampionSkills.vue'
import OpggChampionSpells from './widgets/OpggChampionSpells.vue'
import OpggChampionStarterItems from './widgets/OpggChampionStarterItems.vue'
import OpggChampionSynergies from './widgets/OpggChampionSynergies.vue'

const { champion, position, cancel, isLoading } = useOpgg()

const { t } = useTranslation()

const lcs = useLeagueClientStore()

const summary = computed(() => {
  if (!champion.value) {
    return null
  }

  return champion.value.data.summary
})

const tierText = computed(() => {
  if (!champion.value) {
    return '-'
  }

  const averageStats = champion.value.data.summary.average_stats

  if (!averageStats) {
    return '-'
  }

  if (averageStats.tier === undefined) {
    return '-'
  }

  if (averageStats.tier === 0) {
    return 'OP'
  }

  return t('OpggChampion.tierText', {
    tier: averageStats.tier
  })
})
</script>
