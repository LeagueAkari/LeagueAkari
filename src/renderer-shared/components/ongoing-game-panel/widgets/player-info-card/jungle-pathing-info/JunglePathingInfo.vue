<template>
  <div class="mb-1 flex w-full">
    <NPopover :keep-alive-on-hover="true" :delay="50">
      <template #trigger>
        <div class="flex w-full">
          <JunglePathingTrigger
            :stats="currentChampionStats"
            :champion-id="currentChampionId"
            :placeholder-text="currentChampionPlaceholderText"
          />
        </div>
      </template>

      <div class="flex max-w-140 flex-col gap-2">
        <NTabs
          v-model:value="activeTab"
          size="small"
          animated
          type="line"
          :theme-overrides="{ tabGapSmallLine: '12px' }"
        >
          <NTab v-for="tab of tabs" :key="tab.key" :name="tab.key">
            <span class="inline-flex items-center gap-1.5">
              <ChampionIcon
                v-if="tab.championId"
                :champion-id="tab.championId"
                class="size-4 rounded"
              />
              <span class="font-medium">{{ tab.label }}</span>
              <span
                class="rounded bg-black/6 px-1 text-[10px] leading-4 text-black/55 dark:bg-white/8 dark:text-white/60"
                >{{ tab.stats.gamesAnalyzed }}</span
              >
            </span>
          </NTab>
        </NTabs>

        <JunglePathingDetails v-if="activeTabConfig" :stats="activeTabConfig.stats" />

        <div class="border-t border-black/5 pt-1.5 text-xs leading-relaxed dark:border-white/8">
          <div class="flex items-start justify-between gap-3 text-black/35 dark:text-white/35">
            <div class="min-w-0 flex-1">
              <div
                v-for="line of algorithmSummaryLines"
                :key="line"
                class="grid grid-cols-[0.5rem_minmax(0,1fr)] gap-x-1.5"
              >
                <span class="flex h-[1.5em] items-center">
                  <span class="h-1 w-1 rounded-full bg-current opacity-55" />
                </span>
                <span>{{ line }}</span>
              </div>
            </div>
            <NPopover
              :delay="50"
              :keep-alive-on-hover="true"
              :show-arrow="false"
              placement="bottom-end"
            >
              <template #trigger>
                <span
                  class="inline-flex w-fit shrink-0 cursor-help items-center gap-1 text-[10px] leading-4 text-black/40 transition-colors hover:text-black/55 dark:text-white/40 dark:hover:text-white/55"
                >
                  <span class="rounded border border-current/25 px-1 leading-3" aria-hidden="true"
                    >?</span
                  >
                  {{ t('JunglePathing.algorithmDetails') }}
                </span>
              </template>

              <div
                class="text-xs leading-relaxed text-black/55 dark:text-white/55"
                :style="{ width: '472px', maxWidth: 'calc(100vw - 32px)' }"
              >
                <div
                  v-for="line of algorithmDetailLines"
                  :key="line.translation"
                  class="grid grid-cols-[0.5rem_minmax(0,1fr)] gap-x-1.5"
                >
                  <span class="flex h-[1.5em] items-center">
                    <span class="h-1 w-1 rounded-sm bg-current opacity-45" />
                  </span>
                  <AlgorithmLineText :line="line" />
                </div>
              </div>
            </NPopover>
          </div>
        </div>
      </div>
    </NPopover>
  </div>
</template>

<script setup lang="tsx">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { TranslationComponent, useTranslation } from 'i18next-vue'
import { NPopover, NTab, NTabs } from 'naive-ui'
import { computed, defineComponent, ref, type PropType, watch } from 'vue'

import JunglePathingDetails from './JunglePathingDetails.vue'
import JunglePathingTrigger from './JunglePathingTrigger.vue'
import type { AlgorithmDescriptionLine, JunglePathingInfoProps, JunglePathingTab } from './types'

const { aggregatedAnalysis, currentChampionId = null } = defineProps<JunglePathingInfoProps>()

const { t } = useTranslation()
const lcs = useLeagueClientStore()

const AlgorithmLineText = defineComponent({
  props: {
    line: { type: Object as PropType<AlgorithmDescriptionLine>, required: true }
  },
  setup: (props) => {
    return () => {
      const slots = Object.fromEntries(
        Object.entries(props.line.keywords).map(([name, value]) => [
          name,
          () => <span class="font-semibold text-black/75 dark:text-white/75">{value}</span>
        ])
      )

      return (
        <span class="min-w-0 wrap-break-word whitespace-normal">
          <TranslationComponent translation={props.line.translation} v-slots={slots} />
        </span>
      )
    }
  }
})

const algorithmLine = (
  translation: string,
  keywords: Record<string, string>
): AlgorithmDescriptionLine => ({ translation, keywords })

const algorithmSummaryLines = computed(() => [
  t('JunglePathing.algorithmSummaryZoneWeight'),
  t('JunglePathing.algorithmSummaryPathing'),
  t('JunglePathing.loadedSamples', {
    details: t('JunglePathing.loadedDetailedSamples', { count: aggregatedAnalysis.detailsCount }),
    jungle: t('JunglePathing.loadedJungleSamples', {
      count: aggregatedAnalysis.jungle?.gamesAnalyzed ?? 0
    })
  })
])

const algorithmDetailLines = computed(() => [
  algorithmLine(t('JunglePathing.algorithmDetailZoneWeight'), {
    zoneWeight: t('JunglePathing.zoneWeight'),
    positionWeight: t('JunglePathing.positionWeight'),
    takedownWeight: t('JunglePathing.takedownWeight'),
    first14Minutes: t('JunglePathing.first14Minutes'),
    pointOne: '+1',
    pointFive: '+5'
  }),
  algorithmLine(t('JunglePathing.algorithmDetailPreference'), {
    preferenceDecision: t('JunglePathing.preferenceDecision'),
    midBot: t('JunglePathing.midBotPref'),
    topMid: t('JunglePathing.topMidPref'),
    singleZone: t('JunglePathing.singleZone'),
    balanced: t('JunglePathing.balanced')
  }),
  algorithmLine(t('JunglePathing.algorithmDetailFirstClear'), {
    firstClearDecision: t('JunglePathing.firstClearDecision'),
    oneMinutePosition: t('JunglePathing.oneMinutePosition'),
    invadeStart: t('JunglePathing.firstClearInvadeLegend')
  }),
  algorithmLine(t('JunglePathing.algorithmDetailLevel3Gank'), {
    level3Decision: t('JunglePathing.level3Decision'),
    threeMinuteFrame: t('JunglePathing.threeMinuteFrame'),
    csRange: '12-19',
    level3: '3',
    championDamage: t('JunglePathing.championDamage'),
    takedownParticipation: t('JunglePathing.takedownParticipation')
  }),
  algorithmLine(t('JunglePathing.algorithmDetailLevel4Gank'), {
    level4Decision: t('JunglePathing.level4Decision'),
    fourMinuteFrame: t('JunglePathing.fourMinuteFrame'),
    championDamageIncrease: t('JunglePathing.championDamageIncrease'),
    takedownParticipation: t('JunglePathing.takedownParticipation')
  }),
  algorithmLine(t('JunglePathing.algorithmDetailAggregation'), {
    aggregation: t('JunglePathing.aggregation'),
    sampleScope: t('JunglePathing.sampleScope'),
    blueRedSide: t('JunglePathing.blueRedSide')
  })
])

const championTabs = computed<JunglePathingTab[]>(() => {
  return Object.values(aggregatedAnalysis.champions)
    .filter((champion) => !!champion.jungle)
    .sort((a, b) => {
      if (a.championId === currentChampionId) return -1
      if (b.championId === currentChampionId) return 1

      return (b.jungle?.gamesAnalyzed ?? 0) - (a.jungle?.gamesAnalyzed ?? 0)
    })
    .map((champion) => ({
      key: `champion:${champion.championId}`,
      label: lcs.gameData.championName(champion.championId) || String(champion.championId),
      stats: champion.jungle!,
      championId: champion.championId
    }))
})

const tabs = computed<JunglePathingTab[]>(() => {
  const overall = aggregatedAnalysis.jungle
  const champions = championTabs.value

  return [
    ...champions,
    ...(overall && champions.length > 1
      ? [
          {
            key: 'overall',
            label: t('JunglePathing.overall'),
            stats: overall,
            championId: null
          }
        ]
      : [])
  ]
})

const activeTab = ref('')

watch(
  tabs,
  (value) => {
    if (!value.some((tab) => tab.key === activeTab.value)) {
      activeTab.value = value[0]?.key ?? ''
    }
  },
  { immediate: true }
)

const currentChampionStats = computed(() => {
  if (currentChampionId == null) {
    return null
  }

  return aggregatedAnalysis.champions[currentChampionId]?.jungle ?? null
})

const currentChampionPlaceholderText = computed(() => {
  if (currentChampionId == null) {
    return t('JunglePathing.noCurrentChampion')
  }

  return t('JunglePathing.noCurrentChampionData')
})

const activeTabConfig = computed(() => {
  return tabs.value.find((tab) => tab.key === activeTab.value) ?? null
})
</script>
