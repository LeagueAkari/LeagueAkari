<template>
  <div
    class="rounded bg-black/5 px-4 py-2 dark:bg-white/5"
    v-if="pagedGames && pagedGames.total > 0 && !isSelfTab"
  >
    <!-- Header Section -->
    <div class="mb-3 flex items-center justify-between">
      <span class="text-base font-bold text-gray-900 dark:text-white"
        >{{ t('EncounteredGames.title') }} ({{ pagedGames.total }})</span
      >

      <!-- Pagination Controls -->
      <div class="flex items-center gap-1" v-if="pagedGames.total > pagedGames.pageSize">
        <NButton
          quaternary
          size="tiny"
          :disabled="pagedGames.page === 1 || isLoading"
          @click="loadGames(pagedGames.page - 1)"
        >
          <template #icon>
            <NIcon><ArrowLeftIcon /></NIcon>
          </template>
        </NButton>

        <span class="text-[11px] text-gray-500 dark:text-white/70">
          {{ pagedGames.page }} /
          {{ Math.ceil(pagedGames.total / pagedGames.pageSize) }}
        </span>

        <NButton
          quaternary
          size="tiny"
          :disabled="
            pagedGames.page === Math.ceil(pagedGames.total / pagedGames.pageSize) || isLoading
          "
          @click="loadGames(pagedGames.page + 1)"
        >
          <template #icon>
            <NIcon><ArrowRightIcon /></NIcon>
          </template>
        </NButton>
      </div>
    </div>

    <!-- Game List Section -->
    <div class="flex flex-col gap-3" v-if="games.length > 0">
      <div
        class="flex cursor-pointer items-center gap-2 rounded-sm"
        v-for="{ game, gameId, recordId } in games"
        :key="gameId"
        @click="events.emit('focusGame', { summary: gameMap[gameId] || gameId })"
      >
        <div class="flex flex-1 flex-col gap-1">
          <!-- Game Info Line 1: Type, Queue, Date -->
          <div class="flex h-4 items-end gap-1" v-if="game">
            <div
              class="text-xs font-bold"
              :class="
                game.type === 'enemy'
                  ? 'text-red-600 dark:text-red-300'
                  : 'text-green-700 dark:text-green-300'
              "
              v-if="game.type"
            >
              {{
                game.type === 'enemy'
                  ? t('EncounteredGames.opponent')
                  : t('EncounteredGames.teammate')
              }}
            </div>

            <div class="w-0 flex-1 truncate text-xs font-bold text-black dark:text-white/80">
              {{ game.queueName }}
            </div>

            <div class="ml-auto text-[11px] text-gray-500 dark:text-white/70" v-if="game.date">
              {{ dayjs(game.date).format('MM-DD') }}
            </div>
          </div>
          <NSkeleton v-else :sharp="false" :height="16" />

          <!-- Game Info Line 2: Player Stats -->
          <div v-if="game" class="flex items-end gap-1">
            <!-- Player 1 (Self) -->
            <template v-if="game.p1">
              <ChampionIcon :stretched="false" class="h-5 w-5" :champion-id="game.p1.championId" />
              <div
                class="text-[11px] font-bold"
                :class="
                  game.p1.win
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-600 dark:text-red-300'
                "
              >
                {{
                  game.p1.placement
                    ? formatI18nOrdinal(game.p1.placement, as.settings.locale, true)
                    : game.p1.win
                      ? t('EncounteredGames.win')
                      : t('EncounteredGames.lose')
                }}
              </div>
              <div class="text-[11px] text-gray-500 dark:text-white/70">
                {{ game.p1.kda.join('/') }}
              </div>
            </template>

            <div class="flex-1" v-if="game.p1 && game.p2" />

            <!-- Player 2 (Encountered) -->
            <template v-if="game.p2">
              <ChampionIcon :stretched="false" class="h-5 w-5" :champion-id="game.p2.championId" />
              <div
                class="text-[11px] font-bold"
                :class="
                  game.p2.win
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-600 dark:text-red-300'
                "
              >
                {{
                  game.p2.placement
                    ? formatI18nOrdinal(game.p2.placement, as.settings.locale, true)
                    : game.p2.win
                      ? t('EncounteredGames.win')
                      : t('EncounteredGames.lose')
                }}
              </div>
              <div class="text-[11px] text-gray-500 dark:text-white/70">
                {{ game.p2.kda.join('/') }}
              </div>
            </template>
          </div>
          <NSkeleton v-else :sharp="false" :height="20" />
        </div>

        <!-- Delete Action -->
        <NPopconfirm
          :positive-button-props="{ type: 'warning', size: 'tiny' }"
          :negative-button-props="{ size: 'tiny' }"
          @positive-click="deleteGame(recordId)"
        >
          <template #trigger>
            <NButton size="tiny" quaternary :focusable="false" @click.stop>
              <template #icon>
                <NIcon><DeleteIcon /></NIcon>
              </template>
            </NButton>
          </template>
          {{ t('EncounteredGames.deletePopconfirm') }}
        </NPopconfirm>
      </div>
    </div>

    <!-- Empty State -->
    <div
      class="flex h-20 items-center justify-center text-xs text-gray-500 dark:text-white/70"
      v-else
    >
      <span>{{ t('EncounteredGames.noData') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { toBasicInfo } from '@shared/data-adapter/match-history/match-basic'
import { MatchParticipant, toParticipants } from '@shared/data-adapter/match-history/participants'
import { formatI18nOrdinal } from '@shared/i18n'
import {
  ArrowLeft as ArrowLeftIcon,
  ArrowRight as ArrowRightIcon,
  Delete as DeleteIcon
} from '@vicons/carbon'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NPopconfirm, NSkeleton } from 'naive-ui'
import { computed } from 'vue'

import { usePlayerTab } from '../context'
import { useEncounteredGames } from '../data/encountered-games'

const { t } = useTranslation()
const { events, isSelfTab } = usePlayerTab()
const { pagedGames, gameMap, isLoading, loadGames, deleteGame } = useEncounteredGames()

const as = useAppCommonStore()
const lcs = useLeagueClientStore()

const toPlayerStats = (p: MatchParticipant) => ({
  championId: p.championId,
  kda: [p.kills, p.deaths, p.assists] as const,
  placement: p.subteamPlacement, // 0 if not cherry
  win: p.win
})

const games = computed(() => {
  if (!pagedGames.value) {
    return []
  }

  return pagedGames.value.data
    .map((g) => {
      const game = gameMap[g.gameId]

      if (!game) {
        return { recordId: g.id, gameId: g.gameId, game: null }
      }

      const basicInfo = toBasicInfo(game)
      const participants = toParticipants(game, basicInfo)

      const p1 = participants.find((p) => p.puuid === g.selfPuuid)
      const p2 = participants.find((p) => p.puuid === g.puuid)

      if (!p1 || !p2) {
        return null
      }

      return {
        recordId: g.id,
        gameId: g.gameId,
        game: {
          queueName: lcs.gameData.queueName(basicInfo.queueId),
          date: basicInfo.gameCreation,
          type: p1.teamIdentifier === p2.teamIdentifier ? 'ally' : 'enemy',
          p1: toPlayerStats(p1),
          p2: toPlayerStats(p2)
        }
      }
    })
    .filter((g) => g !== null)
})
</script>
