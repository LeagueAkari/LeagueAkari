<template>
  <div class="relative box-border flex h-full flex-col items-center justify-center p-3">
    <div class="flex flex-1 flex-col items-center justify-center">
      <LcuImage
        v-if="lcs.gameflow.session?.map?.assets?.['game-select-icon-hover']"
        class="mb-4 h-16 w-16"
        :src="lcs.gameflow.session?.map?.assets?.['game-select-icon-hover']"
      />

      <template v-if="lcs.gameflow.phase === 'ReadyCheck'">
        <template v-if="agfs.willAcceptAt > 0">
          <span class="mb-2 text-base font-bold text-gray-900 dark:text-gray-100">{{
            t('Lounge.autoAccept.acceptIn', { seconds: willAcceptIn.toFixed(1) })
          }}</span>
          <NButton type="primary" secondary size="tiny" @click="() => handleCancelAutoAccept()">{{
            t('Lounge.autoAccept.cancelButton')
          }}</NButton>
        </template>
        <template v-else-if="lcs.matchmaking.readyCheck?.playerResponse === 'Accepted'">
          <span class="mb-2 text-base font-bold text-gray-900 dark:text-gray-100">{{
            t('Lounge.autoAccept.accepted')
          }}</span>
          <span class="mb-2 text-[13px] text-gray-500 dark:text-gray-400">{{
            t('Lounge.autoAccept.subtitle1')
          }}</span>
          <NButton type="warning" secondary size="tiny" @click="() => handleDecline()">{{
            t('Lounge.autoAccept.declineButton')
          }}</NButton>
        </template>

        <template v-else-if="lcs.matchmaking.readyCheck?.playerResponse === 'Declined'">
          <span class="mb-2 text-base font-bold text-gray-900 dark:text-gray-100">{{
            t('Lounge.autoAccept.declined')
          }}</span>
          <span class="mb-2 text-[13px] text-gray-500 dark:text-gray-400">{{
            t('Lounge.autoAccept.subtitle2')
          }}</span>
          <NButton type="primary" secondary size="tiny" @click="() => handleAccept()">{{
            t('Lounge.autoAccept.acceptButton')
          }}</NButton>
        </template>
        <template v-else>
          <span class="mb-2 text-base font-bold text-gray-900 dark:text-gray-100">{{
            t('Lounge.autoAccept.pending')
          }}</span>
          <div class="flex gap-1">
            <NButton type="primary" secondary size="tiny" @click="() => handleAccept()">{{
              t('Lounge.autoAccept.acceptButton')
            }}</NButton>
            <NButton type="warning" secondary size="tiny" @click="() => handleDecline()">{{
              t('Lounge.autoAccept.declineButton')
            }}</NButton>
          </div>
        </template>
      </template>

      <template v-else-if="lcs.gameflow.phase === 'Matchmaking'">
        <span class="mb-2 text-base font-bold text-gray-900 dark:text-gray-100">{{
          t('Lounge.matchmaking.searching')
        }}</span>
        <span
          class="mb-2 text-[13px] text-gray-500 dark:text-gray-400"
          v-if="lcs.matchmaking.search"
          >{{ formatMatchmakingSearchText(lcs.matchmaking.search) }}</span
        >
        <NButton
          :loading="isCancelingSearching"
          type="warning"
          secondary
          size="tiny"
          @click="() => handleCancelSearching()"
          ><template v-if="agfs.settings.autoMatchmakingEnabled">{{
            t('Lounge.matchmaking.stopAndDisable')
          }}</template
          ><template v-else>{{ t('Lounge.matchmaking.stop') }}</template></NButton
        >
      </template>
      <template v-else-if="agfs.willSearchMatch">
        <span class="mb-2 text-base font-bold text-gray-900 dark:text-gray-100">
          {{
            t('Lounge.matchmaking.searchIn', {
              seconds: willSearchMatchIn.toFixed(1)
            })
          }}
        </span>
        <NButton
          type="primary"
          secondary
          size="tiny"
          @click="() => handleCancelAutoSearchMatch()"
          >{{ t('Lounge.matchmaking.cancel') }}</NButton
        >
      </template>

      <template v-else>
        <span
          class="mb-2 block max-w-[280px] overflow-hidden text-base font-bold text-ellipsis whitespace-nowrap text-gray-900 dark:text-gray-100"
          :title="`${lcs.gameflow.session?.gameData.queue.name || t('Lounge.gameMode')} · ${lcs.gameflow.session?.map.name || t('Lounge.map')}`"
          >{{ formatMapModeText() }}</span
        >
        <template v-if="agfs.settings.autoMatchmakingEnabled">
          <span class="mb-2 text-[13px] text-gray-500 dark:text-gray-400" v-if="penaltyTime">{{
            t('Lounge.matchmaking.waitingForPenalty', {
              seconds: penaltyTime.toFixed()
            })
          }}</span>
          <span
            class="mb-2 text-[13px] text-gray-500 dark:text-gray-400"
            v-else-if="agfs.activityStartStatus === 'insufficient-members'"
          >
            {{
              t('Lounge.matchmaking.waitingForMembers', {
                countV: agfs.settings.autoMatchmakingMinimumMembers
              })
            }}
          </span>
          <span
            class="mb-2 text-[13px] text-gray-500 dark:text-gray-400"
            v-else-if="agfs.activityStartStatus === 'waiting-for-invitees'"
            >{{ t('Lounge.matchmaking.waitingForInvitees') }}</span
          >
          <span
            class="mb-2 text-[13px] text-gray-500 dark:text-gray-400"
            v-else-if="agfs.activityStartStatus === 'cancelled-after-champ-select'"
            >{{ t('Lounge.matchmaking.cancelledAfterChampSelect') }}</span
          >
        </template>
      </template>
    </div>

    <div class="w-full">
      <LoungeOperations />
    </div>
  </div>
</template>

<script setup lang="ts">
import LoungeOperations from '@aux-window/components/LoungeOperations.vue'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useInstance } from '@renderer-shared/shards'
import { AutoGameflowRenderer } from '@renderer-shared/shards/auto-gameflow'
import { useAutoGameflowStore } from '@renderer-shared/shards/auto-gameflow/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { GetSearch } from '@shared/types/league-client/matchmaking'
import { useIntervalFn } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { NButton } from 'naive-ui'
import { computed, ref, watch } from 'vue'

const { t } = useTranslation()

const agfs = useAutoGameflowStore()
const lcs = useLeagueClientStore()

const agf = useInstance(AutoGameflowRenderer)
const lc = useInstance(LeagueClientRenderer)

const willAcceptIn = ref(0)
const { pause: pauseAC, resume: resumeAC } = useIntervalFn(
  () => {
    const s = (agfs.willAcceptAt - Date.now()) / 1e3
    willAcceptIn.value = Math.abs(Math.max(s, 0))
  },
  100,
  { immediate: false, immediateCallback: true }
)

const willSearchMatchIn = ref(0)
const { pause: pauseAS, resume: resumeAS } = useIntervalFn(
  () => {
    const s = (agfs.willSearchMatchAt - Date.now()) / 1e3
    willSearchMatchIn.value = Math.abs(Math.max(s, 0))
  },
  100,
  { immediate: false, immediateCallback: true }
)

const handleAccept = () => lc.api.matchmaking.accept()

const handleDecline = () => lc.api.matchmaking.decline()

const handleCancelAutoAccept = () => agf.cancelAutoAccept()

const handleCancelAutoSearchMatch = async () => {
  await agf.setAutoMatchmakingEnabled(false)
  agf.cancelAutoMatchmaking()
}

const isCancelingSearching = ref(false)
const handleCancelSearching = async () => {
  if (isCancelingSearching.value) {
    return
  }

  try {
    isCancelingSearching.value = true
    await lc.api.lobby.deleteSearchMatch()
  } finally {
    isCancelingSearching.value = false
  }

  agf.setAutoMatchmakingEnabled(false)
}

const penaltyTime = computed(() => {
  if (!lcs.matchmaking.search) {
    return null
  }

  const errors = lcs.matchmaking.search.errors

  if (!errors.length) {
    return null
  }

  const maxPenaltyTime = errors.reduce(
    (prev, cur) => Math.max(cur.penaltyTimeRemaining, prev),
    -Infinity
  )

  return maxPenaltyTime
})

watch(
  () => agfs.willAcceptAt,
  (at) => {
    if (at > 0) {
      resumeAC()
    } else {
      pauseAC()
    }
  },
  { immediate: true }
)

watch(
  () => agfs.willSearchMatch,
  (ok) => {
    if (ok) {
      resumeAS()
    } else {
      pauseAS()
    }
  },
  { immediate: true }
)

const formatMapModeText = () => {
  const gameModeName = lcs.gameflow.session?.gameData.queue.name || t('Lounge.gameMode')
  const mapName = lcs.gameflow.session?.map.name || t('Lounge.map')

  if (gameModeName === mapName) {
    return gameModeName
  }

  return `${gameModeName} · ${mapName}`
}

const formatNumber = (num: number, precision = 1) => {
  let formatted = num.toFixed(precision)
  formatted = formatted.replace(/(\.\d*?)0+$/, '$1')
  return formatted.replace(/\.$/, '')
}

const formatMatchmakingSearchText = (search: GetSearch) => {
  if (search.lowPriorityData && search.lowPriorityData.penaltyTime) {
    return `${t('Lounge.wait')} ${formatNumber(search.lowPriorityData.penaltyTimeRemaining)} s (${formatNumber(search.lowPriorityData.penaltyTime)} s) `
  }

  if (agfs.settings.autoMatchmakingRematchStrategy === 'fixed-duration') {
    return `${search.timeInQueue.toFixed(1)} s (${t('Lounge.atMost')} ${agfs.settings.autoMatchmakingRematchFixedDuration.toFixed()} s) / ${search.estimatedQueueTime.toFixed(1)} s`
  }

  return `${search.timeInQueue.toFixed(1)} s / ${search.estimatedQueueTime.toFixed(1)} s`
}
</script>

<style scoped></style>
