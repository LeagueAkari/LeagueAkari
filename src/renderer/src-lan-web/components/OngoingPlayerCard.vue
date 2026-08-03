<template>
  <article
    class="ongoing-player-card group"
    role="button"
    tabindex="0"
    :aria-label="`${player.gameName}#${player.tagLine}`"
    :style="{ borderColor: premadeColor }"
    @click="emit('select-player', player)"
    @keydown.enter="emit('select-player', player)"
    @keydown.space.prevent="emit('select-player', player)"
  >
    <div
      v-if="player.premadeTeamId"
      class="absolute top-0 right-0 size-4 translate-x-1/2 -translate-y-1/2 rotate-45"
      :style="{ backgroundColor: premadeColor }"
    ></div>

    <div class="mb-1 flex">
      <div class="relative mr-2 shrink-0 transition-[filter] group-hover:brightness-110">
        <img
          class="size-10.5 rounded-full object-cover ring-1 ring-white/30"
          :src="
            player.championId
              ? api.assetUrl('champion', player.championId)
              : api.assetUrl('profile-icon', player.profileIconId)
          "
          alt=""
        />
        <span class="level-badge">{{ player.summonerLevel }}</span>
      </div>

      <div class="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <div class="truncate text-[13px] font-bold text-black/80 dark:text-white/80">
          {{ player.gameName }}
          <span
            v-if="player.tagLine"
            class="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400"
          >
            #{{ player.tagLine }}
          </span>
        </div>
        <div class="flex gap-1">
          <RankCompact :entry="rankedEntry('RANKED_SOLO_5x5')" :unranked="labels.unranked" />
          <RankCompact :entry="rankedEntry('RANKED_FLEX_SR')" :unranked="labels.unranked" />
        </div>
      </div>
    </div>

    <div class="mb-1 flex items-center">
      <div
        v-if="player.analysis"
        class="flex-1 text-center text-[13px] font-bold"
        :class="winRateClass"
      >
        {{ percent(player.analysis.winRate) }}
        <span class="text-[9px] font-normal text-black/70 dark:text-white/70">
          ({{ player.analysis.gameCount }})
        </span>
      </div>
      <div v-else class="flex-1 text-center text-[13px] opacity-45">- %</div>
      <div
        v-if="player.analysis"
        class="flex-1 text-center text-[13px] font-bold text-black/80 dark:text-white/80"
      >
        {{ decimal(player.analysis.averageKda) }}
      </div>
      <div v-else class="flex-1 text-center text-[13px] opacity-45">N/A</div>
      <span
        v-if="player.position"
        class="rounded bg-black/5 px-1.5 py-0.5 text-[10px] dark:bg-white/10"
      >
        {{ player.position }}
      </span>
    </div>

    <div v-if="cardTags.length" class="mb-1 flex flex-wrap gap-1">
      <span v-for="tag in cardTags" :key="tag.text" class="player-tag" :style="tag.style">
        {{ tag.text }}
      </span>
    </div>

    <div class="relative mt-1 flex min-h-32 flex-1 flex-col overflow-hidden">
      <div v-if="player.recentMatches.length" class="min-h-0 flex-1 overflow-y-auto pr-0.5">
        <div
          v-for="(match, index) in player.recentMatches"
          :key="`${match.source}-${match.gameId}`"
          class="recent-match"
          :class="recentMatchClass(match.winResult)"
        >
          <span class="absolute right-1 bottom-0 text-[9px] opacity-0 group-hover:opacity-55">
            #{{ index + 1 }}
          </span>
          <img
            class="mr-1 size-6 rounded"
            :src="api.assetUrl('champion', match.championId)"
            alt=""
          />
          <div class="mr-1 min-w-0 flex-1">
            <div class="truncate text-xs">{{ queueName(match.queueId, match.gameMode) }}</div>
            <div class="text-[10px] opacity-65">
              {{ shortDate(match.gameCreation) }}
              <span class="ml-1">{{ resultText(match.winResult) }}</span>
            </div>
          </div>
          <div class="shrink-0 text-xs tabular-nums">
            {{ match.kills }} / {{ match.deaths }} / {{ match.assists }}
          </div>
        </div>
      </div>
      <div v-else class="flex flex-1 items-center justify-center text-xs opacity-55">
        {{ player.loadingState || labels.noMatches }}
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { LanWebOngoingPlayerDto, LanWebRankedEntryDto } from '@shared/shards/lan-web'
import { computed } from 'vue'

import type { LanWebApiClient } from '../api'
import { decimal, percent, queueName } from '../format'
import type { LanWebLabels } from '../labels'
import RankCompact from './RankCompact.vue'

const props = defineProps<{
  player: LanWebOngoingPlayerDto
  api: LanWebApiClient
  labels: LanWebLabels
}>()
const emit = defineEmits<{ 'select-player': [player: LanWebOngoingPlayerDto] }>()

const premadeColors = ['#6d5bd0', '#258b74', '#b16a34', '#a84665', '#3e7aa8']
const premadeColor = computed(() =>
  props.player.premadeTeamId
    ? premadeColors[(props.player.premadeTeamId - 1) % premadeColors.length]
    : undefined
)
const winRateClass = computed(() => {
  const rate = props.player.analysis?.winRate ?? 0.5
  if (rate >= 0.53) return 'text-green-700 dark:text-green-300'
  if (rate <= 0.47) return 'text-red-700 dark:text-red-400'
  return 'text-black/80 dark:text-white/80'
})
const cardTags = computed(() => [
  ...(props.player.isSelf
    ? [{ text: props.labels.self, style: { backgroundColor: '#37246c', color: '#fff' } }]
    : []),
  ...(props.player.premadeTeamId
    ? [
        {
          text: `Group ${props.player.premadeTeamId}`,
          style: { backgroundColor: premadeColor.value, color: '#fff' }
        }
      ]
    : []),
  ...props.player.tags.map((text) => ({ text, style: {} }))
])

function rankedEntry(queueType: LanWebRankedEntryDto['queueType']) {
  return props.player.ranked.find((entry) => entry.queueType === queueType)
}

function shortDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(timestamp)
}

function resultText(result: string) {
  if (result === 'win') return props.labels.victory
  if (result === 'remake') return 'Remake'
  if (result === 'abort') return '—'
  return props.labels.defeat
}

function recentMatchClass(result: string) {
  if (result === 'win') return 'recent-match--win'
  if (result === 'remake' || result === 'abort') return 'recent-match--neutral'
  return 'recent-match--loss'
}
</script>

<style scoped>
@reference '@renderer-shared/assets/css/tailwind.css';

.ongoing-player-card {
  @apply focus-visible:ring-akari-500 relative box-border flex h-93.75 min-w-0 cursor-pointer flex-col overflow-hidden rounded border border-neutral-900/20 bg-neutral-100/90 p-2 text-left outline-hidden transition-[filter,box-shadow] hover:brightness-105 focus-visible:ring-2 dark:border-white/10 dark:bg-neutral-900/90;
}

.level-badge {
  @apply absolute right-0 bottom-0 translate-x-1/3 rounded bg-black/55 px-1 text-[10px] text-white;
}

.player-tag {
  @apply rounded-xs bg-black/8 px-1 py-0.5 text-[11px] leading-3 dark:bg-white/10;
}

.recent-match {
  @apply relative mb-0.5 flex h-8.5 items-center rounded px-2 py-0.5 transition-[filter] hover:brightness-110;
}

.recent-match--win {
  @apply bg-blue-400/35 text-black/80 dark:bg-blue-500/25 dark:text-white/80;
}

.recent-match--loss {
  @apply bg-red-500/30 text-black/80 dark:bg-red-500/25 dark:text-white/80;
}

.recent-match--neutral {
  @apply bg-neutral-400/45 text-black dark:bg-white/15 dark:text-white;
}
</style>
