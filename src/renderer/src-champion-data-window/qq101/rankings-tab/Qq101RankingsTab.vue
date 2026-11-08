<template>
  <div class="qq101-view relative flex min-h-0 flex-1 flex-col px-2 pt-1 pb-2">
    <Qq101RankingsFilters
      class="mb-1"
      :preferences="preferences"
      :patches="patches"
      v-model:board="board"
      v-model:role="role"
      v-model:rarity="rarity"
      @change="emit('change', $event)"
    />
    <div v-if="preferences.mode === 'aram_mayhem' && board === 'synergies'" class="mb-2">
      <NButton
        size="small"
        secondary
        @click="emit('pairs', { championId: null, firstRole: 'all', secondRole: 'all' })"
        >{{ t('qq101.openPairQuery') }}</NButton
      >
    </div>
    <div
      v-if="preferences.mode === 'classic' && classicLanes.status === 'error'"
      class="mb-2 text-xs"
    >
      {{ t('qq101.classicLanesFailed') }}
    </div>
    <div class="relative flex min-h-0 flex-1 flex-col" :aria-busy="loading">
      <RankingTable
        v-if="displayOverview && !error && !sectionError"
        :key="`${preferences.mode}:${activeBoard}`"
        :rows="rows"
        :mode="preferences.mode"
        :board="activeBoard"
        :loading="loading && !!displayOverview"
        :classic-lanes="classicLanes.status === 'ready' ? classicLanes.data.champions : []"
        @champion="(id, position) => emit('champion', id, position)"
      />
      <div
        v-if="!displayOverview || error || sectionError"
        class="absolute inset-0 z-10 flex items-center justify-center p-4"
      >
        <div class="flex max-w-full flex-col items-center gap-3 text-center" role="status">
          <template v-if="loading">
            <NSpin size="large" />
            <div class="text-sm text-black/65 dark:text-white/65">{{ t('qq101.loading') }}</div>
          </template>
          <template v-else>
            <div class="text-sm text-black/65 dark:text-white/65">
              {{ errorMessage || t('qq101.empty') }}
            </div>
            <NButton size="small" secondary @click="emit('refresh')">{{
              t('qq101.retry')
            }}</NButton>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Qq101RankingsFilters from './Qq101RankingsFilters.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import type { Qq101ChampionDataOverview } from '@champion-data-window/shards/champion-data/qq101/types'
import type { Qq101Section } from '@champion-data-window/shards/champion-data/qq101/types'
import type { Qq101AkariData } from '@shared/data-adapter/qq101/akari-adapter'
import type { Qq101PairQuery, Qq101Role } from '@shared/http-api-axios-helper/qq101'
import type { Qq101ChampionDataPreferences } from '@shared/types/champion-data'
import { useTranslation } from 'i18next-vue'
import { NButton, NSpin } from 'naive-ui'
import { computed, ref } from 'vue'
import RankingTable from '../RankingTable.vue'
import { projectRankings, type RankingBoard } from '../rankings'

const {
  preferences,
  loadedPreferences,
  overview,
  patches,
  loading,
  error,
  classicLanes = { status: 'idle' }
} = defineProps<{
  classicLanes?: Qq101Section<Qq101AkariData<'lanes'>>
  preferences: Qq101ChampionDataPreferences
  loadedPreferences: Qq101ChampionDataPreferences | null
  overview: Qq101ChampionDataOverview | null
  patches: string[]
  loading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  change: [update: Partial<Qq101ChampionDataPreferences>]
  refresh: []
  champion: [id: number, position?: string]
  pairs: [query: Qq101PairQuery]
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

const rows = computed(() =>
  projectRankings(displayOverview.value, activeBoard.value, role.value, resources).filter(
    (row) =>
      row.kind !== 'augment' || rarity.value === 'all' || (row.rarity ?? 'unknown') === rarity.value
  )
)

const sectionError = computed(() =>
  displayOverview.value?.mode === 'aram_mayhem'
    ? displayOverview.value.data.errors[activeBoard.value]
    : null
)

const errorMessage = computed(() => (error || sectionError.value)?.split('\n')[0])
</script>
