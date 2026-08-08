<template>
  <div class="mx-auto max-w-266 space-y-4">
    <form class="flex gap-2 max-sm:flex-col" @submit.prevent="search">
      <NInput
        v-model:value="query"
        clearable
        :placeholder="labels.searchPlaceholder"
        size="large"
      />
      <NButton attr-type="submit" type="primary" size="large" :loading="searching">
        {{ labels.search }}
      </NButton>
    </form>

    <NAlert v-if="error" type="error" closable @close="error = ''">{{ error }}</NAlert>

    <section v-if="searching || searched" class="space-y-2">
      <div class="text-sm font-semibold">{{ labels.playerSearch }}</div>
      <NEmpty
        v-if="searched && !searching && results.length === 0"
        :description="labels.emptySearch"
      />
      <div v-else class="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
        <NCard
          v-for="player in results"
          :key="playerKey(player)"
          size="small"
          hoverable
          class="player-card cursor-pointer"
          @click="selectPlayer(player)"
        >
          <div class="flex items-center gap-3">
            <img
              class="size-11 rounded-lg"
              :src="api.assetUrl('profile-icon', player.profileIconId)"
              alt=""
            />
            <div class="min-w-0">
              <div class="truncate font-medium">
                {{ player.gameName }}<span class="opacity-50">#{{ player.tagLine }}</span>
              </div>
              <div class="text-xs opacity-55">
                {{ player.sgpServerId }} · {{ labels.level }} {{ player.summonerLevel }}
              </div>
            </div>
          </div>
        </NCard>
      </div>
    </section>

    <template v-if="tabs.length">
      <div class="flex gap-1 overflow-x-auto border-b border-black/10 pb-px dark:border-white/10">
        <div v-for="tab in tabs" :key="historyKey(tab)" class="tab-item">
          <button
            type="button"
            class="tab-button"
            :class="{ 'tab-button--active': historyKey(tab) === selectedKey }"
            @click="selectTab(tab)"
          >
            <img
              class="size-5 rounded"
              :src="api.assetUrl('profile-icon', tab.player.profileIconId)"
              alt=""
            />
            <span class="max-w-34 truncate">{{ tab.player.gameName }}</span>
          </button>
          <button type="button" class="tab-close" :aria-label="labels.close" @click="closeTab(tab)">
            ×
          </button>
        </div>
      </div>

      <NSpin :show="loadingPlayer || loadingPage">
        <section v-if="history" class="space-y-6">
          <header class="flex min-w-0 flex-col gap-4 px-1 lg:h-28 lg:flex-row lg:items-center">
            <div class="flex min-w-0 flex-1 items-center gap-3">
              <div class="relative size-16 shrink-0">
                <img
                  class="size-full rounded-lg"
                  :src="api.assetUrl('profile-icon', history.player.profileIconId)"
                  alt=""
                />
                <span class="level-badge">{{ history.player.summonerLevel }}</span>
              </div>
              <div class="min-w-0">
                <h2 class="truncate text-xl font-bold">{{ history.player.gameName }}</h2>
                <div class="truncate text-sm text-gray-500 dark:text-gray-400">
                  #{{ history.player.tagLine }}
                </div>
              </div>
            </div>
            <PlayerRankedPane
              class="w-full lg:w-auto lg:min-w-122"
              :ranked="history.ranked"
              :labels="labels"
            />
            <NButton secondary class="lg:size-10.5!" :loading="loadingPage" @click="refreshCurrent">
              {{ labels.refresh }}
            </NButton>
          </header>

          <div class="grid grid-cols-1 items-start gap-3 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside class="hidden space-y-3 lg:sticky lg:top-30 lg:block">
              <PlayerSummaryPane :analysis="history.analysis" :api="api" :labels="labels" />
            </aside>

            <div class="min-w-0 space-y-2">
              <div
                class="flex min-w-0 flex-wrap items-center justify-end gap-2 rounded bg-black/5 px-2 py-1 dark:bg-white/5"
              >
                <NButton class="lg:hidden" size="small" secondary @click="showSidebar = true">
                  {{ labels.summary }}
                </NButton>
                <NSelect
                  v-model:value="queueFilter"
                  class="min-w-40 flex-1 sm:max-w-56"
                  size="small"
                  :options="queueOptions"
                />
                <NButton
                  size="small"
                  secondary
                  :disabled="history.startIndex === 0"
                  @click="goToPage(-1)"
                >
                  ‹
                </NButton>
                <span class="min-w-6 text-center text-sm">
                  {{ Math.floor(history.startIndex / 20) + 1 }}
                </span>
                <NButton size="small" secondary :disabled="!history.hasMore" @click="goToPage(1)">
                  ›
                </NButton>
              </div>

              <NEmpty v-if="filteredGames.length === 0" :description="labels.noMatches" />
              <div v-else class="flex flex-col gap-1">
                <div
                  v-for="match in filteredGames"
                  :key="match.source + '-' + match.gameId"
                  class="overflow-x-auto"
                >
                  <ReadonlyMatchCard
                    class="min-w-175"
                    :view="match.cardView"
                    :puuid="match.subject?.puuid || history.player.puuid"
                    @navigate-to-summoner-by-puuid="openParticipant(match, $event)"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </NSpin>
    </template>

    <NDrawer v-model:show="showSidebar" width="min(320px, calc(100% - 32px))" placement="left">
      <NDrawerContent
        :title="labels.summary"
        :native-scrollbar="false"
        body-content-style="padding: 8px"
      >
        <PlayerSummaryPane
          v-if="history"
          :analysis="history.analysis"
          :api="api"
          :labels="labels"
        />
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<script setup lang="ts">
import type {
  LanWebMatchDto,
  LanWebMatchHistoryDto,
  LanWebOngoingPlayerDto,
  LanWebPlayerDto
} from '@shared/shards/lan-web'
import ReadonlyMatchCard from '@renderer-shared/components/match-card/ReadonlyMatchCard.vue'
import {
  NAlert,
  NButton,
  NCard,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NInput,
  NSelect,
  NSpin
} from 'naive-ui'
import { computed, ref } from 'vue'

import type { LanWebApiClient } from '../api'
import type { LanWebLabels } from '../labels'
import PlayerRankedPane from './PlayerRankedPane.vue'
import PlayerSummaryPane from './PlayerSummaryPane.vue'

const props = defineProps<{ api: LanWebApiClient; labels: LanWebLabels; locale: string }>()
const query = ref('')
const results = ref<LanWebPlayerDto[]>([])
const searched = ref(false)
const searching = ref(false)
const tabs = ref<LanWebMatchHistoryDto[]>([])
const selectedKey = ref('')
const error = ref('')
const loadingPlayer = ref(false)
const loadingPage = ref(false)
const queueFilter = ref('all')
const showSidebar = ref(false)

const history = computed(
  () => tabs.value.find((tab) => historyKey(tab) === selectedKey.value) ?? null
)
const queueOptions = computed(() => [
  { label: props.labels.queueAll, value: 'all' },
  ...Array.from(new Set(history.value?.games.map((game) => game.gameMode) ?? [])).map(
    (gameMode) => ({ label: gameMode, value: gameMode })
  )
])
const filteredGames = computed(
  () =>
    history.value?.games.filter(
      (game) => queueFilter.value === 'all' || game.gameMode === queueFilter.value
    ) ?? []
)

type SelectablePlayer = LanWebPlayerDto | LanWebOngoingPlayerDto

function playerKey(player: SelectablePlayer) {
  return player.sgpServerId + '-' + player.puuid
}

function historyKey(value: LanWebMatchHistoryDto) {
  return playerKey(value.player)
}

function replaceHistory(next: LanWebMatchHistoryDto) {
  const index = tabs.value.findIndex((tab) => historyKey(tab) === historyKey(next))
  if (index >= 0) tabs.value[index] = next
}

async function search() {
  if (!query.value.trim()) return
  searching.value = true
  searched.value = true
  error.value = ''
  try {
    results.value = (await props.api.searchPlayers(query.value)).results
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  } finally {
    searching.value = false
  }
}

async function selectPlayer(player: SelectablePlayer) {
  const key = playerKey(player)
  const existing = tabs.value.find((tab) => historyKey(tab) === key)
  if (existing) {
    selectedKey.value = key
    searched.value = false
    return
  }

  loadingPlayer.value = true
  error.value = ''
  try {
    const next = await props.api.getMatchHistory(player.sgpServerId, player.puuid)
    tabs.value.push(next)
    selectedKey.value = historyKey(next)
    queueFilter.value = 'all'
    searched.value = false
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  } finally {
    loadingPlayer.value = false
  }
}

function selectTab(tab: LanWebMatchHistoryDto) {
  selectedKey.value = historyKey(tab)
  queueFilter.value = 'all'
}

function closeTab(tab: LanWebMatchHistoryDto) {
  const index = tabs.value.findIndex((entry) => historyKey(entry) === historyKey(tab))
  if (index < 0) return
  const wasSelected = historyKey(tab) === selectedKey.value
  tabs.value.splice(index, 1)
  if (wasSelected) {
    const next = tabs.value[Math.min(index, tabs.value.length - 1)]
    selectedKey.value = next ? historyKey(next) : ''
  }
}

async function loadHistoryPage(start: number) {
  if (!history.value) return
  loadingPage.value = true
  error.value = ''
  try {
    const next = await props.api.getMatchHistory(
      history.value.player.sgpServerId,
      history.value.player.puuid,
      Math.max(0, start),
      20
    )
    replaceHistory(next)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  } finally {
    loadingPage.value = false
  }
}

function goToPage(direction: -1 | 1) {
  if (!history.value) return
  void loadHistoryPage(history.value.startIndex + direction * 20)
}

function refreshCurrent() {
  if (!history.value) return
  void loadHistoryPage(history.value.startIndex)
}

async function openParticipant(match: LanWebMatchDto, puuid: string) {
  error.value = ''
  try {
    await selectPlayer(await props.api.getPlayer(match.sgpServerId, puuid))
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  }
}

defineExpose({ openPlayer: selectPlayer })
</script>

<style scoped>
@reference '@renderer-shared/assets/css/tailwind.css';

.tab-item {
  @apply flex shrink-0 items-center rounded-t-md;
}

.tab-button {
  @apply flex min-w-0 appearance-none items-center gap-2 border-x-0 border-t-0 border-b-2 border-transparent bg-transparent py-2 pr-1 pl-3 text-sm opacity-60 transition-colors;
}

.tab-button:hover,
.tab-button--active {
  @apply opacity-100;
}

.tab-button--active {
  @apply border-akari-500 text-akari-500;
}

.tab-close {
  @apply mr-1 flex size-5 appearance-none items-center justify-center rounded border-0 bg-transparent p-0 opacity-45 hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/10;
}

.level-badge {
  @apply absolute -right-1 -bottom-1 rounded bg-black/65 px-1.5 py-0.5 text-[10px] text-white;
}
</style>
