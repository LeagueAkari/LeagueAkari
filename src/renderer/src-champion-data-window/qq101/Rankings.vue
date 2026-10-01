<template>
  <div class="qq101-view relative flex min-h-0 flex-1 flex-col px-2 pt-1 pb-2">
    <div class="mb-1 flex shrink-0 flex-wrap gap-1">
      <NSelect
        :render-label="renderLabel"
        size="small"
        :value="preferences.mode"
        :options="modes"
        :style="filterStyle('mode')"
        :aria-label="t('qq101.mode')"
        :placeholder="t('qq101.mode')"
        :consistent-menu-width="false"
        @update:value="(mode) => emit('change', { mode, patch: null, position: 'all' })"
      />
      <NSelect
        :render-label="renderLabel"
        v-if="preferences.mode === 'aram_mayhem'"
        v-model:value="board"
        size="small"
        :options="boards"
        :style="filterStyle('board')"
        :aria-label="t('qq101.board')"
        :consistent-menu-width="false"
      />
      <NSelect
        v-if="preferences.mode === 'ranked'"
        size="small"
        :value="preferences.tier"
        :options="tiers"
        :render-label="renderTierLabel"
        :style="filterStyle('tier')"
        :aria-label="t('qq101.tier')"
        :consistent-menu-width="false"
        @update:value="(tier) => emit('change', { tier })"
      />
      <NSelect
        v-if="preferences.mode === 'ranked' || preferences.mode === 'classic'"
        size="small"
        :value="preferences.position"
        :options="positions"
        :render-label="renderPositionLabel"
        :style="filterStyle('position')"
        :aria-label="t('qq101.position')"
        :consistent-menu-width="false"
        @update:value="(position) => emit('change', { position })"
      />
      <NSelect
        :render-label="renderLabel"
        v-if="preferences.mode === 'ranked'"
        size="small"
        :value="preferences.patch ?? ''"
        :options="patchOptions"
        :style="filterStyle('patch')"
        :aria-label="t('qq101.patch')"
        :consistent-menu-width="false"
        @update:value="(patch) => emit('change', { patch: patch || null })"
      />
      <NSelect
        :render-label="renderLabel"
        v-if="
          preferences.mode === 'aram' ||
          (preferences.mode === 'aram_mayhem' && board === 'champions')
        "
        v-model:value="role"
        size="small"
        :options="roles"
        :style="filterStyle('role')"
        :aria-label="t('qq101.role')"
        :consistent-menu-width="false"
      />
      <NSelect
        :render-label="renderLabel"
        v-if="preferences.mode === 'aram_mayhem' && board === 'augments'"
        v-model:value="rarity"
        size="small"
        :options="rarities"
        :style="filterStyle('rarity')"
        :aria-label="t('qq101.rarity')"
        :consistent-menu-width="false"
      />
    </div>
    <div class="relative flex min-h-0 flex-1 flex-col" :aria-busy="loading">
      <RankingTable
        v-if="displayOverview && !error && !sectionError"
        :key="`${preferences.mode}:${activeBoard}`"
        :rows="rows"
        :mode="preferences.mode"
        :board="activeBoard"
        :loading="loading && !!displayOverview"
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

<script setup lang="tsx">
import FilterLabel from '@champion-data-window/components/query-filter/FilterLabel.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import type { Qq101ChampionDataOverview } from '@renderer-shared/shards/champion-data/qq101/types'
import type { Qq101ChampionDataPreferences } from '@shared/types/champion-data'
import { useTranslation } from 'i18next-vue'
import { NButton, NSelect, NSpin, type SelectRenderLabel } from 'naive-ui'
import { computed, ref } from 'vue'
import RankingTable from './RankingTable.vue'
import { projectRankings, type RankingBoard } from './rankings'

const { preferences, loadedPreferences, overview, patches, loading, error } = defineProps<{
  preferences: Qq101ChampionDataPreferences
  loadedPreferences: Qq101ChampionDataPreferences | null
  overview: Qq101ChampionDataOverview | null
  patches: string[]
  loading: boolean
  error: string | null
}>()
const emit = defineEmits<{ change: [update: Partial<Qq101ChampionDataPreferences>]; refresh: [] }>()
const { t } = useTranslation()
const resources = useAkariResourceProvider()
const board = ref<RankingBoard>('champions')
const role = ref('all')
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
const modes = computed(() =>
  ['ranked', 'aram_mayhem', 'aram', 'classic'].map((value) => ({
    value,
    label: t(`qq101.modes.${value}`)
  }))
)
const boards = computed(() =>
  ['champions', 'augments', 'synergies'].map((value) => ({
    value,
    label: t(`qq101.boards.${value}`)
  }))
)
const tierIcons: Record<number, string> = {
  1: 'iron',
  2: 'bronze',
  3: 'silver',
  4: 'gold',
  5: 'platinum',
  6: 'emerald',
  7: 'diamond',
  8: 'master',
  9: 'grandmaster',
  10: 'challenger',
  88: 'challenger',
  24: 'gold',
  25: 'platinum',
  26: 'emerald',
  27: 'diamond',
  28: 'master'
}
const tiers = computed(() =>
  [255, 88, 10, 9, 28, 8, 27, 7, 26, 6, 25, 5, 24, 4, 3, 2, 1].map((value) => ({
    value,
    label: t(`qq101.tiers.${value}`),
    rank: tierIcons[value]
  }))
)
const positions = computed(() =>
  ['all', 'top', 'jungle', 'middle', 'bottom', 'utility'].map((value) => ({
    value,
    label: t(`qq101.positions.${value}`)
  }))
)
const roles = computed(() => [
  { value: 'all', label: t('qq101.all') },
  ...['tank', 'fighter', 'assassin', 'mage', 'marksman', 'support'].map((value) => ({
    value,
    label: t(`qq101.roles.${value}`)
  }))
])
const rarities = computed(() => [
  { value: 'all', label: t('qq101.all') },
  ...['kSilver', 'kGold', 'kPrismatic', 'unknown'].map((value) => ({
    value,
    label: t(`qq101.rarities.${value}`)
  }))
])
const patchOptions = computed(() => [
  { value: '', label: t('qq101.latest') },
  ...patches.map((value) => ({ value, label: value }))
])
const renderLabel: SelectRenderLabel = (option) => (
  <FilterLabel label={String(option.label ?? '')} />
)
const renderTierLabel: SelectRenderLabel = (option) => (
  <FilterLabel label={String(option.label ?? '')} icon="tier" rank={option.rank as string} />
)
const renderPositionLabel: SelectRenderLabel = (option) => (
  <FilterLabel label={String(option.label ?? '')} position={String(option.value)} />
)

function filterStyle(key: 'mode' | 'board' | 'tier' | 'position' | 'patch' | 'role' | 'rarity') {
  const widths =
    resources.runtime.locale === 'en'
      ? {
          mode: 154,
          board: 130,
          tier: 146,
          position: 124,
          patch: preferences.patch ? 74 : 110,
          role: 108,
          rarity: 126
        }
      : {
          mode: 116,
          board: 104,
          tier: 122,
          position: 104,
          patch: preferences.patch ? 74 : 88,
          role: 88,
          rarity: 88
        }
  return {
    width: '0',
    minWidth: widths[key] + 'px',
    flex: key === 'patch' ? '0 0 auto' : '1 0 auto'
  }
}
</script>
