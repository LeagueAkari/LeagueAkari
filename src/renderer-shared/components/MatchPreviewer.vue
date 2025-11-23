<template>
  <NModal v-model:show="show">
    <div class="w-[840px]">
      <MatchCard
        v-if="summary"
        :summary="summary"
        :details="details"
        :puuid="puuid"
        :theme="as.colorTheme"
        is-expanded
        @navigate-to-summoner-by-puuid="emits('navigateToSummonerByPuuid', $event)"
      />
      <div v-else>没有数据</div>
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
import { NModal } from 'naive-ui'
import { computed, ref, shallowRef, watch } from 'vue'

import MatchCard from './match-card/MatchCard.vue'

const {
  gameId,
  summary: propSummary,
  details: propDetails,
  source,
  puuid
} = defineProps<{
  gameId: number
  source: 'sgp' | 'lcu'
  puuid?: string
  summary?: LcuOrSgpGameSummary // 如果提供了数据且和 gameId 一致，则优先使用 summary
  details?: LcuOrSgpGameDetails // 如果提供了数据且和 gameId 一致，则优先使用 details
}>()

const emits = defineEmits<{
  navigateToSummonerByPuuid: [puuid: string]
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

let controller = null as AbortController | null

const loadGameSummary = async (source: 'sgp' | 'lcu') => {
  if (_summary.value && _summary.value.gameId === gameId && _summary.value.source === source) {
    return
  }

  if (controller) {
    controller.abort()
  }

  controller = new AbortController()
  const signal = controller.signal

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

watch([() => show.value, () => sourceShouldUse.value], ([show, source]) => {
  if (!show) {
    return
  }

  // 走加载流程
  if (!propSummary || propSummary.gameId !== gameId || propSummary.source !== source) {
    loadGameSummary(source)
    return
  }

  controller?.abort()
  _summary.value = null
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
