<template>
  <ChampionBench
    v-if="session?.benchEnabled"
    :current-champion-id="lcs.champSelect.currentChampion || null"
    :champions="champions"
    :subset="personalChampions"
    :selecting="isSelecting"
    @select="handleSelect"
  />
</template>

<script setup lang="ts">
import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { useTranslation } from 'i18next-vue'
import { useMessage } from 'naive-ui'
import { computed, ref } from 'vue'

import ChampionBench from './ChampionBench.vue'
import type { BenchChampionOption } from './types'

const { t } = useTranslation()
const message = useMessage()
const componentName = useComponentName()

const lcs = useLeagueClientStore()
const lc = useInstance(LeagueClientRenderer)
const logger = useInstance(LoggerRenderer)

const isSelecting = ref(false)

const session = computed(() => lcs.champSelect.session)
const phase = computed(() => session.value?.timer.phase)
const subset = computed(() => lcs.lobbyTeamBuilder.champSelect.subsetChampionList)

const pendingCardPick = computed(() => {
  const current = session.value
  if (!current?.allowSubsetChampionPicks || phase.value !== 'BAN_PICK') {
    return
  }

  return current.actions
    .flat()
    .find(
      (action) =>
        action.actorCellId === current.localPlayerCellId &&
        action.type === 'pick' &&
        !action.completed
    )
})

const canUseBench = computed(() => {
  if (!session.value?.benchEnabled) {
    return false
  }

  return (
    phase.value === 'FINALIZATION' ||
    (session.value.allowSubsetChampionPicks && phase.value === 'BAN_PICK')
  )
})

const availability = (championId: number): BenchChampionOption['availability'] => {
  if (!lcs.champSelect.currentPickableChampionIds.has(championId)) {
    return 'locked'
  }

  if (!canUseBench.value || (phase.value === 'BAN_PICK' && !subset.value.includes(championId))) {
    return 'waiting'
  }

  return 'available'
}

const toOption = (championId: number): BenchChampionOption => ({
  championId,
  availability: availability(championId)
})

const personalIds = computed(() => (pendingCardPick.value ? subset.value : []))
const personalChampions = computed(() => personalIds.value.map(toOption))

const champions = computed(() => {
  const bench = session.value?.benchChampions ?? []

  return bench
    .filter(({ championId }) => !personalIds.value.includes(championId))
    .map(({ championId }) => toOption(championId))
})

const handleSelect = async (championId: number, complete: boolean) => {
  if (isSelecting.value || availability(championId) !== 'available') {
    return
  }

  isSelecting.value = true

  try {
    if (pendingCardPick.value) {
      await lc.api.champSelect.pickOrBan(championId, complete, 'pick', pendingCardPick.value.id)
    } else {
      await lc.api.champSelect.benchSwap(championId)
    }
  } catch (error: any) {
    logger.warn(componentName, 'Failed to swap or pick champion', error)
    message.warning(t('activity.championBench.swapFailed', { reason: error.message }))
  } finally {
    isSelecting.value = false
  }
}
</script>
