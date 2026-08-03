<template>
  <NModal
    :show="show"
    preset="card"
    :title="labels.details"
    class="w-[min(960px,calc(100vw-24px))]"
    @update:show="emit('update:show', $event)"
  >
    <NSpin :show="loading">
      <div v-if="match" class="space-y-4">
        <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm opacity-65">
          <span>{{ match.gameMode }}</span
          ><span>{{ duration(match.gameDuration) }}</span
          ><span>#{{ match.gameId }}</span>
        </div>
        <section v-for="team in teams" :key="team[0]" class="space-y-2">
          <h3 class="font-semibold">{{ labels.team }} {{ team[0] }}</h3>
          <div class="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
            <div
              v-for="player in team[1]"
              :key="player.participantId"
              class="grid min-w-[720px] grid-cols-[minmax(190px,1fr)_90px_90px_100px_100px] items-center gap-3 border-b border-black/10 px-3 py-2 last:border-b-0 dark:border-white/10"
            >
              <div class="flex min-w-0 items-center gap-2">
                <img
                  class="size-9 rounded"
                  :src="api.assetUrl('champion', player.championId)"
                  alt=""
                />
                <div class="min-w-0">
                  <div class="truncate text-sm font-medium">
                    {{ player.gameName }}<span class="opacity-50">#{{ player.tagLine }}</span>
                  </div>
                  <div class="text-xs opacity-55">
                    {{ player.position || '—' }} · Lv.{{ player.level }}
                  </div>
                </div>
              </div>
              <div class="text-sm tabular-nums">
                {{ player.kills }}/{{ player.deaths }}/{{ player.assists }}
              </div>
              <div class="text-sm tabular-nums">{{ player.cs }} CS</div>
              <div class="text-sm tabular-nums">
                {{ player.goldEarned.toLocaleString() }} {{ labels.gold }}
              </div>
              <div class="text-sm tabular-nums">
                {{ player.totalDamageDealtToChampions.toLocaleString() }} {{ labels.damage }}
              </div>
            </div>
          </div>
        </section>
      </div>
    </NSpin>
  </NModal>
</template>

<script setup lang="ts">
import type { LanWebMatchDto } from '@shared/shards/lan-web'
import { NModal, NSpin } from 'naive-ui'
import { computed } from 'vue'

import type { LanWebApiClient } from '../api'
import { duration } from '../format'
import type { LanWebLabels } from '../labels'

const props = defineProps<{
  show: boolean
  match: LanWebMatchDto | null
  loading: boolean
  api: LanWebApiClient
  labels: LanWebLabels
}>()
const emit = defineEmits<{ 'update:show': [value: boolean] }>()
const teams = computed(() => {
  const grouped = new Map<string, LanWebMatchDto['participants']>()
  for (const player of props.match?.participants || []) {
    const list = grouped.get(player.teamIdentifier) || []
    list.push(player)
    grouped.set(player.teamIdentifier, list)
  }
  return [...grouped.entries()]
})
</script>
