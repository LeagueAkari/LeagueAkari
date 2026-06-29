<template>
  <div class="relative h-full">
    <!-- spinning... -->
    <NSpin v-if="isLoading" class="absolute inset-0 z-10 dark:bg-black/50">
      <template #description>
        <div class="flex flex-col items-center gap-2">
          <NButton size="tiny" secondary @click="cancel">
            {{ t('opgg.champion.cancel') }}
          </NButton>
        </div>
      </template>
    </NSpin>

    <NScrollbar v-if="champion">
      <div class="grid grid-cols-1 gap-2 lg:grid-cols-2">
        <!-- summary -->
        <div class="flex h-20 items-center gap-3 px-2 pt-1 pb-3" v-if="summary && stats">
          <ChampionIcon
            round
            class="size-14 ring-2"
            :champion-id="summary.id"
            :class="getTierRingColorClass(stats.tier_data.tier)"
          />

          <!-- T 级 / 名字 / 位置 -->
          <div class="mr-auto">
            <div class="text-lg font-bold">
              {{ lcs.gameData.championName(summary.id) }}
            </div>
            <div class="flex items-center gap-2">
              <div
                v-if="stats"
                class="text-sm font-bold"
                :class="getTierTextColorClass(stats.tier_data.tier)"
              >
                {{ tierText }}
              </div>
              <div
                class="text-[13px] text-black/80 dark:text-white/80"
                v-if="position && position !== 'none'"
              >
                {{ t(`opgg.filters.positions.${position}`) || position }}
              </div>
            </div>
          </div>

          <!-- stats -->
          <div class="flex w-43 flex-wrap justify-end gap-2 self-end" v-if="stats">
            <!-- cherry 平均排名 -->
            <div class="w-12.5" v-if="stats.total_place && stats.play">
              <div class="text-[11px] text-black/70 dark:text-white/70">
                {{ t('opgg.champion.avgPlace') }}
              </div>
              <div class="text-[13px] font-bold">
                {{ (stats.total_place / (stats.play || 1)).toFixed(2) }}
              </div>
            </div>

            <!-- cherry 吃鸡率 -->
            <div class="w-12.5" v-if="stats.first_place && stats.play">
              <div class="text-[11px] text-black/70 dark:text-white/70">
                {{ t('opgg.champion.1st') }}
              </div>
              <div class="text-[13px] font-bold">
                {{ ((stats.first_place / (stats.play || 1)) * 100).toFixed(2) }}%
              </div>
            </div>

            <!-- 胜率 1 -->
            <div class="w-12.5" v-if="stats.win_rate">
              <div class="text-[11px] text-black/70 dark:text-white/70">
                {{ t('opgg.champion.winRate') }}
              </div>
              <div class="text-[13px] font-bold">{{ (stats.win_rate * 100).toFixed(2) }}%</div>
            </div>

            <!-- 选取率 -->
            <div class="w-12.5" v-if="stats.pick_rate">
              <div class="text-[11px] text-black/70 dark:text-white/70">
                {{ t('opgg.champion.pickRate') }}
              </div>
              <div class="text-[13px] font-bold">{{ (stats.pick_rate * 100).toFixed(2) }}%</div>
            </div>

            <!-- 禁用率 -->
            <div class="w-12.5" v-if="stats.ban_rate">
              <div class="text-[11px] text-black/70 dark:text-white/70">
                {{ t('opgg.champion.banRate') }}
              </div>
              <div class="text-[13px] font-bold">{{ (stats.ban_rate * 100).toFixed(2) }}%</div>
            </div>
          </div>
        </div>

        <!-- 堆叠的艺术 -->
        <OpggChampionBalance />
        <OpggChampionCounters />
        <OpggChampionKiwiAugments />
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

        <div v-if="isEmpty">
          <div
            class="rounded border border-black/10 p-2 py-14 text-center text-sm font-bold text-black/60 last:mb-0 dark:border-[#37373c] dark:text-white/60"
          >
            {{ t('opgg.champion.empty') }}
          </div>
        </div>
      </div>
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
import { getTierRingColorClass, getTierTextColorClass } from './utils/theme'
import OpggChampionAugments from './widgets/OpggChampionAugments.vue'
import OpggChampionBalance from './widgets/OpggChampionBalance.vue'
import OpggChampionBoots from './widgets/OpggChampionBoots.vue'
import OpggChampionCoreItems from './widgets/OpggChampionCoreItems.vue'
import OpggChampionCounters from './widgets/OpggChampionCounters.vue'
import OpggChampionImportItemSet from './widgets/OpggChampionImportItemSet.vue'
import OpggChampionKiwiAugments from './widgets/OpggChampionKiwiAugments.vue'
import OpggChampionLastItems from './widgets/OpggChampionLastItems.vue'
import OpggChampionPrismItems from './widgets/OpggChampionPrismItems.vue'
import OpggChampionRunes from './widgets/OpggChampionRunes.vue'
import OpggChampionSkills from './widgets/OpggChampionSkills.vue'
import OpggChampionSpells from './widgets/OpggChampionSpells.vue'
import OpggChampionStarterItems from './widgets/OpggChampionStarterItems.vue'
import OpggChampionSynergies from './widgets/OpggChampionSynergies.vue'

const { champion, position, kiwiAugments, cancel, isLoading } = useOpgg()

const { t } = useTranslation()

const lcs = useLeagueClientStore()

const summary = computed(() => {
  if (!champion.value) {
    return null
  }

  return champion.value.data.summary
})

const stats = computed(() => {
  if (!summary.value) {
    return null
  }

  const positionStats = summary.value.positions?.find(
    (p) => p.name.toLowerCase() === position.value?.toLowerCase()
  )?.stats

  if (!positionStats) {
    return summary.value.average_stats
  }

  return positionStats
})

const tierText = computed(() => {
  if (!champion.value) {
    return '-'
  }

  const tierData = stats.value?.tier_data

  if (!tierData) {
    return '-'
  }

  if (tierData.tier === undefined) {
    return '-'
  }

  if (tierData.tier === 0) {
    return 'OP'
  }

  return t('opgg.champion.tierText', {
    tier: tierData.tier
  })
})

const isEmpty = computed(() => {
  return (
    champion.value &&
    (!kiwiAugments.value || kiwiAugments.value.data.length === 0) &&
    (!champion.value.data.augment_group || champion.value.data.augment_group.length === 0) &&
    (!champion.value.data.synergies || champion.value.data.synergies.length === 0) &&
    (!champion.value.data.runes || champion.value.data.runes.length === 0) &&
    (!champion.value.data.skill_masteries || champion.value.data.skill_masteries.length === 0) &&
    (!champion.value.data.counters || champion.value.data.counters.length === 0) &&
    (!champion.value.data.skills || champion.value.data.skills.length === 0) &&
    (!champion.value.data.starter_items || champion.value.data.starter_items.length === 0) &&
    (!champion.value.data.last_items || champion.value.data.last_items.length === 0) &&
    (!champion.value.data.core_items || champion.value.data.core_items.length === 0) &&
    (!champion.value.data.prism_items || champion.value.data.prism_items.length === 0) &&
    (!champion.value.data.boots || champion.value.data.boots.length === 0)
  )
})
</script>
