<template>
  <div class="box-border size-full min-h-0 rounded bg-black/5 p-3 dark:bg-white/5">
    <div class="grid min-w-0 gap-3">
      <div class="min-w-0">
        <div class="mb-2 text-xs text-black/80 dark:text-white/60">
          {{ t('PlayerTab.filter.winLoss') }}
        </div>
        <NRadioGroup v-model:value="winLoss" size="small">
          <NRadio value="all" :label="t('PlayerTab.filter.all')" />
          <NRadio value="win" :label="t('PlayerTab.filter.win')" />
          <NRadio value="loss" :label="t('PlayerTab.filter.loss')" />
        </NRadioGroup>
      </div>

      <div class="min-w-0">
        <div class="mb-2 text-xs text-black/80 dark:text-white/60">
          {{ t('PlayerTab.filter.timeRange') }}
        </div>
        <NSelect
          class="w-full min-w-0"
          v-model:value="selectedTimeRange"
          size="small"
          :options="timeRangeOptions"
        />
      </div>

      <div v-if="isSgpMatchHistorySource" class="min-w-0">
        <div class="mb-2 text-xs text-black/80 dark:text-white/60">
          {{ t('PlayerTab.filter.position') }}
        </div>
        <NSelect
          class="w-full min-w-0"
          v-model:value="selectedPositions"
          size="small"
          multiple
          clearable
          :options="positionOptions"
          :render-label="renderPositionOption"
          :render-tag="renderPositionTag"
        />
      </div>

      <div class="min-w-0">
        <div class="mb-2 text-xs text-black/80 dark:text-white/60">
          {{ t('PlayerTab.filter.summoners') }}
        </div>
        <NSelect
          class="w-full min-w-0"
          v-model:value="selectedSummoners"
          size="small"
          multiple
          filterable
          clearable
          remote
          :loading="isSearchingSummoner"
          :options="summonerOptions"
          :render-label="renderSummonerOption"
          :render-tag="renderSummonerTag"
          :filter="handleSummonerFilter"
          @search="handleSearch"
          @clear="handleClearSummonerSearch"
        />
      </div>

      <div class="min-w-0">
        <div class="mb-2 text-xs text-black/80 dark:text-white/60">
          {{ t('PlayerTab.filter.champions') }}
        </div>
        <NSelect
          class="w-full min-w-0"
          v-model:value="selectedChampions"
          size="small"
          multiple
          filterable
          clearable
          :options="championOptions"
          :filter="(pattern, option) => isNameMatch(pattern, option.label as string, option.value as number)"
          :render-label="renderChampionOption"
          :render-tag="renderChampionTag"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="tsx">
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useSummonerFetch } from '@renderer-shared/composables/useSummonerFetch'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { profileIconUri } from '@renderer-shared/shards/league-client/game-data-assets'
import { toIdentities } from '@shared/data-adapter/match-history/identities'
import { useDebounceFn } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { NRadio, NRadioGroup, NSelect, NTag, SelectOption } from 'naive-ui'
import { SelectBaseOption } from 'naive-ui/es/select/src/interface'
import { computed, ref, watch } from 'vue'

import { useChampionNameMatch } from '@main-window/composables/useChampionNameMatch'

import { usePlayerTab } from '../../context'
import { useMatchHistory } from '../../data/match-history'
import {
  SimpleMatchHistoryFilterState,
  SimpleTimeRangeFilter,
  SimpleSummonerResult,
  SimpleWinLossFilter,
  createEmptySimpleState
} from './filter-state'

const simpleState = defineModel<SimpleMatchHistoryFilterState>({
  default: () => createEmptySimpleState()
})

const { t } = useTranslation()
const lcs = useLeagueClientStore()
const { match: isNameMatch } = useChampionNameMatch()
const { page } = useMatchHistory()
const { puuid, preferredSource, isCrossRegion, sgpServerId } = usePlayerTab()
const { searchSummonerByAlias } = useSummonerFetch()

const searchText = ref('')
const searchResults = ref<SimpleSummonerResult[]>([])
const isSearchingSummoner = ref(false)

const updateSimpleState = (patch: Partial<SimpleMatchHistoryFilterState>) => {
  simpleState.value = {
    ...simpleState.value,
    ...patch
  }
}

const winLoss = computed({
  get: () => simpleState.value.winLoss,
  set: (winLoss: SimpleWinLossFilter) => updateSimpleState({ winLoss })
})

const selectedTimeRange = computed({
  get: () => simpleState.value.timeRange ?? 'all',
  set: (timeRange: SimpleTimeRangeFilter) => updateSimpleState({ timeRange })
})

const selectedChampions = computed({
  get: () => simpleState.value.championIds,
  set: (championIds: number[]) => updateSimpleState({ championIds })
})

const selectedSummoners = computed({
  get: () => simpleState.value.summonerPuuids,
  set: (summonerPuuids: string[]) => updateSimpleState({ summonerPuuids })
})

const cachedSummoners = computed(() => simpleState.value.cachedSummoners)
const isSgpMatchHistorySource = computed(
  () => preferredSource.value === 'sgp' || isCrossRegion.value
)

const timeRangeOptions = computed<{ label: string; value: SimpleTimeRangeFilter }[]>(() => [
  { label: t('PlayerTab.timeRange.all'), value: 'all' },
  { label: t('PlayerTab.timeRange.last3Hours'), value: 'last3Hours' },
  { label: t('PlayerTab.timeRange.last12Hours'), value: 'last12Hours' },
  { label: t('PlayerTab.timeRange.last24Hours'), value: 'last24Hours' },
  { label: t('PlayerTab.timeRange.last3Days'), value: 'last3Days' },
  { label: t('PlayerTab.timeRange.last7Days'), value: 'last7Days' },
  { label: t('PlayerTab.timeRange.last30Days'), value: 'last30Days' }
])

const positionOptions = computed(() => {
  return ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'].map((position) => ({
    label: t(`positions.${position}`, { ns: 'common' }),
    value: position
  }))
})

const selectedPositions = computed({
  get: () => simpleState.value.positions,
  set: (positions: string[]) => updateSimpleState({ positions })
})

const championOptions = computed(() => {
  return Object.values(lcs.gameData.champions)
    .filter((champion) => champion.id !== -1)
    .map((champion) => ({
      label: champion.name,
      value: champion.id
    }))
    .toSorted((a, b) => a.label.localeCompare(b.label))
})

const summonerMapInPage = computed(() => {
  if (!page.value) {
    return new Map<string, SimpleSummonerResult>()
  }

  const playerMap = new Map<string, SimpleSummonerResult>()

  page.value.games.forEach((game) => {
    toIdentities(game).forEach((identity) => {
      playerMap.set(identity.puuid, identity)
    })
  })

  return playerMap
})

const saveSummoner = (summoner: SimpleSummonerResult) => {
  updateSimpleState({
    cachedSummoners: {
      ...cachedSummoners.value,
      [summoner.puuid]: summoner
    }
  })
}

watch(
  selectedSummoners,
  (values) => {
    values.forEach((selectedPuuid) => {
      const summoner = summonerMapInPage.value.get(selectedPuuid)

      if (summoner) {
        saveSummoner(summoner)
      }
    })
  },
  { deep: true, immediate: true }
)

const summonerOptions = computed(() => {
  const searchResultPuuids = new Set(searchResults.value.map((s) => s.puuid))
  const optionGroups: SelectOption[] = []

  if (searchResults.value.length) {
    optionGroups.push({
      type: 'group',
      label: t('PlayerTab.filter.searchResults'),
      key: 'search-results',
      children: searchResults.value.map((summoner) => ({
        label: `${summoner.gameName}#${summoner.tagLine}`,
        value: summoner.puuid,
        profileIconId: summoner.profileIconId
      }))
    })
  }

  const pageSummoners = Array.from(summonerMapInPage.value.values())
    .filter(
      (summoner) =>
        !searchResultPuuids.has(summoner.puuid) &&
        (!searchText.value.trim() ||
          `${summoner.gameName}#${summoner.tagLine}`
            .toLowerCase()
            .includes(searchText.value.toLowerCase()))
    )
    .toSorted((a, b) => Number(b.puuid === puuid.value) - Number(a.puuid === puuid.value))

  if (pageSummoners.length) {
    optionGroups.push({
      type: 'group',
      label: t('PlayerTab.filter.pageSummoners'),
      key: 'page-summoners',
      children: pageSummoners.map((summoner) => ({
        label: `${summoner.gameName}#${summoner.tagLine}`,
        value: summoner.puuid,
        profileIconId: summoner.profileIconId
      }))
    })
  }

  const visiblePuuids = new Set([
    ...searchResults.value.map((s) => s.puuid),
    ...pageSummoners.map((s) => s.puuid)
  ])
  const selectedCachedSummoners = selectedSummoners.value
    .map((selectedPuuid) => cachedSummoners.value[selectedPuuid])
    .filter((summoner): summoner is SimpleSummonerResult => !!summoner)
    .filter((summoner) => !visiblePuuids.has(summoner.puuid))

  if (selectedCachedSummoners.length) {
    optionGroups.push({
      type: 'group',
      label: t('PlayerTab.filter.selectedSummoners'),
      key: 'selected-summoners',
      children: selectedCachedSummoners.map((summoner) => ({
        label: `${summoner.gameName}#${summoner.tagLine}`,
        value: summoner.puuid,
        profileIconId: summoner.profileIconId
      }))
    })
  }

  return optionGroups
})

const handleSearchSummoner = async (value: string) => {
  const [gameName = '', tagLine = ''] = value.split('#')

  if (!gameName.trim() || !tagLine.trim() || isSearchingSummoner.value) {
    return
  }

  isSearchingSummoner.value = true

  try {
    const summoner = await searchSummonerByAlias(
      gameName.trim(),
      tagLine.trim(),
      isCrossRegion.value ? 'sgp' : 'lcu',
      sgpServerId.value
    )

    if (summoner) {
      saveSummoner(summoner)
      searchResults.value = [
        summoner,
        ...searchResults.value.filter((item) => item.puuid !== summoner.puuid)
      ].slice(0, 10)
    }
  } catch {
  } finally {
    isSearchingSummoner.value = false
  }
}

const debouncedHandleSearchSummoner = useDebounceFn(handleSearchSummoner, 750)

const handleSearch = (value: string) => {
  searchText.value = value
  debouncedHandleSearchSummoner(value)
}

const handleClearSummonerSearch = () => {
  searchText.value = ''
  searchResults.value = []
}

const handleSummonerFilter = (pattern: string, option: SelectOption) => {
  const label = option.label as string
  const value = option.value as string

  return (
    label.toLowerCase().includes(pattern.toLowerCase()) ||
    value.toLowerCase().includes(pattern.toLowerCase())
  )
}

const renderPositionOption = (option: SelectBaseOption) => {
  return (
    <div class="flex items-center gap-2">
      <PositionIcon class="text-5 shrink-0" position={option.value as string} />
      <span class="text-sm">{option.label as string}</span>
    </div>
  )
}

const renderPositionTag = (props: { option: SelectOption; handleClose: () => void }) => {
  return (
    <NTag size="small" closable onClose={props.handleClose}>
      <div class="flex items-center gap-1">
        <PositionIcon class="text-4" position={props.option.value as string} />
        <span class="text-xs">{props.option.label as string}</span>
      </div>
    </NTag>
  )
}

const renderChampionTag = (props: { option: SelectOption; handleClose: () => void }) => {
  return (
    <NTag size="small" closable onClose={props.handleClose}>
      <div class="flex items-center gap-1">
        <ChampionIcon class="size-4 rounded" championId={props.option.value as number} />
        <span class="text-xs">{props.option.label as string}</span>
      </div>
    </NTag>
  )
}

const renderChampionOption = (option: SelectBaseOption) => {
  if (option.type === 'group') {
    return <span>{option.label as string}</span>
  }

  return (
    <div class="flex items-center gap-2">
      <ChampionIcon class="size-5 shrink-0 rounded" championId={option.value as number} />
      <span class="text-sm">{option.label as string}</span>
    </div>
  )
}

const renderSummonerTag = (props: { option: SelectOption; handleClose: () => void }) => {
  return (
    <NTag size="small" closable onClose={props.handleClose}>
      <div class="flex items-center gap-1">
        <LcuImage
          class="size-4 rounded"
          src={profileIconUri(props.option.profileIconId as number)}
        />
        <span class="text-xs">{props.option.label as string}</span>
      </div>
    </NTag>
  )
}

const renderSummonerOption = (option: SelectBaseOption) => {
  if (option.type === 'group') {
    return <span>{option.label as string}</span>
  }

  if (!option.value) {
    return null
  }

  const [gameName, tagLine] = (option.label as string).split('#')

  return (
    <div class="flex items-center gap-2">
      <LcuImage
        class="size-5 shrink-0 rounded"
        src={profileIconUri(option.profileIconId as number)}
      />
      <span class="truncate text-sm" title={option.label as string}>
        {gameName}
        <span class="ml-1 text-xs text-black/50 dark:text-white/50">#{tagLine}</span>
      </span>
    </div>
  )
}
</script>
