<template>
  <NModal
    v-model:show="show"
    :class="{
      'shadow-none!': as.colorTheme === 'light' /* 亮色模式下阴影会非常诡异 */
    }"
  >
    <div class="w-210 p-8">
      <MatchCard
        v-if="summary"
        :summary="summary"
        :details="details"
        :puuid="puuid"
        :theme="as.colorTheme"
        :loading-details="isLoadingDetails"
        :hide-privacy="hidePrivacy"
        :can-dry-run-ongoing-game="canDryRunOngoingGame"
        is-expanded
        @navigate-to-summoner-by-puuid="emits('navigateToSummonerByPuuid', $event)"
        @dry-run-ongoing-game="emits('dryRunOngoingGame', $event)"
        @load-details="loadDetails(summary?.source || 'lcu')"
      />
      <div
        class="flex h-50 w-210 items-center justify-center rounded border border-solid border-black/10 bg-neutral-100 dark:border-white/10 dark:bg-neutral-900"
        v-else
      >
        <template v-if="isLoadingGameSummary">
          <div class="flex items-center gap-2">
            <NSpin :size="16" />
            <span>{{ $t('MatchPreviewer.loading') }}</span>
          </div>
        </template>

        <template v-else>{{ $t('MatchPreviewer.noData') }}</template>
      </div>
    </div>
  </NModal>
</template>

<script lang="ts" setup>
import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { LcuOrSgpGameDetails, LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { DraftOptions } from '@shared/types/shards/ongoing-game'
import { NModal, NSpin } from 'naive-ui'
import { computed, ref, shallowRef, watch } from 'vue'

import MatchCard from './match-card/MatchCard.vue'

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
  summary?: LcuOrSgpGameSummary // 如果提供了数据且和 gameId 一致，则优先使用 summary
  details?: LcuOrSgpGameDetails // 如果提供了数据且和 gameId 一致，则优先使用 details
}>()

const emits = defineEmits<{
  navigateToSummonerByPuuid: [puuid: string]
  dryRunOngoingGame: [draft: DraftOptions]
}>()

const componentName = useComponentName()

const show = defineModel<boolean>('show', { default: false })

const lc = useInstance(LeagueClientRenderer)
const sgp = useInstance(SgpRenderer)
const log = useInstance(LoggerRenderer)

const as = useAppCommonStore()
const sgps = useSgpStore()

// 可以使用 sgp api 的时候，才会使用它
const sourceShouldUse = computed(() => {
  if (sgps.availability.serversSupported.matchHistory && source === 'sgp') {
    return 'sgp'
  }

  return 'lcu'
})

// 受控数据
const _summary = shallowRef<LcuOrSgpGameSummary | null>(null)
const summary = computed(() => {
  if (propSummary && propSummary.gameId === gameId && propSummary.source === source) {
    return propSummary
  }

  return _summary.value
})

const isLoadingGameSummary = ref(false)
const summaryController = shallowRef<AbortController | null>(null)

const loadGameSummary = async (source: 'sgp' | 'lcu') => {
  if (_summary.value && _summary.value.gameId === gameId && _summary.value.source === source) {
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
      _summary.value = { gameId, source: 'sgp', data }
    } else {
      const { data } = await lc.api.matchHistory.getGame(gameId)
      _summary.value = { gameId, source: 'lcu', data }
    }
  } catch (error) {
    if (signal.aborted) {
      return
    }

    _summary.value = null
    log.warn(componentName, error)
  } finally {
    isLoadingGameSummary.value = false
  }
}

const _details = shallowRef<LcuOrSgpGameDetails | null>(null)
const details = computed(() => {
  if (
    propDetails &&
    propSummary &&
    propDetails.gameId === propSummary.gameId &&
    propDetails.source === propSummary.source
  ) {
    return propDetails
  }

  return _details.value
})

const isLoadingDetails = ref(false)
const detailsController = shallowRef<AbortController | null>(null)

const loadDetails = async (source: 'sgp' | 'lcu') => {
  if (_details.value && _details.value.gameId === gameId && _details.value.source === source) {
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
      _details.value = { gameId, source: 'sgp', data }
    } else {
      const { data } = await lc.api.matchHistory.getTimeline(gameId)
      _details.value = { gameId, source: 'lcu', data }
    }
  } catch (error) {
    if (signal.aborted) {
      return
    }

    _details.value = null
    log.warn(componentName, error)
  } finally {
    isLoadingDetails.value = false
  }
}

watch([() => show.value, () => sourceShouldUse.value], ([show, source]) => {
  if (!show) {
    return
  }

  // 走加载流程
  if (!propSummary || propSummary.gameId !== gameId || propSummary.source !== source) {
    loadGameSummary(source)
    return
  }

  summaryController.value?.abort()
  detailsController.value?.abort()
  _summary.value = null
  _details.value = null
})

// 保证 details 严格对应 summary
watch([() => summary.value, () => details.value], ([summary, details]) => {
  if (!details) {
    return
  }

  if (!summary || details.source !== summary.source || details.gameId !== summary.gameId) {
    _details.value = null
  }
})
</script>
