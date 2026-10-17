<template>
  <div class="relative h-full">
    <NScrollbar v-if="championId" content-class="flex min-h-full flex-col">
      <ChampionPageFrame
        :champion-id="championId"
        :visible="!!champion && !isLoading && !isDataStale && !error"
        content-class="gap-4"
      >
        <template v-if="champion">
          <ChampionPagePlaceholder
            v-if="isEmpty"
            :champion-id="championId"
            :description="t('opgg.champion.empty')"
          />

          <ChampionPageHeader
            v-else
            :champion-id="championId"
            :tier="stats?.tier ?? null"
            :position="
              mode === 'ranked' || mode === 'flex'
                ? { value: position, label: t(`opgg.filters.positions.${position}`) }
                : null
            "
          >
            <template v-if="stats">
              <!-- cherry 平均排名 -->
              <StatisticPopover
                v-if="stats.kind === 'placement' && stats.averagePlace != null"
                metric="averagePlace"
                :value="stats.averagePlace.toFixed(2)"
                :play="stats.play"
              >
                <HeaderStatistic :label="t('opgg.champion.avgPlace')">
                  {{ stats.averagePlace.toFixed(2) }}
                </HeaderStatistic>
              </StatisticPopover>

              <!-- cherry 吃鸡率 -->
              <StatisticPopover
                v-if="stats.kind === 'placement' && stats.firstPlaceRate != null"
                metric="firstPlaceRate"
                :value="(stats.firstPlaceRate * 100).toFixed(2) + '%'"
                :play="stats.play"
              >
                <HeaderStatistic :label="t('opgg.champion.1st')">
                  {{ (stats.firstPlaceRate * 100).toFixed(2) }}%
                </HeaderStatistic>
              </StatisticPopover>

              <!-- 胜率 1 -->
              <StatisticPopover
                v-if="typeof stats.winRate === 'number'"
                metric="winRate"
                :value="(stats.winRate * 100).toFixed(2) + '%'"
                :play="stats.play"
                :record="stats"
              >
                <HeaderStatistic
                  :label="t('opgg.champion.winRate')"
                  :color="getWinRateColor(stats.winRate)"
                >
                  {{ (stats.winRate * 100).toFixed(2) }}%
                </HeaderStatistic>
              </StatisticPopover>

              <!-- 选取率 -->
              <StatisticPopover
                v-if="stats.pickRate != null"
                metric="championPickRate"
                :value="(stats.pickRate * 100).toFixed(2) + '%'"
                :play="stats.play"
              >
                <HeaderStatistic :label="t('opgg.champion.pickRate')">
                  {{ (stats.pickRate * 100).toFixed(2) }}%
                </HeaderStatistic>
              </StatisticPopover>

              <!-- 禁用率 -->
              <StatisticPopover
                v-if="stats.banRate != null"
                metric="banRate"
                :value="(stats.banRate * 100).toFixed(2) + '%'"
              >
                <HeaderStatistic :label="t('opgg.champion.banRate')">
                  {{ (stats.banRate * 100).toFixed(2) }}%
                </HeaderStatistic>
              </StatisticPopover>
            </template>
          </ChampionPageHeader>

          <div v-if="!isEmpty" class="relative grid grid-cols-1 gap-x-3 gap-y-4 lg:grid-cols-2">
            <!-- 堆叠的艺术 -->
            <ChampionBalance />
            <ChampionCounters />
            <ChampionKiwiAugments />
            <ChampionSpells />
            <ChampionRunes />
            <ChampionSynergies />
            <ChampionAugments />
            <ChampionSkills />
            <ChampionItems />
          </div>
        </template>
      </ChampionPageFrame>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import HeaderStatistic from '@champion-data-window/components/champion-page/HeaderStatistic.vue'
import ChampionPageFrame from '@champion-data-window/components/champion-page/ChampionPageFrame.vue'
import ChampionPageHeader from '@champion-data-window/components/champion-page/ChampionPageHeader.vue'
import ChampionPagePlaceholder from '@champion-data-window/components/champion-page/ChampionPagePlaceholder.vue'
import { useTranslation } from 'i18next-vue'
import { NScrollbar } from 'naive-ui'
import { computed } from 'vue'

import { useOpgg } from './context'
import { useWinRateTheme } from '@champion-data-window/components/champion-statistics/theme'
import ChampionAugments from './widgets/ChampionAugments.vue'
import ChampionBalance from './widgets/ChampionBalance.vue'
import ChampionCounters from './widgets/ChampionCounters.vue'
import ChampionKiwiAugments from './widgets/ChampionKiwiAugments.vue'
import ChampionRunes from './widgets/ChampionRunes.vue'
import ChampionSkills from './widgets/ChampionSkills.vue'
import ChampionSpells from './widgets/ChampionSpells.vue'
import ChampionItems from './widgets/champion-items/ChampionItems.vue'
import ChampionSynergies from './widgets/ChampionSynergies.vue'
import StatisticPopover from './widgets/StatisticPopover.vue'

const { championId, champion, position, mode, isLoading, isDataStale, error } = useOpgg()

const { t } = useTranslation()
const { getWinRateColor } = useWinRateTheme()

const stats = computed(() => champion.value?.summary ?? null)
const isEmpty = computed(() => champion.value && !champion.value.hasContent)
</script>
