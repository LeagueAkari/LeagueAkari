<template>
  <div class="min-h-dvh bg-(--la-color-bg-primary) text-(--la-color-text-primary)">
    <header
      class="sticky top-0 z-10 border-b border-black/10 bg-[color-mix(in_srgb,var(--la-color-bg-primary)_88%,transparent)] backdrop-blur-xl dark:border-white/10"
    >
      <div class="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <div class="min-w-0 flex-1">
          <h1 class="truncate text-lg font-bold tracking-tight">
            League Akari <span class="text-akari-500">LAN</span>
          </h1>
          <div v-if="status" class="mt-0.5 flex items-center gap-1.5 text-xs opacity-65">
            <span
              :class="[
                'size-1.5 rounded-full',
                status.leagueClientConnected ? 'bg-emerald-500' : 'bg-amber-500'
              ]"
            ></span>
            {{ status.leagueClientConnected ? labels.connected : labels.disconnected }}
          </div>
        </div>
        <NButton size="small" quaternary :loading="refreshing" @click="refresh">{{
          labels.refresh
        }}</NButton>
      </div>
      <nav class="mx-auto flex max-w-7xl gap-1 px-4 sm:px-6" aria-label="Primary">
        <button
          v-for="item in nav"
          :key="item.id"
          type="button"
          :class="[
            'appearance-none border-x-0 border-t-0 border-b-2 bg-transparent px-3 py-2 text-sm transition-colors',
            activeView === item.id
              ? 'border-akari-500 text-akari-500'
              : 'border-transparent opacity-65 hover:opacity-100'
          ]"
          @click="activateView(item.id)"
        >
          {{ item.label }}
        </button>
      </nav>
    </header>
    <main class="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7">
      <NAlert v-if="fatalError" :title="labels.serviceUnavailable" type="error">{{
        fatalError
      }}</NAlert>
      <NSpin v-else-if="!ongoing || !status" show class="min-h-52" />
      <template v-else>
        <OngoingGameView
          v-show="activeView === 'ongoing'"
          :game="ongoing"
          :labels="labels"
          @select-player="openPlayerHistory"
        />
        <PlayerHistoryView
          v-show="activeView === 'players'"
          ref="playerHistoryView"
          :api="api"
          :labels="labels"
          :locale="locale"
        />
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import type {
  LanWebOngoingGameDto,
  LanWebOngoingPlayerDto,
  LanWebStatusDto
} from '@shared/shards/lan-web'
import { NAlert, NButton, NSpin } from 'naive-ui'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { LanWebApiClient } from './api'
import OngoingGameView from './components/OngoingGameView.vue'
import PlayerHistoryView from './components/PlayerHistoryView.vue'
import { getLabels } from './labels'

const props = defineProps<{ api: LanWebApiClient }>()
const { labels, locale } = getLabels()
const status = ref<LanWebStatusDto | null>(null)
const ongoing = ref<LanWebOngoingGameDto | null>(null)
const fatalError = ref('')
const refreshing = ref(false)
const activeView = ref<'ongoing' | 'players'>('ongoing')
const playerHistoryView = ref<InstanceType<typeof PlayerHistoryView> | null>(null)
let events: EventSource | null = null
const nav = computed(() => [
  { id: 'ongoing' as const, label: labels.currentGame },
  { id: 'players' as const, label: labels.playerLookup }
])

function openPlayerHistory(player: LanWebOngoingPlayerDto) {
  activeView.value = 'players'
  void playerHistoryView.value?.openPlayer(player)
}

function activateView(view: 'ongoing' | 'players') {
  activeView.value = view
  if (view === 'players' && status.value?.currentPlayer) {
    void playerHistoryView.value?.openPlayer(status.value.currentPlayer)
  }
}

async function refresh() {
  refreshing.value = true
  fatalError.value = ''
  try {
    ;[status.value, ongoing.value] = await Promise.all([
      props.api.getStatus(),
      props.api.getOngoingGame()
    ])
  } catch (cause) {
    fatalError.value = cause instanceof Error ? cause.message : String(cause)
  } finally {
    refreshing.value = false
  }
}

onMounted(async () => {
  await refresh()
  events = props.api.createEventSource()
  events.addEventListener(
    'status',
    (event) => (status.value = JSON.parse((event as MessageEvent).data))
  )
  events.addEventListener(
    'ongoing-game',
    (event) => (ongoing.value = JSON.parse((event as MessageEvent).data))
  )
})
onBeforeUnmount(() => events?.close())
</script>
