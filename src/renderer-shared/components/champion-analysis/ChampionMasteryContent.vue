<template>
  <div class="grid grid-cols-2 gap-1.5 text-xs">
    <MasteryMetric
      :label="t('playerTabs.championMastery.levelLabel')"
      :value="t('playerTabs.championMastery.level', { level: mastery.championLevel })"
    />
    <MasteryMetric
      :label="t('playerTabs.championMastery.pointsLabel')"
      :value="formatExtremeNumber(mastery.championPoints)"
    />
    <MasteryMetric
      v-if="mastery.highestGrade"
      :label="t('playerTabs.championMastery.highestGradeLabel')"
      :value="mastery.highestGrade"
    />
    <MasteryMetric
      v-if="mastery.championSeasonMilestone"
      :label="t('playerTabs.championMastery.seasonMilestoneLabel')"
      :value="mastery.championSeasonMilestone.toString()"
    />
    <MasteryMetric
      v-if="mastery.tokensEarned"
      :label="t('playerTabs.championMastery.tokensEarnedLabel')"
      :value="mastery.tokensEarned.toString()"
    />
    <MasteryMetric
      v-if="mastery.lastPlayTime"
      :label="t('playerTabs.championMastery.lastPlayTimeLabel')"
      :value="formatMasteryTime(mastery.lastPlayTime)"
    />
    <MasteryMetric
      v-if="hasLevelProgress"
      class="col-span-2"
      :label="t('playerTabs.championMastery.progressLabel')"
      :value="
        t('playerTabs.championMastery.progress', {
          since: formatExtremeNumber(mastery.championPointsSinceLastLevel!),
          until: formatExtremeNumber(mastery.championPointsUntilNextLevel!)
        })
      "
    />
  </div>
</template>

<script setup lang="tsx">
import { useNumberFormatter } from '@renderer-shared/composables/useNumberFormatter'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { computed, defineComponent } from 'vue'

import type { ChampionAnalysisMastery } from './types'

const { mastery } = defineProps<{
  mastery: ChampionAnalysisMastery
}>()

const { t } = useTranslation()
const { formatExtremeNumber } = useNumberFormatter()

const formatMasteryTime = (value: number) => dayjs(value).format('YYYY-MM-DD')
const hasLevelProgress = computed(
  () =>
    mastery.championPointsSinceLastLevel !== undefined &&
    mastery.championPointsUntilNextLevel !== undefined
)

const MasteryMetric = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true }
  },
  setup(props, { attrs }) {
    return () => (
      <div {...attrs} class={[attrs.class, 'rounded bg-black/4 px-3 py-2 dark:bg-white/6']}>
        <div class="text-[10px] text-black/45 dark:text-white/45">{props.label}</div>
        <div class="mt-0.5 font-semibold text-black/85 tabular-nums dark:text-white/85">
          {props.value}
        </div>
      </div>
    )
  }
})
</script>
