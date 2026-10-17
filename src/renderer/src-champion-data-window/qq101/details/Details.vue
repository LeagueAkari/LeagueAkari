<template>
  <div class="flex min-h-0 flex-1 flex-col gap-1 px-2 pt-1 pb-2">
    <div class="flex flex-wrap items-center gap-1">
      <QuerySelect
        class="min-w-32 flex-1"
        :value="view.mode"
        :options="modes"
        :loading="modeChange.status === 'loading'"
        :aria-label="t('qq101.mode')"
        @update:value="emit('mode', $event)"
      />
      <template v-if="view.mode === 'ranked'">
        <QuerySelect
          class="min-w-24 flex-1"
          size="small"
          :value="view.patch"
          :options="patches.map((value) => ({ value, label: value }))"
          :aria-label="t('qq101.patch')"
          @update:value="emit('preferences', { patch: $event })"
        />
        <QuerySelect
          kind="tier"
          class="min-w-28 flex-1"
          size="small"
          :value="view.tier"
          :options="tiers"
          :aria-label="t('qq101.tier')"
          @update:value="emit('preferences', { tier: $event })"
        />
        <QuerySelect
          kind="position"
          class="min-w-28 flex-1"
          size="small"
          :value="view.position"
          :options="positions"
          :disabled="positions.length === 0"
          :loading="view.sections.positions.status === 'loading'"
          :placeholder="t('qq101.position')"
          @update:value="emit('position', $event)"
        />
      </template>
    </div>
    <ChampionPageFrame :champion-id="view.championId" content-class="gap-3">
      <ChampionPageHeader
        v-if="!positionGate"
        :champion-id="view.championId"
        :tier="
          summary && 'strengthTier' in summary && summary.strengthTier
            ? Number(summary.strengthTier.slice(1))
            : null
        "
        :position="
          view.mode === 'ranked' && view.position
            ? {
                value: view.position,
                label: t(
                  `qq101.positions.${view.position === 'SUPPORT' ? 'utility' : view.position.toLowerCase()}`
                )
              }
            : null
        "
      >
        <template v-if="summary">
          <HeaderStatistic
            :label="t('qq101.details.winRate')"
            :color="getWinRateColor(summary.winRate)"
            >{{ percent(summary.winRate) }}</HeaderStatistic
          >
          <HeaderStatistic :label="t('qq101.columns.pickRate')">{{
            percent(summary.pickRate)
          }}</HeaderStatistic>
          <HeaderStatistic v-if="'banRate' in summary" :label="t('qq101.columns.banRate')">{{
            percent(summary.banRate)
          }}</HeaderStatistic>
        </template>
      </ChampionPageHeader>
      <div v-if="view.mode === 'aram_mayhem' && view.summary.status === 'error'" class="text-xs">
        {{ t('qq101.details.sectionFailed') }}
        <NButton text size="tiny" @click="emit('retry', 'summary')">{{ t('qq101.retry') }}</NButton>
      </div>
      <NAlert v-if="modeChange.status === 'error'" type="warning"
        >{{ modeChange.message.split('\n')[0] }}
        <NButton size="tiny" @click="emit('mode', 'ranked')">{{
          t('qq101.retry')
        }}</NButton></NAlert
      >
      <NScrollbar
        v-if="positionGate"
        class="min-h-0 flex-1"
        content-class="flex min-h-full flex-col"
      >
        <ChampionPagePlaceholder
          :champion-id="view.championId"
          :loading="positionGate === 'loading'"
          :description="
            t(
              positionGate === 'loading'
                ? 'qq101.details.loadingHero'
                : positionGate === 'error'
                  ? 'qq101.details.positionsFailed'
                  : 'qq101.details.noPositions'
            )
          "
        >
          <template v-if="positionGate !== 'loading'" #actions>
            <NButton
              v-if="positionGate === 'empty' && previousPatch"
              size="tiny"
              secondary
              @click="emit('preferences', { patch: previousPatch })"
              >{{ t('qq101.details.tryPatch', { patch: previousPatch }) }}</NButton
            >
            <NButton size="tiny" quaternary @click="emit('retry', 'positions')">{{
              t('qq101.retry')
            }}</NButton>
          </template>
        </ChampionPagePlaceholder>
      </NScrollbar>
      <DetailNavigation v-if="!positionGate" :entries="navigation" @navigate="navigate" />
      <NScrollbar v-if="!positionGate" ref="scrollbar" class="min-h-0 flex-1">
        <div ref="sectionsRoot" class="flex flex-col gap-3">
          <div v-for="panel in panels" :key="panel.key" :data-section="panel.key">
            <SettingsSection
              v-if="panel.state.status !== 'ready'"
              :title="t(`qq101.details.${panel.key}`)"
            >
              <SectionPlaceholder
                :loading="panel.state.status === 'loading' || panel.state.status === 'idle'"
                :description="
                  t(
                    panel.state.status === 'error'
                      ? 'qq101.details.sectionFailed'
                      : panel.state.status === 'empty'
                        ? 'qq101.empty'
                        : 'qq101.details.loadingSection'
                  )
                "
              >
                <template
                  v-if="panel.state.status === 'error' || panel.state.status === 'empty'"
                  #actions
                >
                  <NButton size="tiny" quaternary @click="emit('retry', panel.key)">{{
                    t('qq101.retry')
                  }}</NButton>
                </template>
              </SectionPlaceholder>
            </SettingsSection>
            <template v-else>
              <div v-if="panel.key === 'recommendations'" class="mb-3 flex gap-2">
                <NInput v-model:value="augmentSearch" :placeholder="t('qq101.search')" clearable />
                <QuerySelect v-model:value="rarity" :options="rarities" class="min-w-28" />
              </div>
              <SettingsSection
                v-if="
                  panel.key === 'runes' &&
                  view.mode === 'ranked' &&
                  view.sections.runes.status === 'ready'
                "
                :title="t('qq101.details.runes')"
              >
                <template #headerSuffix
                  ><ExpandButton
                    v-if="view.sections.runes.data.pages.length > 2"
                    v-model:expanded="expandedRunes"
                /></template>
                <div class="p-3">
                  <RecommendationRow
                    v-for="(page, index) in view.sections.runes.data.pages.slice(
                      0,
                      expandedRunes ? Infinity : 2
                    )"
                    :key="index"
                    :rank="page.rank"
                    layout="runes"
                  >
                    <RunePageDisplay :page="page" />

                    <template #metrics>
                      <StatisticValue
                        >{{ percent(page.pickRate)
                        }}<template #caption>{{
                          t('qq101.sampleCount', {
                            count: page.games ?? 0,
                            formatted: formatCount(page.games)
                          })
                        }}</template></StatisticValue
                      >
                      <StatisticValue :color="getWinRateColor(page.winRate)">{{
                        percent(page.winRate)
                      }}</StatisticValue>
                    </template>
                  </RecommendationRow>
                </div>
              </SettingsSection>
              <SettingsSection v-if="panel.chart" :title="t(`qq101.details.${panel.key}`)">
                <WinRateChart :chart="panel.chart" />
              </SettingsSection>
              <SettingsSection
                v-for="(section, index) in panel.key === 'runes' ? [] : panel.tables"
                :key="index"
                :data-section="`${panel.key}:${section.title}`"
                class="mb-3"
                :title="t(`qq101.details.${section.title}`)"
              >
                <template #headerSuffix
                  ><ExpandButton
                    v-if="filteredRows(section).length > collapsedRowCount(section)"
                    :expanded="expandedSections.has(section.title)"
                    @update:expanded="toggleSection(section.title, $event)"
                /></template>
                <SectionPlaceholder
                  v-if="filteredRows(section).length === 0"
                  :description="t('qq101.empty')"
                />
                <RecommendationList
                  v-else
                  :section="section"
                  :rows="
                    filteredRows(section).slice(
                      0,
                      expandedSections.has(section.title) ? Infinity : collapsedRowCount(section)
                    )
                  "
                  @champion="emit('champion', $event)"
                />
              </SettingsSection>
              <template
                v-if="
                  panel.key === 'jungle' &&
                  view.mode === 'ranked' &&
                  view.sections.jungle.status === 'ready'
                "
              >
                <div class="mb-3 flex gap-2">
                  <QuerySelect v-model:value="team" :options="teamOptions" />
                  <QuerySelect v-model:value="camp" :options="campOptions" />
                </div>
                <SettingsSection :title="t('qq101.details.route')">
                  <div v-if="routes.length" class="p-3">
                    <RecommendationRow
                      v-for="(route, index) in routes"
                      :key="index"
                      :rank="index + 1"
                    >
                      <RecommendationSequence :items="route.camps" ordered>
                        <template #default="{ item: code }">
                          <LcuImage
                            v-if="knownCamp(code)"
                            :src="`https://game.gtimg.cn/images/lol/lolstrategy/heroInfo/${code}_circle.png`"
                            class="size-7"
                            :title="campName(code)"
                          />
                          <span v-else class="text-xs">{{ campName(code) }}</span>
                        </template>
                      </RecommendationSequence>

                      <template #metrics>
                        <StatisticValue
                          >{{ percent(route.pickRate)
                          }}<template #caption>{{
                            t('qq101.sampleCount', {
                              count: route.games ?? 0,
                              formatted: formatCount(route.games)
                            })
                          }}</template></StatisticValue
                        >
                        <StatisticValue :color="getWinRateColor(route.winRate)">{{
                          percent(route.winRate)
                        }}</StatisticValue>
                      </template>
                    </RecommendationRow>
                  </div>
                  <SectionPlaceholder v-else :description="t('qq101.empty')" />
                </SettingsSection>
              </template>
            </template>
          </div>
        </div>
      </NScrollbar>
    </ChampionPageFrame>
  </div>
</template>
<script setup lang="ts">
import QuerySelect from '@champion-data-window/components/query-filter/QuerySelect.vue'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import RunePageDisplay from '@champion-data-window/components/champion-statistics/RunePageDisplay.vue'
import { useWinRateTheme } from '@champion-data-window/components/champion-statistics/theme'
import ExpandButton from '@champion-data-window/components/champion-statistics/ExpandButton.vue'
import ChampionPageFrame from '@champion-data-window/components/champion-page/ChampionPageFrame.vue'
import ChampionPageHeader from '@champion-data-window/components/champion-page/ChampionPageHeader.vue'
import ChampionPagePlaceholder from '@champion-data-window/components/champion-page/ChampionPagePlaceholder.vue'
import HeaderStatistic from '@champion-data-window/components/champion-page/HeaderStatistic.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import type {
  Qq101DetailView,
  Qq101DetailSectionKey,
  Qq101Page
} from '@renderer-shared/shards/champion-data/qq101/types'
import type { Qq101ChampionDataPreferences } from '@shared/types/champion-data'
import { useTranslation } from 'i18next-vue'
import { NAlert, NButton, NInput, NScrollbar } from 'naive-ui'
import { computed, ref } from 'vue'
import RecommendationList from './RecommendationList.vue'
import WinRateChart from './WinRateChart.vue'
import DetailNavigation from './DetailNavigation.vue'
import SectionPlaceholder from './SectionPlaceholder.vue'
import type { ScrollbarInst } from 'naive-ui'
import StatisticValue from '@champion-data-window/components/champion-statistics/StatisticValue.vue'
import RecommendationRow from '@champion-data-window/components/champion-statistics/RecommendationRow.vue'
import RecommendationSequence from '@champion-data-window/components/champion-statistics/RecommendationSequence.vue'
import { formatCount } from '../format'
import { tierIcons } from '../filters'
import { detailPanels, type DetailTable } from './presentation'

const { view, patches, modeChange } = defineProps<{
  view: Qq101DetailView
  patches: string[]
  modeChange: Extract<Qq101Page, { kind: 'champion' }>['modeChange']
}>()

const emit = defineEmits<{
  mode: [mode: 'ranked' | 'aram_mayhem']
  champion: [id: number]
  position: [position: string]
  retry: [key: Qq101DetailSectionKey]
  preferences: [update: Partial<Qq101ChampionDataPreferences>]
}>()

const resources = useAkariResourceProvider()
const { t } = useTranslation()
const { getWinRateColor } = useWinRateTheme()

const summary = computed(() =>
  view.mode === 'ranked'
    ? view.sections.positions.status === 'ready'
      ? view.sections.positions.data.positions.find((p) => p.position === view.position)
      : null
    : view.summary.status === 'ready'
      ? view.summary.data.champions[0]
      : null
)

const positionGate = computed(() => {
  if (view.mode !== 'ranked' || view.position) return null

  const status = view.sections.positions.status
  if (status === 'idle' || status === 'loading') return 'loading'

  return status === 'error' ? 'error' : 'empty'
})

const previousPatch = computed(() => {
  if (view.mode !== 'ranked') return null

  const index = patches.indexOf(view.patch)

  return index >= 0 ? (patches[index + 1] ?? null) : null
})

const scrollbar = ref<ScrollbarInst | null>(null)
const sectionsRoot = ref<HTMLElement | null>(null)

const navigation = computed(() =>
  panels.value.flatMap((panel) =>
    panel.key === 'recommendations' && panel.tables.length
      ? panel.tables.map((table) => ({
          key: `${panel.key}:${table.title}`,
          label: t(`qq101.details.${table.title}`)
        }))
      : [{ key: panel.key, label: t(`qq101.details.${panel.key}`) }]
  )
)

const navigate = (key: string) => {
  const root = sectionsRoot.value
  const target = root?.querySelector<HTMLElement>(`[data-section="${key}"]`)

  if (root && target) {
    scrollbar.value?.scrollTo({
      top: target.getBoundingClientRect().top - root.getBoundingClientRect().top,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    })
  }
}

const expandedRunes = ref(false)
const expandedSections = ref(new Set<string>())

const toggleSection = (key: string, expanded: boolean) => {
  const next = new Set(expandedSections.value)
  expanded ? next.add(key) : next.delete(key)
  expandedSections.value = next
}

const modes = computed(() =>
  ['ranked', 'aram_mayhem'].map((value) => ({ value, label: t(`qq101.modes.${value}`) }))
)

const tiers = computed(() =>
  [255, 88, 10, 9, 28, 8, 27, 7, 26, 6, 25, 5, 24, 4, 3, 2, 1].map((value) => ({
    value,
    label: t(`qq101.tiers.${value}`),
    rank: tierIcons[value]
  }))
)

const panels = computed(() => detailPanels(view, rarity.value))

const positions = computed(() =>
  view.mode === 'ranked' && view.sections.positions.status === 'ready'
    ? view.sections.positions.data.positions.map((p) => ({
        value: p.position,
        label: t(
          `qq101.positions.${p.position === 'SUPPORT' ? 'utility' : p.position.toLowerCase()}`
        )
      }))
    : []
)

const augmentSearch = ref('')
const rarity = ref('all')

const rarities = computed(() =>
  ['all', 'kSilver', 'kGold', 'kPrismatic'].map((value) => ({
    value,
    label: t(value === 'all' ? 'qq101.all' : `qq101.rarities.${value}`)
  }))
)

const filteredRows = (table: DetailTable) => {
  if (table.title !== 'augments') return table.rows

  return table.rows.filter((row) => {
    const cell = row[0]
    if (cell.kind !== 'entities') return false

    const id = cell.ids[0]

    return `${id} ${resources.augments.name(id)}`
      .toLocaleLowerCase()
      .includes(augmentSearch.value.trim().toLocaleLowerCase())
  })
}

const collapsedRowCount = (table: DetailTable) => (table.title === 'skillOrder' ? 2 : 5)

const team = ref(100)
const camp = ref('all')

const teamOptions = computed(() =>
  [100, 200].map((value) => ({ value, label: t(`qq101.details.team${value}`) }))
)

const groups = computed(() =>
  view.mode === 'ranked' && view.sections.jungle.status === 'ready'
    ? view.sections.jungle.data.groups.filter((g) => g.teamId === team.value)
    : []
)

const knownCamp = (code: string) =>
  ['BLUEGOLEM', 'GROMP', 'WOLF', 'RAPTOR', 'REDLIZARD', 'KRUG'].includes(code)

const campName = (code: string) => (knownCamp(code) ? t(`qq101.camps.${code}`) : code)

const campOptions = computed(() => [
  { value: 'all', label: t('qq101.all') },
  ...[...new Set(groups.value.flatMap((g) => (g.startingCamp ? [g.startingCamp] : [])))].map(
    (value) => ({ value, label: campName(value) })
  )
])

const routes = computed(() => {
  const selected = groups.value.filter((g) =>
    camp.value === 'all' ? g.startingCamp === null : g.startingCamp === camp.value
  )

  return (selected.length ? selected : camp.value === 'all' ? groups.value : []).flatMap(
    (g) => g.routes
  )
})

const percent = (value: number | null) => (value === null ? '—' : `${(value * 100).toFixed(2)}%`)
</script>
