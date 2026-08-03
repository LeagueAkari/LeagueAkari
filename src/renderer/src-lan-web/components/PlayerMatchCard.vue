<template>
  <article
    class="match-card relative flex min-h-29 w-full min-w-0 overflow-hidden rounded border border-solid"
    :class="
      subject?.win
        ? 'border-blue-600/20 dark:border-blue-300/20'
        : 'border-red-600/20 dark:border-red-300/20'
    "
  >
    <div class="z-1 flex min-w-0 flex-1 gap-2 px-3 py-2 sm:px-4 sm:py-1">
      <div v-if="subject" class="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div class="flex min-w-0 items-center gap-2">
          <div class="flex w-14 shrink-0 items-center sm:w-17.5">
            <img
              class="size-11 rounded-lg border-2 border-solid object-cover"
              :class="
                subject.win
                  ? 'border-blue-600/80 dark:border-blue-300/80'
                  : 'border-red-600/80 dark:border-red-300/80'
              "
              :src="api.assetUrl('champion', subject.championId)"
              alt=""
            />
          </div>
          <div class="flex min-w-0 flex-1 items-center justify-around gap-2">
            <div class="min-w-19 text-center sm:min-w-22">
              <div
                class="flex items-center justify-center gap-0.5 text-base font-bold tabular-nums"
              >
                <span>{{ subject.kills }}</span
                ><span class="text-xs opacity-45">/</span>
                <span class="text-red-600 dark:text-red-300">{{ subject.deaths }}</span>
                <span class="text-xs opacity-45">/</span><span>{{ subject.assists }}</span>
              </div>
              <div class="text-xs opacity-75">
                {{ decimal(subject.kda, 2) }} ({{ percent(subject.killParticipation) }})
              </div>
            </div>
            <div class="min-w-18 text-center sm:min-w-22">
              <div class="text-base font-bold">{{ percent(damageShare) }}</div>
              <div class="text-xs opacity-65">
                {{ subject.totalDamageDealtToChampions.toLocaleString() }} {{ labels.damage }}
              </div>
            </div>
            <div class="hidden min-w-22 text-center sm:block">
              <div class="text-base font-bold">
                {{ subject.cs }} <span class="text-[11px] font-normal opacity-55">CS</span>
              </div>
              <div class="text-xs opacity-65">{{ decimal(csPerMinute) }} / min</div>
            </div>
          </div>
        </div>
        <div class="flex min-w-0 items-center gap-2">
          <div
            class="w-14 shrink-0 text-sm leading-none font-bold sm:w-17.5"
            :class="
              subject.win ? 'text-blue-600 dark:text-blue-300' : 'text-red-700 dark:text-red-300'
            "
          >
            {{ subject.win ? labels.victory : labels.defeat }}
          </div>
          <div class="flex min-w-0 flex-1 gap-0.5 overflow-hidden">
            <img
              v-for="(item, index) in subject.items.slice(0, 7)"
              :key="item + '-' + index"
              class="size-5 shrink-0 rounded"
              :src="api.assetUrl('item', item)"
              alt=""
            />
          </div>
        </div>
        <div class="flex min-w-0 text-xs opacity-65">
          <span class="truncate">{{ queueName(match.queueId, match.gameMode) }}</span>
          <span class="mx-1 opacity-45">·</span>
          <span>{{ duration(match.gameDuration) }}</span>
          <span class="mx-1 opacity-45">·</span>
          <span>{{ relativeDate(match.gameCreation, locale) }}</span>
        </div>
      </div>
      <div v-if="teams.length" class="my-1 hidden w-42 shrink-0 gap-2 xl:flex">
        <div
          v-for="team in teams"
          :key="team.id"
          class="flex min-w-0 flex-1 flex-col justify-between gap-0.5"
        >
          <div
            v-for="participant in team.players.slice(0, 5)"
            :key="participant.participantId"
            class="flex min-w-0 items-center gap-1"
          >
            <img
              class="size-4 shrink-0 rounded"
              :src="api.assetUrl('champion', participant.championId)"
              alt=""
            />
            <span
              class="truncate text-xs"
              :class="participant.puuid === subject?.puuid ? 'font-bold' : 'opacity-70'"
            >
              {{ participant.gameName }}
            </span>
          </div>
        </div>
      </div>
    </div>
    <NButton
      quaternary
      class="w-8 shrink-0 rounded-none! border-l border-black/10 dark:border-white/10"
      :aria-label="labels.details"
      @click="emit('open')"
    >
      ›
    </NButton>
    <div
      class="pointer-events-none absolute inset-0"
      :class="subject?.win ? 'shadow-win' : 'shadow-loss'"
    ></div>
  </article>
</template>

<script setup lang="ts">
import type { LanWebMatchDto, LanWebMatchParticipantDto } from '@shared/shards/lan-web'
import { NButton } from 'naive-ui'
import { computed } from 'vue'

import type { LanWebApiClient } from '../api'
import { decimal, duration, percent, queueName, relativeDate } from '../format'
import type { LanWebLabels } from '../labels'

const props = defineProps<{
  match: LanWebMatchDto
  api: LanWebApiClient
  labels: LanWebLabels
  locale: string
}>()
const emit = defineEmits<{ open: [] }>()
const subject = computed(() => props.match.subject)
const subjectTeamDamage = computed(() =>
  props.match.participants
    .filter((participant) => participant.teamIdentifier === subject.value?.teamIdentifier)
    .reduce((total, participant) => total + participant.totalDamageDealtToChampions, 0)
)
const damageShare = computed(() =>
  subjectTeamDamage.value
    ? (subject.value?.totalDamageDealtToChampions ?? 0) / subjectTeamDamage.value
    : 0
)
const csPerMinute = computed(() =>
  props.match.gameDuration ? (subject.value?.cs ?? 0) / (props.match.gameDuration / 60) : 0
)
const teams = computed(() => {
  const grouped = new Map<string, LanWebMatchParticipantDto[]>()
  for (const participant of props.match.participants) {
    const players = grouped.get(participant.teamIdentifier) ?? []
    players.push(participant)
    grouped.set(participant.teamIdentifier, players)
  }
  return [...grouped].map(([id, players]) => ({ id, players }))
})
</script>

<style scoped>
.shadow-win {
  box-shadow: inset 4px 0 10px rgb(37 99 235 / 0.12);
}

.shadow-loss {
  box-shadow: inset 4px 0 10px rgb(220 38 38 / 0.1);
}
</style>
