<template>
  <MatchPreviewer
    v-model:show="show"
    :summary="summary"
    :details="details"
    :puuid="puuid"
    :hide-privacy="hidePrivacy"
    :can-dry-run-ongoing-game="canDryRunOngoingGame"
    :loading-summary="isLoadingGameSummary"
    :loading-details="isLoadingDetails"
    :shadowless="as.colorTheme === 'light'"
    @load-details="loadDetails($event.source)"
    @navigate-to-summoner-by-puuid="emits('navigateToSummonerByPuuid', $event)"
    @dry-run-ongoing-game="emits('dryRunOngoingGame', $event)"
  />
</template>

<script lang="ts" setup>
import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import type { LcuOrSgpGameDetails, LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import type { DraftOptions } from '@shared/shards/ongoing-game'
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'

import MatchPreviewer from './MatchPreviewer.vue'

const {
  gameId,
  summary: propSummary,
  details: propDetails,
  source,
  puuid,
  hidePrivacy = false,
  canDryRunOngoingGame = false
} = defineProps<{
  gameId: number
  source: 'sgp' | 'lcu'
  puuid?: string
  hidePrivacy?: boolean
  canDryRunOngoingGame?: boolean
  summary?: LcuOrSgpGameSummary
  details?: LcuOrSgpGameDetails
}>()

const emits = defineEmits<{
  navigateToSummonerByPuuid: [puuid: string]
  dryRunOngoingGame: [draft: DraftOptions]
}>()

const componentName = useComponentName()

const show = defineModel<boolean>('show', { default: false })

const leagueClient = useInstance(LeagueClientRenderer)
const sgp = useInstance(SgpRenderer)
const log = useInstance(LoggerRenderer)

const as = useAppCommonStore()
const sgps = useSgpStore()

const sourceShouldUse = computed(() => {
  if (sgps.availability.serversSupported.matchHistory && source === 'sgp') {
    return 'sgp'
  }

  return 'lcu'
})

const loadedSummary = shallowRef<LcuOrSgpGameSummary | null>(null)
const summary = computed(() => {
  if (
    propSummary &&
    propSummary.gameId === gameId &&
    propSummary.source === sourceShouldUse.value
  ) {
    return propSummary
  }

  return loadedSummary.value
})

const isLoadingGameSummary = ref(false)
const summaryController = shallowRef<AbortController | null>(null)

const loadGameSummary = async (source: 'sgp' | 'lcu') => {
  if (
    loadedSummary.value &&
    loadedSummary.value.gameId === gameId &&
    loadedSummary.value.source === source
  ) {
    return
  }

  if (summaryController.value) {
    summaryController.value.abort()
  }

  summaryController.value = new AbortController()
  const signal = summaryController.value.signal

  try {
    isLoadingGameSummary.value = true

    if (source === 'sgp') {
      const { data } = await sgp.api.matchHistoryQuery.getGameSummaryByGameId(gameId)
      loadedSummary.value = { gameId, source: 'sgp', data }
    } else {
      const { data } = await leagueClient.api.matchHistory.getGame(gameId)
      loadedSummary.value = { gameId, source: 'lcu', data }
    }
  } catch (error) {
    if (signal.aborted) {
      return
    }

    loadedSummary.value = null
    log.warn(componentName, error)
  } finally {
    isLoadingGameSummary.value = false
  }
}

const loadedDetails = shallowRef<LcuOrSgpGameDetails | null>(null)
const details = computed(() => {
  const currentSummary = summary.value

  if (
    propDetails &&
    currentSummary &&
    propDetails.gameId === currentSummary.gameId &&
    propDetails.source === currentSummary.source
  ) {
    return propDetails
  }

  return loadedDetails.value
})

const isLoadingDetails = ref(false)
const detailsController = shallowRef<AbortController | null>(null)

const loadDetails = async (source: 'sgp' | 'lcu') => {
  if (
    loadedDetails.value &&
    loadedDetails.value.gameId === gameId &&
    loadedDetails.value.source === source
  ) {
    return
  }

  if (detailsController.value) {
    detailsController.value.abort()
  }

  detailsController.value = new AbortController()
  const signal = detailsController.value.signal

  try {
    isLoadingDetails.value = true

    if (source === 'sgp') {
      const { data } = await sgp.api.matchHistoryQuery.getGameDetailsByGameId(gameId)
      loadedDetails.value = { gameId, source: 'sgp', data }
    } else {
      const { data } = await leagueClient.api.matchHistory.getTimeline(gameId)
      loadedDetails.value = { gameId, source: 'lcu', data }
    }
  } catch (error) {
    if (signal.aborted) {
      return
    }

    loadedDetails.value = null
    log.warn(componentName, error)
  } finally {
    isLoadingDetails.value = false
  }
}

watch([() => show.value, () => sourceShouldUse.value], ([show, source]) => {
  if (!show) {
    return
  }

  if (!propSummary || propSummary.gameId !== gameId || propSummary.source !== source) {
    loadGameSummary(source)
    return
  }

  summaryController.value?.abort()
  detailsController.value?.abort()
  loadedSummary.value = null
  loadedDetails.value = null
})

watch([() => summary.value, () => details.value], ([summary, details]) => {
  if (!details) {
    return
  }

  if (!summary || details.source !== summary.source || details.gameId !== summary.gameId) {
    loadedDetails.value = null
  }
})

onBeforeUnmount(() => {
  summaryController.value?.abort()
  detailsController.value?.abort()
})
</script>
