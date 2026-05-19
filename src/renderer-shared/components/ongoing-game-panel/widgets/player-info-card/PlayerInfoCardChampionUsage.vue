<template>
  <div v-if="championUsage.length" class="mb-1 flex w-full gap-1">
    <NPopover :keep-alive-on-hover="false" v-for="c of championUsage" :key="c.id" :delay="50">
      <template #trigger>
        <div
          class="relative h-5 w-5 cursor-pointer transition-[filter] hover:brightness-110"
          @click.stop="() => navigateToSummonerByPuuid(puuid)"
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
      <div class="max-w-65 min-w-56">
        <div class="mb-2 flex items-center gap-2 text-xs">
          <ChampionIcon ring :ring-width="1" round class="h-5.5 w-5.5" :champion-id="c.id" />
          <div class="text-xs font-bold text-black/80 dark:text-white/80">
            {{ lcs.gameData.champions[c.id]?.name || c.id }}
          </div>
        </div>

        <div class="space-y-1.5 text-xs">
          <div v-if="c.analysis">
            <div class="mb-0.5 text-[11px] font-bold text-black/80 dark:text-white/80">
              {{ t('PlayerInfoCard.champion.recentStats') }}
            </div>
            <div class="text-black/85 dark:text-white/85">
              {{
                t('PlayerInfoCard.champion.winRate', {
                  count: c.analysis.winLoss.all.count,
                  winRate: (c.analysis.winLoss.all.winRate * 100).toFixed()
                })
              }}
            </div>
          </div>

          <div v-if="c.analysis && c.mastery" class="h-px bg-black/10 dark:bg-white/10" />

          <div v-if="c.mastery">
            <div class="mb-1 text-[11px] font-bold text-black/80 dark:text-white/80">
              {{ t('PlayerTab.championMastery.title') }}
            </div>
            <div class="grid grid-cols-[max-content_minmax(0,1fr)] items-center gap-x-3 gap-y-1">
              <div class="text-black/60 dark:text-white/60">
                {{ t('PlayerTab.championMastery.levelLabel') }}
              </div>
              <div class="text-right text-black/85 dark:text-white/85">
                {{
                  t('PlayerTab.championMastery.level', {
                    level: c.mastery.championLevel
                  })
                }}
              </div>

              <div class="text-black/60 dark:text-white/60">
                {{ t('PlayerTab.championMastery.pointsLabel') }}
              </div>
              <div class="text-right text-black/85 tabular-nums dark:text-white/85">
                {{ formatExtremeNumber(c.mastery.championPoints) }}
              </div>

              <template v-if="c.mastery.highestGrade">
                <div class="text-black/60 dark:text-white/60">
                  {{ t('PlayerTab.championMastery.highestGradeLabel') }}
                </div>
                <div class="text-right text-black/85 dark:text-white/85">
                  {{ c.mastery.highestGrade }}
                </div>
              </template>

              <template v-if="c.mastery.championSeasonMilestone">
                <div class="text-black/60 dark:text-white/60">
                  {{ t('PlayerTab.championMastery.seasonMilestoneLabel') }}
                </div>
                <div class="text-right text-black/85 tabular-nums dark:text-white/85">
                  {{ c.mastery.championSeasonMilestone }}
                </div>
              </template>

              <template v-if="c.mastery.lastPlayTime">
                <div class="text-black/60 dark:text-white/60">
                  {{ t('PlayerTab.championMastery.lastPlayTimeLabel') }}
                </div>
                <div class="text-right text-black/85 tabular-nums dark:text-white/85">
                  {{ formatMasteryTime(c.mastery.lastPlayTime) }}
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </NPopover>
  </div>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useNumberFormatter } from '@renderer-shared/composables/useNumberFormatter'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { StarRound as StarRoundIcon } from '@vicons/material'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { NPopover } from 'naive-ui'
import { computed } from 'vue'

import { STARRED_CHAMPION_LEVEL } from '../../constants'
import { useOngoingGamePanel } from '../../context'

const { puuid } = defineProps<{
  puuid: string
}>()

const { t } = useTranslation()
const { formatExtremeNumber } = useNumberFormatter()

const lcs = useLeagueClientStore()
const ogs = useOngoingGameStore()
const { navigateToSummonerByPuuid } = useOngoingGamePanel()

const analysis = computed(() => ogs.analysis?.players[puuid])
const championMastery = computed(() => ogs.championMastery[puuid])

const FREQUENT_USED_CHAMPIONS_MAX_COUNT = 9

const formatMasteryTime = (value: number) => dayjs(value).format('YYYY-MM-DD')

const championUsage = computed(() => {
  if (ogs.settings.showChampionUsage === 'recent') {
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
  } else if (ogs.settings.showChampionUsage === 'mastery') {
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
