<template>
  <div class="px-4 py-2 dark:bg-white/5 rounded bg-black/5">
    <div class="flex justify-between items-center mb-2">
      <!-- title -->
      <div class="flex items-center gap-1">
        <NIcon class="text-sm"><Filter20Regular /></NIcon>
        <span class="font-bold text-sm">{{ t('PlayerTab.filter.title') }}</span>
      </div>

      <!-- clear button -->
      <NButton
        tertiary
        size="tiny"
        type="warning"
        @click="clearAllConditions"
        :disabled="!hasFilters"
      >
        <template #icon>
          <NIcon class="text-11px"><Delete20Regular /></NIcon>
        </template>
        <span class="text-11px">{{ t('PlayerTab.filter.reset') }}</span>
      </NButton>
    </div>

    <!-- conditions -->
    <div class="space-y-2">
      <div>
        <div class="mb-2 text-xs dark:text-white/60 text-black/80">
          {{ t('PlayerTab.filter.winLoss') }}
        </div>
        <NRadioGroup size="small" v-model:value="winLoss">
          <NRadio value="all" :label="t('PlayerTab.filter.all')" />
          <NRadio value="win" :label="t('PlayerTab.filter.win')" />
          <NRadio value="loss" :label="t('PlayerTab.filter.loss')" />
        </NRadioGroup>
      </div>

      <div>
        <div class="mb-2 text-xs dark:text-white/60 text-black/80">
          {{ t('PlayerTab.filter.summoners') }}
        </div>
        <NSelect
          size="tiny"
          multiple
          filterable
          clearable
          remote
          :loading="isSearchingSummoner"
          :options="summonerOptions"
          v-model:value="selectedSummoners"
          :render-tag="renderSummonerTag"
          :render-label="renderSummonerOption"
          @search="handleSearch"
          @clear="handleClearSearch"
        />
      </div>

      <div>
        <div class="mb-2 text-xs dark:text-white/60 text-black/80">
          {{ t('PlayerTab.filter.champions') }}
        </div>
        <NSelect
          clearable
          filterable
          multiple
          :options="championOptions"
          size="tiny"
          v-model:value="selectedChampions"
          :filter="filterChampion"
          :render-tag="renderChampionTag"
          :render-label="renderChampionOption"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { championIconUri, profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { toIdentities } from '@shared/data-adapter/match-history/toIdentities'
import { Delete20Regular, Filter20Regular } from '@vicons/fluent'
import { useDebounceFn } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NRadio, NRadioGroup, NSelect, NTag, SelectOption } from 'naive-ui'
import { SelectBaseOption } from 'naive-ui/es/select/src/interface'
import { computed, h, ref, watchEffect } from 'vue'

import { useChampionNameMatch } from '@main-window/composables/useChampionNameMatch'

import { usePlayerTab } from '../context'
import { useMatchHistory } from '../data/match-history'
import { useMatchHistoryFilters } from '../data/match-history-filters'
import { useSummonerFetch } from '../utils/summoner-fetch'

const lcs = useLeagueClientStore()
const { t } = useTranslation()

const { isCrossRegion, sgpServerId } = usePlayerTab()
const { searchSummonerByAlias } = useSummonerFetch()
const { pagedMatchHistory } = useMatchHistory()

const winLoss = ref<'all' | 'win' | 'loss'>('all')

const selectedChampions = ref<number[]>([])
const championOptions = computed(() => {
  return Object.values(lcs.gameData.champions).map((champion) => {
    return {
      label: champion.name,
      value: champion.id
    }
  })
})

const { match: isChampionNameMatch } = useChampionNameMatch()

const filterChampion = (pattern: string, option: SelectOption) => {
  return isChampionNameMatch(pattern, option.label as string, option.value as number)
}

const renderChampionTag = (props: { option: SelectOption; handleClose: () => void }) => {
  return h(NTag, { size: 'tiny' }, () =>
    h('div', { class: 'flex items-center gap-1' }, [
      h(LcuImage, {
        class: 'size-3 rounded',
        src: championIconUri(props.option.value as number)
      }),
      h('span', { class: 'text-xs' }, props.option.label as string)
    ])
  )
}

const renderChampionOption = (option: SelectBaseOption) => {
  return h(
    'div',
    {
      class: 'flex items-center gap-2'
    },
    [
      h(LcuImage, {
        class: 'size-5 rounded',
        src: championIconUri(option.value as number)
      }),
      h('span', { class: 'text-sm' }, option.label as string)
    ]
  )
}

type SearchSummonerResult = {
  puuid: string
  profileIconId: number
  gameName: string
  tagLine: string
}

const searchText = ref('')
const selectedSummoners = ref<string[]>([])
const searchResult = ref<SearchSummonerResult[]>([])
const isSearchingSummoner = ref(false)

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
      searchResult.value.unshift(summoner)

      if (searchResult.value.length >= 10) {
        searchResult.value.pop()
      }
    }
  } catch {
  } finally {
    isSearchingSummoner.value = false
  }
}

const debouncedHandleSearchSummoner = useDebounceFn(handleSearchSummoner, 1000)

const handleSearch = (value: string) => {
  searchText.value = value
  debouncedHandleSearchSummoner(value)
}

const handleClearSearch = () => {
  searchText.value = ''
  searchResult.value = []
  selectedSummoners.value = []
}

const summonersInPage = computed(() => {
  if (!pagedMatchHistory.value) {
    return []
  }

  const { games } = pagedMatchHistory.value
  const playerSet = new Map<string, SearchSummonerResult>()

  games.forEach((game) => {
    const identities = toIdentities(game)
    identities.forEach((identity) => {
      playerSet.set(identity.puuid, identity)
    })
  })

  return Array.from(playerSet.values())
})

const summonerOptions = computed(() => {
  const options: SelectOption[] = []

  if (searchResult.value.length) {
    options.push({
      type: 'group',
      label: '搜索结果',
      key: 'search-results',
      children: searchResult.value.map((summoner) => {
        return {
          label: `${summoner.gameName} #${summoner.tagLine}`,
          value: summoner.puuid,
          profileIconId: summoner.profileIconId
        }
      })
    })
  }

  const filteredSummoners = summonersInPage.value.filter(
    (summoner) =>
      !searchResult.value.some((s) => s.puuid === summoner.puuid) &&
      (!searchText.value.trim() ||
        `${summoner.gameName}#${summoner.tagLine}`
          .toLowerCase()
          .includes(searchText.value.toLowerCase()))
  )

  if (filteredSummoners.length) {
    options.push({
      type: 'group',
      label: '页内召唤师',
      key: 'page-summoners',
      children: filteredSummoners.map((summoner) => {
        return {
          label: `${summoner.gameName} #${summoner.tagLine}`,
          value: summoner.puuid,
          profileIconId: summoner.profileIconId
        }
      })
    })
  }

  return options
})

const renderSummonerTag = (props: { option: SelectOption; handleClose: () => void }) => {
  return h(NTag, { size: 'tiny' }, () =>
    h('div', { class: 'flex items-center gap-1' }, [
      h(LcuImage, {
        class: 'size-3 rounded',
        src: profileIconUri(props.option.profileIconId as number)
      }),
      h('span', { class: 'text-xs' }, props.option.label as string)
    ])
  )
}

const renderSummonerOption = (option: SelectBaseOption) => {
  if (option.type === 'group') {
    return h('span', option.label as string)
  }

  return h(
    'div',
    {
      class: 'flex items-center gap-2'
    },
    [
      h(LcuImage, {
        class: 'size-5 rounded',
        src: profileIconUri(option.profileIconId as number)
      }),
      h('span', { class: 'text-sm' }, option.label as string)
    ]
  )
}

const clearAllConditions = () => {
  winLoss.value = 'all'
  selectedChampions.value = []
  selectedSummoners.value = []
  searchText.value = ''
  searchResult.value = []
}

// sync to tab-scoped context
const { setFilters, hasFilters, filters } = useMatchHistoryFilters()

winLoss.value = filters.value.winLoss
selectedChampions.value = filters.value.selectedChampions
selectedSummoners.value = filters.value.selectedSummoners

watchEffect(() => {
  setFilters({
    winLoss: winLoss.value,
    selectedChampions: selectedChampions.value,
    selectedSummoners: selectedSummoners.value
  })
})
</script>
