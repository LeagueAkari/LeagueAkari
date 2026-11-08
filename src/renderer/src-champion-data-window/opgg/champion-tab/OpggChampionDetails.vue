<template>
  <div class="relative h-full">
    <NScrollbar v-if="championId" content-class="flex min-h-full flex-col">
      <ChampionTabFrame
        :champion-id="championId"
        :visible="!!champion && !isLoading && !isDataStale && !error"
        content-class="gap-4"
      >
        <template v-if="champion">
          <ChampionTabPlaceholder
            v-if="isEmpty"
            :champion-id="championId"
            :description="t('opgg.champion.empty')"
          />

          <ChampionTabHeader
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
                <ChampionTabHeaderStat :label="t('opgg.champion.avgPlace')">
                  {{ stats.averagePlace.toFixed(2) }}
                </ChampionTabHeaderStat>
              </StatisticPopover>

              <!-- cherry 吃鸡率 -->
              <StatisticPopover
                v-if="stats.kind === 'placement' && stats.firstPlaceRate != null"
                metric="firstPlaceRate"
                :value="(stats.firstPlaceRate * 100).toFixed(2) + '%'"
                :play="stats.play"
              >
                <ChampionTabHeaderStat :label="t('opgg.champion.1st')">
                  {{ (stats.firstPlaceRate * 100).toFixed(2) }}%
                </ChampionTabHeaderStat>
              </StatisticPopover>

              <!-- 胜率 1 -->
              <StatisticPopover
                v-if="typeof stats.winRate === 'number'"
                metric="winRate"
                :value="(stats.winRate * 100).toFixed(2) + '%'"
                :play="stats.play"
                :record="stats"
              >
                <ChampionTabHeaderStat
                  :label="t('opgg.champion.winRate')"
                  :color="getWinRateColor(stats.winRate)"
                >
                  {{ (stats.winRate * 100).toFixed(2) }}%
                </ChampionTabHeaderStat>
              </StatisticPopover>

              <!-- 选取率 -->
              <StatisticPopover
                v-if="stats.pickRate != null"
                metric="championPickRate"
                :value="(stats.pickRate * 100).toFixed(2) + '%'"
                :play="stats.play"
              >
                <ChampionTabHeaderStat :label="t('opgg.champion.pickRate')">
                  {{ (stats.pickRate * 100).toFixed(2) }}%
                </ChampionTabHeaderStat>
              </StatisticPopover>

              <!-- 禁用率 -->
              <StatisticPopover
                v-if="stats.banRate != null"
                metric="banRate"
                :value="(stats.banRate * 100).toFixed(2) + '%'"
              >
                <ChampionTabHeaderStat :label="t('opgg.champion.banRate')">
                  {{ (stats.banRate * 100).toFixed(2) }}%
                </ChampionTabHeaderStat>
              </StatisticPopover>
            </template>
          </ChampionTabHeader>

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
      </ChampionTabFrame>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import ChampionTabHeaderStat from '@champion-data-window/components/champion-tab/ChampionTabHeaderStat.vue'
import ChampionTabFrame from '@champion-data-window/components/champion-tab/ChampionTabFrame.vue'
import ChampionTabHeader from '@champion-data-window/components/champion-tab/ChampionTabHeader.vue'
import ChampionTabPlaceholder from '@champion-data-window/components/champion-tab/ChampionTabPlaceholder.vue'
import { useTranslation } from 'i18next-vue'
import { NScrollbar } from 'naive-ui'
import { computed } from 'vue'

import { useOpgg } from '../context'
import { useWinRateTheme } from '@champion-data-window/components/champion-statistics/theme'
import ChampionAugments from '../widgets/ChampionAugments.vue'
import ChampionBalance from '../widgets/ChampionBalance.vue'
import ChampionCounters from '../widgets/ChampionCounters.vue'
import ChampionKiwiAugments from '../widgets/ChampionKiwiAugments.vue'
import ChampionRunes from '../widgets/ChampionRunes.vue'
import ChampionSkills from '../widgets/ChampionSkills.vue'
import ChampionSpells from '../widgets/ChampionSpells.vue'
import ChampionItems from '../widgets/champion-items/ChampionItems.vue'
import ChampionSynergies from '../widgets/ChampionSynergies.vue'
import StatisticPopover from '../widgets/StatisticPopover.vue'

const { championId, champion, position, mode, isLoading, isDataStale, error } = useOpgg()

const { t } = useTranslation()
const { getWinRateColor } = useWinRateTheme()

const stats = computed(() => champion.value?.summary ?? null)
const isEmpty = computed(() => champion.value && !champion.value.hasContent)
</script>
