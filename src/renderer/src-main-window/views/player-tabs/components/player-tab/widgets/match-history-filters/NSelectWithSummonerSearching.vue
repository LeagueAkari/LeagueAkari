<template>
  <NSelect
    :loading="isSearchingSummoner"
    :options="summonerOptions"
    v-model:value="selectedPuuid"
    filterable
    clearable
    :render-label="renderSummonerOption"
    :filter="handleFilter"
    @search="handleSearch"
    @clear="handleClearSearch"
    v-bind="$attrs"
  />
</template>

<script setup lang="tsx">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useSummonerFetch } from '@renderer-shared/composables/useSummonerFetch'
import { profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { toIdentities } from '@shared/data-adapter/match-history/identities'
import { useDebounceFn } from '@vueuse/core'
import { NSelect, SelectOption } from 'naive-ui'
import { computed, ref, watch } from 'vue'

import { usePlayerTab } from '../../context'
import { useMatchHistory } from '../../data/match-history'
import { SimpleSummonerResult, useMatchHistoryFilters } from '../../data/match-history-filters'

const selectedPuuid = defineModel<string | null>('puuid', { required: true })

const { page: pagedMatchHistory } = useMatchHistory()
const { searchSummonerByAlias } = useSummonerFetch()

const { cachedSummoners, saveSummoner } = useMatchHistoryFilters()

const isSearchingSummoner = ref(false)
const searchText = ref('')

const { isCrossRegion, sgpServerId } = usePlayerTab()

const summonerMapInPage = computed(() => {
  if (!pagedMatchHistory.value) {
    return new Map<string, SimpleSummonerResult>()
  }

  const { games } = pagedMatchHistory.value
  const playerMap = new Map<string, SimpleSummonerResult>()

  games.forEach((game) => {
    const identities = toIdentities(game)
    identities.forEach((identity) => {
      playerMap.set(identity.puuid, identity)
    })
  })

  return playerMap
})

const summonerOptions = computed(() => {
  const map = new Map<string, SimpleSummonerResult>()

  for (const summoner of Object.values(cachedSummoners.value)) {
    map.set(summoner.puuid, summoner)
  }

  for (const summoner of summonerMapInPage.value.values()) {
    if (!map.has(summoner.puuid)) {
      map.set(summoner.puuid, summoner)
    }
  }

  return Array.from(map.values()).map((summoner) => {
    return {
      label: `${summoner.gameName}#${summoner.tagLine}`,
      value: summoner.puuid,
      profileIconId: summoner.profileIconId
    }
  })
})

// 保证选择的召唤师被缓存
watch(
  () => selectedPuuid.value,
  (value) => {
    if (value && summonerMapInPage.value.has(value)) {
      saveSummoner(value, summonerMapInPage.value.get(value)!)
    }
  },
  { immediate: true }
)

const handleSearchSummoner = async (value: string) => {
  const [gameName = '', tagLine = ''] = value.split('#')

  if (!gameName.trim() || !tagLine.trim()) {
    return
  }

  if (isSearchingSummoner.value) {
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
      saveSummoner(summoner.puuid, summoner)
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

const handleClearSearch = () => {
  searchText.value = ''
  selectedPuuid.value = null
}

const handleFilter = (pattern: string, option: SelectOption) => {
  const label = option.label as string
  const value = option.value as string

  return (
    label.toLowerCase().includes(pattern.toLowerCase()) ||
    value.toLowerCase().includes(pattern.toLowerCase())
  )
}

const renderSummonerOption = (option: SelectOption) => {
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
