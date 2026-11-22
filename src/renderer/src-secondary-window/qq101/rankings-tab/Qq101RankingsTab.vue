<template>
  <div class="qq101-view relative flex min-h-0 flex-1 flex-col px-2 pt-1 pb-2">
    <Qq101RankingsFilters
      class="mb-1"
      :preferences="preferences"
      :patches="patches"
      v-model:board="board"
      v-model:role="role"
      v-model:rarity="rarity"
      :pair-query="pairQuery"
      :champion-ids="championIds"
      @query-pairs="emit('queryPairs', $event)"
      @change="emit('change', $event)"
    />
    <div
      v-if="preferences.mode === 'classic' && classicLanes.status === 'error'"
      class="mb-2 text-xs"
    >
      {{ t('qq101.classicLanesFailed') }}
    </div>
    <div class="relative flex min-h-0 flex-1 flex-col" :aria-busy="boardLoading">
      <RankingTable
        v-if="hasResult && !boardError"
        :key="`${preferences.mode}:${activeBoard}`"
        :rows="rows"
        :mode="preferences.mode"
        :board="activeBoard"
        :loading="boardLoading"
        :classic-lanes="classicLanes.status === 'ready' ? classicLanes.data.champions : []"
        @champion="(id, position) => emit('champion', id, position)"
      />
      <div v-else class="absolute inset-0 z-10 flex items-center justify-center p-4">
        <div class="flex max-w-full flex-col items-center gap-3 text-center" role="status">
          <template v-if="boardLoading">
            <NSpin size="large" />
            <div class="text-sm text-black/65 dark:text-white/65">{{ t('qq101.loading') }}</div>
          </template>
          <template v-else>
            <div class="text-sm text-black/65 dark:text-white/65">
              {{ boardError?.split('\n')[0] || t('qq101.empty') }}
            </div>
            <NButton size="small" secondary @click="retryBoard">{{ t('qq101.retry') }}</NButton>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Qq101RankingsFilters from './Qq101RankingsFilters.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import type { Qq101ChampionDataOverview } from '@secondary-window/shards/champion-data/qq101/types'
import type { Qq101Section } from '@secondary-window/shards/champion-data/qq101/types'
import type { Qq101AkariData } from '@shared/data-adapter/qq101/protocol'
import type { Qq101PairQuery, Qq101Role } from '@shared/http-api-axios-helper/qq101'
import type { Qq101ChampionDataPreferences } from '@shared/types/champion-data'
import { useTranslation } from 'i18next-vue'
import { NButton, NSpin } from 'naive-ui'
import { computed, ref } from 'vue'
import RankingTable from '../RankingTable.vue'
import { projectPairRankings, projectRankings, type RankingBoard } from '../rankings'

const {
  preferences,
  loadedPreferences,
  overview,
  patches,
  loading,
  error,
  pairs,
  pairQuery,
  classicLanes = { status: 'idle' }
} = defineProps<{
  classicLanes?: Qq101Section<Qq101AkariData<'lanes'>>
  preferences: Qq101ChampionDataPreferences
  loadedPreferences: Qq101ChampionDataPreferences | null
  overview: Qq101ChampionDataOverview | null
  patches: string[]
  loading: boolean
  error: string | null
  pairs: Qq101Section<Qq101AkariData<'pairs'>>
  pairQuery: Qq101PairQuery
}>()

const emit = defineEmits<{
  change: [update: Partial<Qq101ChampionDataPreferences>]
  refresh: []
  champion: [id: number, position?: string]
  queryPairs: [query: Qq101PairQuery]
}>()

const { t } = useTranslation()
const resources = useAkariResourceProvider()
const board = ref<RankingBoard>('champions')
const role = ref<Qq101Role>('all')
const rarity = ref('all')
const activeBoard = computed(() => (preferences.mode === 'aram_mayhem' ? board.value : 'champions'))

const displayOverview = computed(() => {
  if (
    !loadedPreferences ||
    loadedPreferences.mode !== preferences.mode ||
    loadedPreferences.position !== preferences.position ||
    loadedPreferences.tier !== preferences.tier ||
    loadedPreferences.patch !== preferences.patch
  ) {
    return null
  }

  return overview
})

const championIds = computed(
  () => displayOverview.value?.data.champions.map((hero) => hero.championId) ?? []
)

const rows = computed(() => {
  if (activeBoard.value === 'synergies') {
    return pairs.status === 'ready' ? projectPairRankings(pairs.data.synergies) : []
  }

  return projectRankings(displayOverview.value, activeBoard.value, role.value, resources).filter(
    (row) =>
      row.kind !== 'augment' || rarity.value === 'all' || (row.rarity ?? 'unknown') === rarity.value
  )
})

const hasResult = computed(() =>
  activeBoard.value === 'synergies'
    ? pairs.status === 'ready' || pairs.status === 'loading'
    : !!displayOverview.value
)
const boardLoading = computed(() =>
  activeBoard.value === 'synergies' ? pairs.status === 'loading' : loading
)
const boardError = computed(() => {
  if (activeBoard.value === 'synergies') {
    return pairs.status === 'error' ? pairs.message : null
  }

  return (
    error ||
    (displayOverview.value?.mode === 'aram_mayhem'
      ? displayOverview.value.data.errors[activeBoard.value]
      : null)
  )
})

const retryBoard = () => {
  if (activeBoard.value === 'synergies') {
    emit('queryPairs', pairQuery)
  } else {
    emit('refresh')
  }
}
</script>
