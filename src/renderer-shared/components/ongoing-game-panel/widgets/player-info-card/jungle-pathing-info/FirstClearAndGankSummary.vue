<template>
  <JunglePathingSection>
    <template #map>
      <div class="relative" :style="{ width: `${MAP_SIZE}px`, height: `${MAP_SIZE}px` }">
        <img class="absolute h-full w-full rounded" :src="map11" />
        <svg class="absolute h-full w-full rounded" viewBox="0 0 100 100">
          <polygon points="0,0 100,100 0,100" fill="rgba(60,140,255,0.08)" />
          <polygon points="0,0 100,100 100,0" fill="rgba(255,60,60,0.08)" />
          <line
            x1="0"
            y1="0"
            x2="100"
            y2="100"
            stroke="rgba(255,255,255,0.4)"
            stroke-width="0.8"
            stroke-dasharray="4,3"
          />
        </svg>

        <NPopover
          v-for="(pt, i) of firstClearCampMapPoints"
          :key="`camp-${i}`"
          :delay="50"
          :keep-alive-on-hover="false"
          :show-arrow="false"
        >
          <template #trigger>
            <div
              class="absolute z-1 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40"
              :style="{
                left: `${pt.left}px`,
                top: `${pt.top}px`,
                width: `${pt.size}px`,
                height: `${pt.size}px`,
                backgroundColor: campMarkerColors[pt.camp],
                borderColor: pt.hasInvade ? 'rgba(251,191,36,0.85)' : 'rgba(255,255,255,0.4)'
              }"
            />
          </template>

          <div class="min-w-36 text-[11px] text-black/75 dark:text-white/75">
            <div class="mb-1 flex items-center gap-1.5">
              <span
                class="size-2.5 rounded-full border"
                :style="{
                  backgroundColor: campMarkerColors[pt.camp],
                  borderColor: pt.hasInvade ? 'rgba(251,191,36,0.85)' : 'rgba(255,255,255,0.4)'
                }"
              />
              <span class="font-bold text-black/90 dark:text-white/90">{{ pt.campLabel }}</span>
            </div>

            <div class="my-2 border-b border-black/10 dark:border-white/10"></div>

            <div class="flex flex-col gap-2">
              <div v-for="entry of pt.entries" :key="`${entry.side}-${entry.kind}`">
                <div class="mb-0.5 flex items-center gap-1.5">
                  <span
                    :class="['size-2 rounded-full border border-white/20', entry.indicatorClass]"
                  />
                  <span class="font-semibold text-black/80 dark:text-white/80">{{
                    entry.sideLabel
                  }}</span>
                  <span class="text-black/45 dark:text-white/45">{{ entry.kindLabel }}</span>
                </div>
                <div class="flex flex-col gap-0.5 pl-3.5">
                  <HighlightedTranslation
                    v-for="line of entry.lines"
                    :key="line.translation"
                    :translation="line.translation"
                    :values="line.values"
                  />
                </div>
              </div>
            </div>
          </div>
        </NPopover>

        <div
          v-for="(pt, i) of earlyGankMapPoints"
          :key="`eg-${i}`"
          class="pointer-events-none absolute z-5 h-4 w-4 -translate-x-1/2 -translate-y-1/2"
          :style="{ left: `${pt.left}px`, top: `${pt.top}px` }"
        >
          <span
            class="absolute top-1/2 left-1/2 h-0.5 w-3 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-sm"
            :class="
              pt.level === 3
                ? 'bg-orange-600 dark:bg-orange-400'
                : 'bg-purple-600 dark:bg-purple-400'
            "
          />
          <span
            class="absolute top-1/2 left-1/2 h-0.5 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-sm"
            :class="
              pt.level === 3
                ? 'bg-orange-600 dark:bg-orange-400'
                : 'bg-purple-600 dark:bg-purple-400'
            "
          />
        </div>
      </div>

      <div class="flex flex-col gap-1 pl-0.5 text-[10px] text-black/55 dark:text-white/55">
        <span class="inline-flex items-center gap-1 whitespace-nowrap">
          <span
            class="inline-block h-2.5 w-2.5 rounded-full border border-black/30 bg-black/35 dark:border-white/40 dark:bg-white/40"
          />
          {{ t('JunglePathing.firstClearOwnLegend') }}
        </span>
        <span
          class="inline-flex items-center gap-1 whitespace-nowrap text-amber-600 dark:text-amber-400"
        >
          <span
            class="inline-block h-2.5 w-2.5 rounded-full border border-amber-600/80 bg-amber-500/15 dark:border-amber-400/90 dark:bg-white/20"
          />
          {{ t('JunglePathing.firstClearInvadeLegend') }}
        </span>
        <span
          class="inline-flex items-center gap-1 whitespace-nowrap text-orange-600 dark:text-orange-400"
        >
          <span class="relative h-2.5 w-2.5">
            <span
              class="absolute top-1/2 left-1/2 h-0.5 w-3 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-sm bg-orange-600 dark:bg-orange-400"
            />
            <span
              class="absolute top-1/2 left-1/2 h-0.5 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-sm bg-orange-600 dark:bg-orange-400"
            />
          </span>
          {{ t('JunglePathing.level3KillLegend') }}
        </span>
        <span
          class="inline-flex items-center gap-1 whitespace-nowrap text-purple-600 dark:text-purple-400"
        >
          <span class="relative h-2.5 w-2.5">
            <span
              class="absolute top-1/2 left-1/2 h-0.5 w-3 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-sm bg-purple-600 dark:bg-purple-400"
            />
            <span
              class="absolute top-1/2 left-1/2 h-0.5 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-sm bg-purple-600 dark:bg-purple-400"
            />
          </span>
          {{ t('JunglePathing.level4KillLegend') }}
        </span>
      </div>
    </template>

    <template #content>
      <div>
        <div class="mb-1 font-bold text-black/90 dark:text-white/90">
          {{ t('JunglePathing.firstClear') }}
        </div>
        <div class="flex flex-col gap-1 text-black/75 dark:text-white/75">
          <div
            v-for="row of firstClearRows"
            :key="`first-clear-${row.side}`"
            class="grid grid-cols-[58px_minmax(0,1fr)] items-start gap-x-2"
          >
            <span
              class="row-span-2 inline-flex items-center gap-1 self-start font-bold text-black/75 dark:text-white/75"
            >
              <span :class="['size-2 rounded-full border border-white/20', row.indicatorClass]" />
              <span>{{ row.label }}</span>
            </span>
            <div class="grid min-w-0 grid-cols-[8px_minmax(0,1fr)] items-start gap-x-1.5">
              <span class="mt-1.25 size-1.5 rotate-45 bg-black/40 dark:bg-white/45" />
              <HighlightedTranslation
                class="min-w-0 leading-4 wrap-break-word whitespace-normal"
                :text-class="row.own.textClass"
                :translation="row.own.translation"
                :values="row.own.values"
              />
            </div>
            <div class="grid min-w-0 grid-cols-[8px_minmax(0,1fr)] items-start gap-x-1.5">
              <span class="mt-1.25 size-1.5 rotate-45 bg-amber-600/85 dark:bg-amber-400/90" />
              <HighlightedTranslation
                class="min-w-0 leading-4 wrap-break-word whitespace-normal"
                :text-class="row.invade.textClass"
                :translation="row.invade.translation"
                :values="row.invade.values"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <div class="mb-1 font-bold text-black/90 dark:text-white/90">
          {{ t('JunglePathing.earlyGank') }}
        </div>
        <div class="flex flex-col gap-1 text-black/75 dark:text-white/75">
          <div
            v-for="row of earlyGankRows"
            :key="`early-gank-${row.side}`"
            class="grid grid-cols-[58px_minmax(0,1fr)] items-start gap-x-2"
          >
            <span
              class="row-span-2 inline-flex items-center gap-1 self-start font-bold text-black/75 dark:text-white/75"
            >
              <span :class="['size-2 rounded-full border border-white/20', row.indicatorClass]" />
              <span>{{ row.label }}</span>
            </span>
            <HighlightedTranslation
              class="min-w-0 truncate"
              :text-class="row.level3.textClass"
              :translation="row.level3.translation"
              :values="row.level3.values"
            />
            <HighlightedTranslation
              class="min-w-0 truncate"
              :text-class="row.level4.textClass"
              :translation="row.level4.translation"
              :values="row.level4.values"
            />
          </div>
        </div>
      </div>
    </template>
  </JunglePathingSection>
</template>

<script setup lang="tsx">
import map11 from '@renderer-shared/components/match-card/map-images/11.png'
import { mapToImagePosition } from '@renderer-shared/components/match-card/utils/game-map'
import type { JungleCamp } from '@shared/data-adapter/analysis/player'
import { BLUE_SIDE_CAMPS, RED_SIDE_CAMPS } from '@shared/data-adapter/analysis/player/constants'
import { TranslationComponent, useTranslation } from 'i18next-vue'
import { NPopover } from 'naive-ui'
import { computed, defineComponent, type PropType } from 'vue'

import { getTeamIndicatorColorClass } from '../../../utils/theme'
import JunglePathingSection from './JunglePathingSection.vue'
import type {
  EarlyGankCell,
  EarlyGankLevel,
  EarlyGankRow,
  FirstClearAndGankSummaryProps,
  FirstClearCampMapPointEntry,
  FirstClearCampMapPoint,
  FirstClearCampPointKind,
  FirstClearRow,
  HighlightedTranslationData,
  HighlightedTranslationSlotValues,
  TeamSide
} from './types'

const MAP_SIZE = 140
const CAMP_MARKER_SIZE = 10
const PLACEHOLDER_TEXT_CLASS = 'text-black/45 dark:text-white/45'
const VALUE_TEXT_CLASS = 'font-semibold text-black/90 dark:text-white/90'

const { stats } = defineProps<FirstClearAndGankSummaryProps>()

const { t } = useTranslation()

const HighlightedTranslation = defineComponent({
  props: {
    translation: { type: String, required: true },
    values: {
      type: Object as PropType<HighlightedTranslationSlotValues>,
      default: () => ({})
    },
    textClass: { type: String, default: '' }
  },
  setup: (props, { attrs }) => {
    return () => {
      const slots = Object.fromEntries(
        Object.entries(props.values).map(([name, value]) => [
          name,
          () => <span class={VALUE_TEXT_CLASS}>{value}</span>
        ])
      )

      return (
        <span {...attrs} class={[attrs.class, props.textClass]}>
          <TranslationComponent translation={props.translation} v-slots={slots} />
        </span>
      )
    }
  }
})

const TEAM_SIDES: readonly TeamSide[] = ['blue', 'red']
const CAMP_KEYS: readonly JungleCamp[] = ['red', 'blue', 'wolves', 'raptors']

const sideIndicatorColorClass = (side: TeamSide) =>
  getTeamIndicatorColorClass(side === 'blue' ? 'TEAM-100' : 'TEAM-200') ?? ''

const sideLabel = (side: TeamSide) =>
  side === 'blue' ? t('JunglePathing.blueTeam') : t('JunglePathing.redTeam')

const campNames: Record<JungleCamp, () => string> = {
  red: () => t('JunglePathing.campRed'),
  blue: () => t('JunglePathing.campBlue'),
  wolves: () => t('JunglePathing.campWolves'),
  raptors: () => t('JunglePathing.campRaptors')
}

const campMarkerColors: Record<JungleCamp, string> = {
  red: 'rgba(255,60,60,0.5)',
  blue: 'rgba(60,140,255,0.5)',
  wolves: 'rgba(180,180,180,0.5)',
  raptors: 'rgba(200,120,255,0.5)'
}

const sumCampCount = (camps: Record<JungleCamp, number>) =>
  CAMP_KEYS.reduce((total, camp) => total + camps[camp], 0)

const firstClearGames = (side: TeamSide) =>
  side === 'blue' ? stats.firstClearCamp.blueGames : stats.firstClearCamp.redGames

const firstClearInvadeCamps = (side: TeamSide) =>
  side === 'blue' ? stats.firstClearCamp.blueInvade : stats.firstClearCamp.redInvade

const highlightedText = (
  translation: string,
  values: HighlightedTranslationSlotValues = {},
  textClass = ''
): HighlightedTranslationData => ({ translation, values, textClass })

const replaceComponentSlot = (translation: string, slot: string, slotName: string) =>
  translation.replace(`{${slot}}`, `{${slotName}}`)

const campStartEntries = (camps: Record<JungleCamp, number>, total: number, slotPrefix: string) => {
  const values: HighlightedTranslationSlotValues = {}
  const translations = CAMP_KEYS.filter((camp) => camps[camp] > 0)
    .sort((a, b) => camps[b] - camps[a])
    .map((camp) => {
      const slotName = `${slotPrefix}-${camp}`
      values[slotName] = `${Math.round((camps[camp] / total) * 100)}%`

      return replaceComponentSlot(
        t('JunglePathing.campStart', { camp: campNames[camp]() }),
        'pct',
        slotName
      )
    })

  return { translations, values }
}

const createOwnStartCell = (
  camps: Record<JungleCamp, number>,
  games: number,
  starts: number
): HighlightedTranslationData => {
  if (games <= 0 || starts <= 0) {
    return highlightedText(t('JunglePathing.noOwnStartData'), {}, PLACEHOLDER_TEXT_CLASS)
  }

  const pctSlot = 'own-pct'
  const entries = campStartEntries(camps, starts, 'own-camp')

  return highlightedText(
    `${replaceComponentSlot(t('JunglePathing.campOwnStart'), 'pct', pctSlot)} (${entries.translations.join(', ')})`,
    {
      [pctSlot]: `${Math.round((starts / games) * 100)}%`,
      ...entries.values
    }
  )
}

const createInvadeStartCell = (
  camps: Record<JungleCamp, number>,
  games: number,
  starts: number
): HighlightedTranslationData => {
  if (games <= 0 || starts <= 0) {
    return highlightedText(t('JunglePathing.noInvadeData'), {}, PLACEHOLDER_TEXT_CLASS)
  }

  const pctSlot = 'invade-pct'
  const entries = campStartEntries(camps, starts, 'invade-camp')

  return highlightedText(
    `${replaceComponentSlot(t('JunglePathing.campInvadeStart'), 'pct', pctSlot)} (${entries.translations.join(', ')})`,
    {
      [pctSlot]: `${Math.round((starts / games) * 100)}%`,
      ...entries.values
    }
  )
}

const createFirstClearRow = (side: TeamSide): FirstClearRow => {
  const games = firstClearGames(side)
  const ownCamps = stats.firstClearCamp[side]
  const invadeCamps = firstClearInvadeCamps(side)
  const ownStarts = sumCampCount(ownCamps)
  const invadeStarts = sumCampCount(invadeCamps)

  return {
    side,
    label: sideLabel(side),
    indicatorClass: sideIndicatorColorClass(side),
    own: createOwnStartCell(ownCamps, games, ownStarts),
    invade: createInvadeStartCell(invadeCamps, games, invadeStarts)
  }
}

const earlyGankGamesByTeam = (side: TeamSide) => {
  const byTeam = stats.earlyGank.byTeam

  return side === 'blue' ? byTeam.blueGames : byTeam.redGames
}

const earlyGankCountByTeam = (side: TeamSide, level: EarlyGankLevel) => {
  const byTeam = stats.earlyGank.byTeam

  if (side === 'blue') {
    return level === 3 ? byTeam.blueLevel3GankCount : byTeam.blueLevel4GankCount
  }

  return level === 3 ? byTeam.redLevel3GankCount : byTeam.redLevel4GankCount
}

const createEarlyGankCell = (side: TeamSide, level: EarlyGankLevel): EarlyGankCell => {
  const count = earlyGankCountByTeam(side, level)
  const total = earlyGankGamesByTeam(side)

  if (count <= 0) {
    return highlightedText(
      level === 3 ? t('JunglePathing.noLevel3GankData') : t('JunglePathing.noLevel4GankData'),
      {},
      PLACEHOLDER_TEXT_CLASS
    )
  }

  const key = level === 3 ? 'JunglePathing.level3Gank' : 'JunglePathing.level4Gank'

  return highlightedText(t(key), {
    count: count.toString(),
    total: total.toString()
  })
}

const createEarlyGankRow = (side: TeamSide): EarlyGankRow => ({
  side,
  label: sideLabel(side),
  indicatorClass: sideIndicatorColorClass(side),
  level3: createEarlyGankCell(side, 3),
  level4: createEarlyGankCell(side, 4)
})

const campPopoverLines = (
  side: TeamSide,
  kindLabel: string,
  count: number,
  kindTotal: number,
  sideTotal: number
) => [
  highlightedText(t('JunglePathing.campPopoverCampGames', { count }), {
    count: count.toString()
  }),
  highlightedText(t('JunglePathing.campPopoverKindGames', { count: kindTotal, kind: kindLabel }), {
    count: kindTotal.toString()
  }),
  highlightedText(
    t('JunglePathing.campPopoverSideGames', { count: sideTotal, side: sideLabel(side) }),
    {
      count: sideTotal.toString()
    }
  )
]

const createCampMapEntry = (
  side: TeamSide,
  kind: FirstClearCampPointKind,
  kindLabel: string,
  count: number,
  kindTotal: number,
  sideTotal: number
): FirstClearCampMapPointEntry => ({
  side,
  sideLabel: sideLabel(side),
  indicatorClass: sideIndicatorColorClass(side),
  kind,
  kindLabel,
  count,
  kindTotal,
  sideTotal,
  lines: campPopoverLines(side, kindLabel, count, kindTotal, sideTotal)
})

const firstClearRows = computed<FirstClearRow[]>(() => TEAM_SIDES.map(createFirstClearRow))

const earlyGankRows = computed<EarlyGankRow[]>(() => TEAM_SIDES.map(createEarlyGankRow))

const firstClearCampMapPoints = computed<FirstClearCampMapPoint[]>(() => {
  const ownKindLabel = t('JunglePathing.firstClearOwnLegend')
  const invadeKindLabel = t('JunglePathing.firstClearInvadeLegend')
  const blueOwnStarts = sumCampCount(stats.firstClearCamp.blue)
  const redOwnStarts = sumCampCount(stats.firstClearCamp.red)
  const blueInvadeStarts = sumCampCount(stats.firstClearCamp.blueInvade)
  const redInvadeStarts = sumCampCount(stats.firstClearCamp.redInvade)
  const blueGames = firstClearGames('blue')
  const redGames = firstClearGames('red')
  const points: FirstClearCampMapPoint[] = []

  for (const camp of BLUE_SIDE_CAMPS) {
    const entries: FirstClearCampMapPointEntry[] = []
    const blueOwnCount = stats.firstClearCamp.blue[camp.camp]
    const redInvadeCount = stats.firstClearCamp.redInvade[camp.camp]

    if (blueOwnCount > 0) {
      entries.push(
        createCampMapEntry('blue', 'own', ownKindLabel, blueOwnCount, blueOwnStarts, blueGames)
      )
    }

    if (redInvadeCount > 0) {
      entries.push(
        createCampMapEntry(
          'red',
          'invade',
          invadeKindLabel,
          redInvadeCount,
          redInvadeStarts,
          redGames
        )
      )
    }

    if (entries.length > 0) {
      points.push({
        ...mapToImagePosition(camp.x, camp.y, MAP_SIZE, MAP_SIZE, 11),
        camp: camp.camp,
        campLabel: campNames[camp.camp](),
        size: CAMP_MARKER_SIZE,
        hasInvade: entries.some((entry) => entry.kind === 'invade'),
        entries
      })
    }
  }

  for (const camp of RED_SIDE_CAMPS) {
    const entries: FirstClearCampMapPointEntry[] = []
    const redOwnCount = stats.firstClearCamp.red[camp.camp]
    const blueInvadeCount = stats.firstClearCamp.blueInvade[camp.camp]

    if (redOwnCount > 0) {
      entries.push(
        createCampMapEntry('red', 'own', ownKindLabel, redOwnCount, redOwnStarts, redGames)
      )
    }

    if (blueInvadeCount > 0) {
      entries.push(
        createCampMapEntry(
          'blue',
          'invade',
          invadeKindLabel,
          blueInvadeCount,
          blueInvadeStarts,
          blueGames
        )
      )
    }

    if (entries.length > 0) {
      points.push({
        ...mapToImagePosition(camp.x, camp.y, MAP_SIZE, MAP_SIZE, 11),
        camp: camp.camp,
        campLabel: campNames[camp.camp](),
        size: CAMP_MARKER_SIZE,
        hasInvade: entries.some((entry) => entry.kind === 'invade'),
        entries
      })
    }
  }

  return points
})

const earlyGankMapPoints = computed(() => {
  return [
    ...stats.earlyGank.level3KillPositions.map((pt) => ({
      ...mapToImagePosition(pt.x, pt.y, MAP_SIZE, MAP_SIZE, 11),
      lane: pt.lane,
      level: 3 as const
    })),
    ...stats.earlyGank.level4KillPositions.map((pt) => ({
      ...mapToImagePosition(pt.x, pt.y, MAP_SIZE, MAP_SIZE, 11),
      lane: pt.lane,
      level: 4 as const
    }))
  ]
})
</script>
