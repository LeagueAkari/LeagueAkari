<template>
  <div class="rounded bg-black/5 px-4 py-2 dark:bg-white/5" v-if="players.length">
    <div class="mb-3 text-base font-bold text-gray-900 dark:text-white">
      {{
        side === 'ally'
          ? t('PlayerTab.recentPlayers.teammatesTitle')
          : t('PlayerTab.recentPlayers.opponentsTitle')
      }}
    </div>
    <div class="flex flex-col gap-1">
      <div class="flex items-center" v-for="(p, index) of players" :key="p.targetPuuid">
        <LcuImage class="size-4.5 rounded-sm" :src="profileIconUri(p.targetProfileIconId)" />
        <div
          class="group flex cursor-pointer items-end"
          @click="() => navigateToSummonerByPuuid(p.targetPuuid, true)"
          @mouseup.prevent="(event) => handleMouseUp(event, p.targetPuuid)"
          @mousedown="handleMouseDown"
        >
          <StreamerModeMaskedText>
            <template #masked>
              <span
                class="ml-1 max-w-30 truncate text-xs text-gray-900 transition-all group-hover:brightness-125 dark:text-white"
              >
                {{ maskedSummonerName(p.targetPuuid, index) }}
              </span>
            </template>
            <span
              class="ml-1 max-w-30 truncate text-xs text-gray-900 transition-all group-hover:brightness-125 dark:text-white"
            >
              {{ p.targetGameName }}
            </span>
            <span
              class="ml-0.5 text-[11px] text-gray-500 transition-all group-hover:brightness-125 dark:text-gray-400"
            >
              #{{ p.targetTagLine }}
            </span>
          </StreamerModeMaskedText>
        </div>
        <span class="ml-auto text-xs text-gray-500 dark:text-gray-400">
          {{ p.win }} {{ t('PlayerTab.recentPlayers.win') }} {{ p.lose }}
          {{ t('PlayerTab.recentPlayers.lose') }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import StreamerModeMaskedText from '@renderer-shared/components/StreamerModeMaskedText.vue'
import { useStreamerModeMaskedText } from '@renderer-shared/composables/useStreamerModeMaskedText'
import { profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

import { usePlayerTab } from '../context'
import { useMatchHistory } from '../data/match-history'

const RECENTLY_PLAYED_PLAYER_THRESHOLD = 2

const props = defineProps<{
  side?: 'enemy' | 'ally'
}>()

const { t } = useTranslation()

const { navigateToSummonerByPuuid } = usePlayerTab()
const { relationship } = useMatchHistory()
const { summonerName: maskedSummonerName } = useStreamerModeMaskedText()

const players = computed(() => {
  const isOpponent = props.side === 'enemy'

  return Object.values(relationship.value)
    .map((a) => {
      const filteredGames = a.games.filter((g) => g.isOpponent === isOpponent)
      return { ...a, games: filteredGames }
    })
    .filter((a) => a.games.length >= RECENTLY_PLAYED_PLAYER_THRESHOLD)
    .map((a) => {
      const win = a.games.filter((g) => (isOpponent ? !g.win : g.win)).length
      const lose = a.games.filter((g) => (isOpponent ? g.win : !g.win)).length
      return { ...a, win, lose }
    })
    .sort((a, b) => {
      if (a.games.length !== b.games.length) {
        return b.games.length - a.games.length
      }
      return b.win - a.win
    })
})

const handleMouseDown = (event: MouseEvent) => {
  if (event.button === 1) {
    event.preventDefault()
  }
}

const handleMouseUp = (event: MouseEvent, puuid: string) => {
  if (event.button === 1) {
    navigateToSummonerByPuuid(puuid, false)
  }
}
</script>
