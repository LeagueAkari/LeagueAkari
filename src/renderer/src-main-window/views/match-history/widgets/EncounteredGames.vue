<template>
  <div class="encountered-games">
    <div class="header">
      <span class="title">{{ t('EncounteredGames.title') }} ({{ total }})</span>
      <div class="pagination" v-if="total > pageSize">
        <NButton quaternary size="tiny" :disabled="page === 1 || loading" @click="page--">
          <template #icon>
            <NIcon><ArrowLeftIcon /></NIcon>
          </template>
        </NButton>
        <span class="page-info"> {{ page }} / {{ Math.ceil(total / pageSize) }} </span>
        <NButton
          quaternary
          size="tiny"
          :disabled="page === Math.ceil(total / pageSize) || loading"
          @click="page++"
        >
          <template #icon>
            <NIcon><ArrowRightIcon /></NIcon>
          </template>
        </NButton>
      </div>
    </div>

    <div class="game-list" v-if="data.length > 0">
      <div
        class="game-item"
        v-for="{ game, gameId, recordId } in games"
        :key="gameId"
        @click="emits('previewGame', gameMap[gameId] || gameId)"
        @mousedown="handleMouseDown"
        @mouseup.prevent="handleMouseUp($event, gameMap[gameId] || gameId)"
      >
        <!-- flex flex-1 gap-1 flex-col -->
        <div style="display: flex; flex: 1; gap: 4px; flex-direction: column">
          <div class="game-item-line1" v-if="game">
            <div
              class="game-item-type"
              :class="{
                enemy: game.type === 'enemy',
                ally: game.type === 'ally'
              }"
              v-if="game.type"
            >
              {{
                game.type === 'enemy'
                  ? t('EncounteredGames.opponent')
                  : t('EncounteredGames.teammate')
              }}
            </div>
            <div class="game-item-title">
              {{ game.queueName }}
            </div>
            <div class="game-item-date" v-if="game.date">
              {{ dayjs(game.date).format('MM-DD') }}
              ({{ dayjs(game.date).locale(as.settings.locale.toLowerCase()).fromNow() }})
            </div>
          </div>
          <NSkeleton v-else :sharp="false" :height="16"></NSkeleton>
          <div v-if="game" class="game-item-line2">
            <template v-if="game.p1">
              <ChampionIcon
                :stretched="false"
                class="champion-icon"
                :champion-id="game?.p1.championId"
              />
              <div
                class="game-result"
                v-if="game.p1.placement"
                :class="{ win: game.p1.win, lose: !game.p1.win }"
              >
                {{ formatI18nOrdinal(game.p1.placement, as.settings.locale, true) }}
              </div>
              <div class="game-result" v-else :class="{ win: game.p1.win, lose: !game.p1.win }">
                {{ game.p1.win ? t('EncounteredGames.win') : t('EncounteredGames.lose') }}
              </div>
              <div class="kda">
                {{ game.p1.kda.join('/') }}
              </div>
            </template>
            <div class="space" v-if="game.p1 && game.p2" />
            <template v-if="game.p2">
              <ChampionIcon
                :stretched="false"
                class="champion-icon"
                :champion-id="game.p2.championId"
              />
              <div
                class="game-result"
                v-if="game.p2.placement"
                :class="{ win: game.p2.win, lose: !game.p2.win }"
              >
                {{ formatI18nOrdinal(game.p2.placement, as.settings.locale, true) }}
              </div>
              <div class="game-result" v-else :class="{ win: game.p2.win, lose: !game.p2.win }">
                {{ game.p2.win ? t('EncounteredGames.win') : t('EncounteredGames.lose') }}
              </div>
              <div class="kda">
                {{ game.p2.kda.join('/') }}
              </div>
            </template>
          </div>
          <NSkeleton v-else :sharp="false" :height="20"></NSkeleton>
        </div>
        <NPopconfirm
          :positive-button-props="{
            type: 'warning',
            size: 'tiny'
          }"
          :negative-button-props="{
            size: 'tiny'
          }"
          @positive-click="emits('deleteRecord', recordId)"
        >
          <template #trigger>
            <NButton
              class="game-item-delete"
              size="tiny"
              quaternary
              :focusable="false"
              @click.stop
              @mouseup.stop
            >
              <template #icon>
                <NIcon><DeleteIcon /></NIcon>
              </template>
            </NButton>
          </template>
          {{ t('EncounteredGames.deletePopconfirm') }}
        </NPopconfirm>
      </div>
    </div>

    <div class="placeholder" v-else>
      <span class="placeholder-text">{{ t('EncounteredGames.noData') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { formatI18nOrdinal } from '@shared/i18n'
import { Game } from '@shared/types/league-client/match-history'
import { ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon } from '@vicons/carbon'
import { Delete as DeleteIcon } from '@vicons/carbon'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NPopconfirm, NSkeleton } from 'naive-ui'
import { computed, markRaw, reactive, watch } from 'vue'

import {
  EncounteredGame,
  useMatchHistoryTabsStore
} from '@main-window/shards/match-history-tabs/store'

const { t } = useTranslation()

const NAMESPACE = 'component:EncounteredGames'

const log = useInstance(LoggerRenderer)
const lc = useInstance(LeagueClientRenderer)
const sgp = useInstance(SgpRenderer)

const as = useAppCommonStore()
const lcs = useLeagueClientStore()
const mhs = useMatchHistoryTabsStore()
const sgps = useSgpStore()

const {
  data = [],
  pageSize = 20,
  total = 0,
  loading = false
} = defineProps<{
  data?: EncounteredGame[]
  page?: number
  pageSize?: number
  total?: number
  loading?: boolean
}>()

const page = defineModel<number>('page', { default: 1 })

const gameMap = reactive<Record<number, Game>>({})

const loadPageGames = async (games: EncounteredGame[]) => {
  const task = async (gameId: number) => {
    try {
      if (mhs.settings.matchHistoryUseSgpApi && sgps.availability.serversSupported.matchHistory) {
        // use SGP API
        const cached = mhs.detailedGameLruMap.get(`sgp:${gameId}`)

        if (cached) {
          gameMap[cached.gameId] = markRaw(cached)
          return
        }

        const data = await sgp.getGameSummaryLcuFormat(gameId, sgps.availability.sgpServerId)
        gameMap[gameId] = markRaw(data)

        mhs.detailedGameLruMap.set(`sgp:${gameId}`, markRaw(data))
      } else {
        // use LCU API
        const cached = mhs.detailedGameLruMap.get(`lcu:${gameId}`)

        if (cached) {
          gameMap[cached.gameId] = markRaw(cached)
          return
        }

        const { data } = await lc.api.matchHistory.getGame(gameId)
        gameMap[gameId] = markRaw(data)

        mhs.detailedGameLruMap.set(`lcu:${gameId}`, markRaw(data))
      }
    } catch (error) {
      log.error(NAMESPACE, error)
    }
  }

  await Promise.all(games.map((g) => task(g.gameId)))
}

const games = computed(() => {
  return data.map((g) => {
    const game = gameMap[g.gameId]

    if (!game) {
      return {
        recordId: g.id,
        gameId: g.gameId,
        game: null
      }
    }

    const p1 = game.participantIdentities.find((p) => p.player.puuid === g.selfPuuid)
    const p2 = game.participantIdentities.find((p) => p.player.puuid === g.puuid)

    const d1 = game.participants.find((p) => p.participantId === p1?.participantId)
    const d2 = game.participants.find((p) => p.participantId === p2?.participantId)

    let type = 'ally'
    if (game.gameMode === 'CHERRY') {
      type = d1?.stats.subteamPlacement === d2?.stats.subteamPlacement ? 'ally' : 'enemy'
    } else {
      type = d1?.teamId === d2?.teamId ? 'ally' : 'enemy'
    }

    return {
      recordId: g.id,
      gameId: g.gameId,
      game: {
        queueName: lcs.gameData.queues[game.queueId]?.name || game.queueId,
        date: game.gameCreation,
        type: type,
        p1: d1
          ? {
              championId: d1.championId,
              kda: [d1.stats.kills, d1.stats.deaths, d1.stats.assists] as const,
              placement: d1.stats.subteamPlacement, // if not cherry it was 0
              win: d1.stats.win
            }
          : null,
        p2: d2
          ? {
              championId: d2.championId,
              kda: [d2.stats.kills, d2.stats.deaths, d2.stats.assists] as const,
              placement: d2.stats.subteamPlacement,
              win: d2.stats.win
            }
          : null
      }
    }
  })
})

watch(
  () => data,
  (newVal) => {
    loadPageGames(newVal)
  },
  { immediate: true }
)

const handleMouseDown = (event: MouseEvent) => {
  if (event.button === 1) {
    event.preventDefault()
  }
}

const handleMouseUp = (event: MouseEvent, game: Game | number) => {
  if (event.button === 1) {
    emits('previewGame', game, true)
  }
}

const emits = defineEmits<{
  deleteRecord: [recordId: number]
  previewGame: [game: Game | number, forceModal?: boolean]
}>()
</script>

<style lang="less" scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;

  .title {
    font-size: 16px;
    font-weight: bold;
  }

  .pagination {
    display: flex;
    align-items: center;
    gap: 4px;

    .page-info {
      font-size: 11px;
      color: #fffb;
    }
  }
}

.game-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.game-item {
  display: flex;
  align-items: center;
  border-radius: 2px;
  cursor: pointer;
  gap: 4px;

  .game-item-line1 {
    height: 16px;
    display: flex;
    align-items: flex-end;
    gap: 4px;
  }

  .game-item-line2 {
    display: flex;
    align-items: flex-end;
    gap: 4px;
  }

  .game-item-type {
    font-size: 12px;
    font-weight: bold;

    &.enemy {
      color: rgba(255, 159, 159, 0.8);
    }

    &.ally {
      color: rgba(184, 255, 188, 0.8);
    }
  }

  .game-item-title {
    flex: 1;
    width: 0;
    font-size: 12px;
    color: #ffff;
    font-weight: bold;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .game-item-date {
    font-size: 11px;
    color: #fffb;
    margin-left: auto;
  }

  .game-item-delete {
    margin-left: auto;
  }

  .space {
    flex: 1;
  }

  .champion-icon {
    width: 20px;
    height: 20px;
  }

  .game-result {
    font-size: 11px;
    color: #fffb;
    font-weight: bold;

    &.win {
      color: hsl(100, 80%, 45%);
    }

    &.lose {
      color: hsl(0, 80%, 70%);
    }
  }

  .kda {
    font-size: 11px;
    color: #fffb;
  }
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  font-size: 12px;
  color: #fffb;
}
</style>
