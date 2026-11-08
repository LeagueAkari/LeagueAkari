<template>
  <div class="flex min-h-0 flex-1 flex-col gap-1 px-2 pt-1 pb-2">
    <div class="flex flex-wrap items-center gap-1">
      <Qq101ModeSelect
        :disabled="readOnly"
        class="min-w-32 flex-1"
        :value="view.mode"
        :modes="['ranked', 'aram_mayhem'] as const"
        :loading="modeChange.status === 'loading'"
        @update:value="emit('mode', $event)"
      />
      <template v-if="view.mode === 'ranked'">
        <Qq101PatchSelect
          :disabled="readOnly"
          class="min-w-24 flex-1"
          :value="view.patch"
          :patches="patches"
          @update:value="emit('preferences', { patch: $event })"
        />
        <Qq101TierSelect
          :disabled="readOnly"
          class="min-w-28 flex-1"
          :value="view.tier"
          @update:value="emit('preferences', { tier: $event })"
        />
        <Qq101PositionSelect
          class="min-w-28 flex-1"
          :value="view.position"
          :positions="positions"
          :disabled="readOnly || positions.length === 0"
          :loading="view.sections.positions.status === 'loading'"
          :placeholder="t('qq101.position')"
          @update:value="emit('position', $event)"
        />
      </template>
    </div>
    <ChampionTabFrame :champion-id="view.championId" content-class="gap-3">
      <ChampionTabHeader
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
          <ChampionTabHeaderStat
            :label="t('qq101.details.winRate')"
            :color="getWinRateColor(summary.winRate)"
            >{{ percent(summary.winRate) }}</ChampionTabHeaderStat
          >
          <ChampionTabHeaderStat :label="t('qq101.columns.pickRate')">{{
            percent(summary.pickRate)
          }}</ChampionTabHeaderStat>
          <ChampionTabHeaderStat v-if="'banRate' in summary" :label="t('qq101.columns.banRate')">{{
            percent(summary.banRate)
          }}</ChampionTabHeaderStat>
        </template>
      </ChampionTabHeader>
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
        <ChampionTabPlaceholder
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
              v-if="positionGate === 'empty' && previousPatch && !readOnly"
              size="tiny"
              secondary
              @click="emit('preferences', { patch: previousPatch })"
              >{{ t('qq101.details.tryPatch', { patch: previousPatch }) }}</NButton
            >
            <NButton size="tiny" quaternary @click="emit('retry', 'positions')">{{
              t('qq101.retry')
            }}</NButton>
          </template>
        </ChampionTabPlaceholder>
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
                <Qq101RaritySelect v-model:value="rarity" class="min-w-28" />
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
                    <template #actions>
                      <NButton
                        size="tiny"
                        type="primary"
                        secondary
                        :disabled="applying || !page.primaryStyleId || !page.secondaryStyleId"
                        :loading="applying"
                        @click="emit('applyRunes', index)"
                        >{{ t('opgg.champion.apply') }}</NButton
                      >
                    </template>

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
                  <Qq101JungleTeamSelect v-model:value="team" />
                  <Qq101StartingCampSelect
                    v-model:value="camp"
                    :camps="groups.map((group) => group.startingCamp)"
                    :camp-label="campName"
                  />
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
    </ChampionTabFrame>
  </div>
</template>
<script setup lang="ts">
import Qq101ModeSelect from '../filters/Qq101ModeSelect.vue'
import Qq101TierSelect from '../filters/Qq101TierSelect.vue'
import Qq101PatchSelect from '../filters/Qq101PatchSelect.vue'
import Qq101PositionSelect from '../filters/Qq101PositionSelect.vue'
import Qq101RaritySelect from '../filters/Qq101RaritySelect.vue'
import Qq101JungleTeamSelect from '../filters/Qq101JungleTeamSelect.vue'
import Qq101StartingCampSelect from '../filters/Qq101StartingCampSelect.vue'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import RunePageDisplay from '@champion-data-window/components/champion-statistics/RunePageDisplay.vue'
import { useWinRateTheme } from '@champion-data-window/components/champion-statistics/theme'
import ExpandButton from '@champion-data-window/components/champion-statistics/ExpandButton.vue'
import ChampionTabFrame from '@champion-data-window/components/champion-tab/ChampionTabFrame.vue'
import ChampionTabHeader from '@champion-data-window/components/champion-tab/ChampionTabHeader.vue'
import ChampionTabPlaceholder from '@champion-data-window/components/champion-tab/ChampionTabPlaceholder.vue'
import ChampionTabHeaderStat from '@champion-data-window/components/champion-tab/ChampionTabHeaderStat.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import type {
  Qq101DetailView,
  Qq101DetailSectionKey,
  Qq101Page
} from '@champion-data-window/shards/champion-data/qq101/types'
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
import { detailPanels, type DetailTable } from './presentation'

const {
  view,
  patches,
  modeChange,
  readOnly = false,
  applying = false
} = defineProps<{
  readOnly?: boolean
  applying?: boolean
  view: Qq101DetailView
  patches: string[]
  modeChange: Extract<Qq101Page, { kind: 'champion' }>['modeChange']
}>()

const emit = defineEmits<{
  applyRunes: [index: number]
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
  if (view.mode !== 'ranked' || view.position) {
    return null
  }

  const status = view.sections.positions.status
  if (status === 'idle' || status === 'loading') {
    return 'loading'
  }

  return status === 'error' ? 'error' : 'empty'
})

const previousPatch = computed(() => {
  if (view.mode !== 'ranked') {
    return null
  }

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

const panels = computed(() => detailPanels(view, rarity.value))

const positions = computed(() =>
  view.mode === 'ranked' && view.sections.positions.status === 'ready'
    ? view.sections.positions.data.positions.map((p) => p.position)
    : []
)

const augmentSearch = ref('')
const rarity = ref('all')

const filteredRows = (table: DetailTable) => {
  if (table.title !== 'augments') {
    return table.rows
  }

  return table.rows.filter((row) => {
    const cell = row[0]
    if (cell.kind !== 'entities') {
      return false
    }

    const id = cell.ids[0]

    return `${id} ${resources.augments.name(id)}`
      .toLocaleLowerCase()
      .includes(augmentSearch.value.trim().toLocaleLowerCase())
  })
}

const collapsedRowCount = (table: DetailTable) => (table.title === 'skillOrder' ? 2 : 5)

const team = ref(100)
const camp = ref('all')

const groups = computed(() =>
  view.mode === 'ranked' && view.sections.jungle.status === 'ready'
    ? view.sections.jungle.data.groups.filter((g) => g.teamId === team.value)
    : []
)

const knownCamp = (code: string) =>
  ['BLUEGOLEM', 'GROMP', 'WOLF', 'RAPTOR', 'REDLIZARD', 'KRUG'].includes(code)

const campName = (code: string) => (knownCamp(code) ? t(`qq101.camps.${code}`) : code)

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
