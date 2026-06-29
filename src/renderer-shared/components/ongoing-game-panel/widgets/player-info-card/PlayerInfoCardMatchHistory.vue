<template>
  <div class="relative mt-1 flex h-0 flex-1 flex-col gap-0.5">
    <NVirtualList
      key-field="gameId"
      style="height: 100%"
      :item-size="36"
      :items="matches"
      v-if="matches.length"
    >
      <template #default="{ item, index }">
        <div
          :class="[
            'group relative mb-0.5 box-border flex h-8.5 cursor-pointer items-center rounded px-2 py-0.5 transition-[filter] hover:brightness-110',
            ogs.settings.showMatchHistoryItemBorder
              ? `border ${getMatchItemThemeClass(item).border}`
              : '',
            getMatchItemThemeClass(item).bg
          ]"
          :key="item.gameId"
          @click="previewGame({ summary: item.game, details: ogs.gameDetails[item.gameId], puuid })"
        >
          <div
            class="absolute right-0 bottom-0 text-[10px] opacity-0 transition-opacity group-hover:opacity-100"
            :class="getMatchItemThemeClass(item).resultText"
          >
            #{{ index + 1 }}
          </div>
          <ChampionIcon
            :champion-id="item.participant.championId"
            class="mr-1 h-6 w-6 rounded bg-[#4b5b7d]"
          />
          <div class="mr-1 w-25">
            <div
              class="overflow-hidden text-xs text-ellipsis whitespace-nowrap"
              :class="getMatchItemThemeClass(item).text"
            >
              {{ lcs.gameData.queues[item.basicInfo.queueId]?.name || item.basicInfo.queueId }}
            </div>
            <div class="text-[10px]" :class="getMatchItemThemeClass(item).text">
              {{ dayjs(item.basicInfo.gameCreation).format('MM-DD HH:mm') }}
              <span class="ml-1" :class="getMatchItemThemeClass(item).resultText">
                {{ getWinResultText(item) }}
              </span>
            </div>
          </div>
          <div class="text-xs" :class="getMatchItemThemeClass(item).text">
            {{ item.participant.kills }} / {{ item.participant.deaths }} /
            {{ item.participant.assists }}
          </div>
        </div>
      </template>
    </NVirtualList>

    <div
      v-if="matchHistoryLoadingState === 'loading'"
      class="pointer-events-none absolute inset-0 flex h-full w-full items-center justify-center gap-1 rounded text-xs text-black/60 dark:bg-white/5 dark:text-white/60"
    >
      <div class="flex items-center gap-1">
        <NSpin :size="16" />
        <span>{{ t('ongoingGame.playerCard.loadingMatchHistory') }}</span>
      </div>
    </div>

    <div
      v-else-if="matchHistoryLoadingState === 'error'"
      class="absolute inset-0 flex h-full w-full items-center justify-center gap-1 rounded text-xs text-orange-600 dark:bg-white/5 dark:text-orange-300"
    >
      <div class="flex flex-col items-center gap-2">
        <div>{{ t('ongoingGame.playerCard.errorLoadingMatchHistory') }}</div>

        <NButton size="tiny" @click="og.reloadPlayer(puuid)">
          {{ t('ongoingGame.playerCard.reloadMatchHistory') }}
        </NButton>
      </div>
    </div>

    <div
      v-else-if="matches.length === 0"
      class="pointer-events-none absolute inset-0 flex h-full w-full items-center justify-center rounded text-xs text-black/60 dark:bg-white/5 dark:text-white/60"
    >
      <div class="flex flex-col items-center gap-2">
        {{ t('ongoingGame.playerCard.empty') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { OngoingGameRenderer } from '@renderer-shared/shards/ongoing-game'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { MatchBasicInfo, toBasicInfo } from '@shared/data-adapter/match-history/match-basic'
import { MatchParticipant, toParticipants } from '@shared/data-adapter/match-history/participants'
import { formatI18nOrdinal } from '@shared/i18n'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { NButton, NSpin, NVirtualList } from 'naive-ui'
import { computed } from 'vue'

import { useOngoingGamePanel } from '../../context'

const { puuid } = defineProps<{
  puuid: string
}>()

const { t } = useTranslation()

const as = useAppCommonStore()
const lcs = useLeagueClientStore()
const ogs = useOngoingGameStore()
const og = useInstance(OngoingGameRenderer)
const { previewGame } = useOngoingGamePanel()

const matchHistoryData = computed(() => ogs.matchHistory[puuid]?.data)
const matchHistoryLoadingState = computed(() => ogs.matchHistoryLoadingState[puuid])

const getWinResultText = (match: { basicInfo: MatchBasicInfo; participant: MatchParticipant }) => {
  if (match.basicInfo.gameMode === 'PRACTICETOOL') {
    return t('ongoingGame.playerCard.matchHistory.winResult.na')
  }

  if (match.participant.winResult === 'abort') {
    return t('ongoingGame.playerCard.matchHistory.winResult.abort')
  }

  if (match.participant.winResult === 'remake') {
    return t('ongoingGame.playerCard.matchHistory.winResult.remake')
  }

  if (match.basicInfo.gameMode === 'CHERRY') {
    if (match.participant.subteamPlacement === 0) {
      return '?'
    }

    return formatI18nOrdinal(match.participant.subteamPlacement, as.settings.locale)
  }

  return match.participant.winResult === 'win'
    ? t('ongoingGame.playerCard.matchHistory.winResult.win')
    : t('ongoingGame.playerCard.matchHistory.winResult.loss')
}

const getMatchItemThemeClass = (match: {
  basicInfo: MatchBasicInfo
  participant: MatchParticipant
}) => {
  const isNeutral =
    match.basicInfo.gameMode === 'PRACTICETOOL' ||
    match.participant.winResult === 'abort' ||
    match.participant.winResult === 'remake'

  if (isNeutral) {
    return {
      bg: 'bg-[rgba(200,200,200,0.45)] dark:bg-[rgba(255,255,255,0.15)]',
      border: 'border-[rgba(200,200,200,1)] dark:border-[rgba(255,255,255,0.6)]',
      text: 'text-black dark:text-white',
      resultText: 'text-black dark:text-white/80'
    }
  }

  if (match.participant.winResult === 'win') {
    return {
      bg: 'bg-[rgba(96,165,250,0.35)] dark:bg-[rgba(59,130,246,0.25)]',
      border: 'border-[rgba(96,165,250,1)] dark:border-[rgba(59,130,246,0.6)]',
      text: 'text-black/80 dark:text-white/80',
      resultText: 'text-blue-600 dark:text-blue-300'
    }
  }

  return {
    bg: 'bg-[rgba(243,73,72,0.3)] dark:bg-[rgba(243,73,72,0.25)]',
    border: 'border-[rgba(243,73,72,1)] dark:border-[rgba(243,73,72,0.6)]',
    text: 'text-black/80 dark:text-white/80',
    resultText: 'text-red-700 dark:text-red-300'
  }
}

const matches = computed(() => {
  if (!matchHistoryData.value) {
    return []
  }

  return matchHistoryData.value
    .map((game) => {
      const basicInfo = toBasicInfo(game)
      const participant = toParticipants(game, basicInfo).find((p) => p.puuid === puuid)

      if (!participant) {
        return null
      }

      return {
        gameId: game.gameId,
        basicInfo,
        participant,
        game
      }
    })
    .filter((m) => m !== null)
})
</script>
