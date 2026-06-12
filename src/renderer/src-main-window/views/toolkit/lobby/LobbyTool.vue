<template>
  <NCard size="small">
    <template #header>
      <span class="card-header-title">{{ t('LobbyTool.title') }}</span>
    </template>
    <ControlItem
      class="control-item-margin"
      :label="t('LobbyTool.createIdLobby.label')"
      :label-description="t('LobbyTool.createIdLobby.description')"
      :label-width="260"
    >
      <div style="display: flex; align-items: center; gap: 8px">
        <NSelect
          :placeholder="t('LobbyTool.createIdLobby.selectPlaceholder')"
          style="width: 180px"
          @update:show="handleLoadEligibleQueues"
          size="small"
          filterable
          :consistent-menu-width="false"
          tag
          v-model:value="queueLobbySettings.queueId"
          :options="queueOptions"
        ></NSelect>
        <NButton
          :disabled="
            lcs.connectionState !== 'connected' ||
            queueLobbySettings.queueId === null ||
            Number.isNaN(Number(queueLobbySettings.queueId))
          "
          @click="handleCreateQueueLobby"
          size="small"
          >{{ t('LobbyTool.createIdLobby.button') }}</NButton
        >
      </div>
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import type { QueueEligibility } from '@shared/types/league-client/lobby'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NSelect, useNotification } from 'naive-ui'
import { computed, reactive, shallowRef } from 'vue'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const lc = useInstance(LeagueClientRenderer)

const notification = useNotification()

const eligiblePartyQueues = shallowRef<QueueEligibility[]>([])
const eligibleSelfQueues = shallowRef<QueueEligibility[]>([])

const handleLoadEligibleQueues = async (show: boolean) => {
  if (show && lcs.connectionState === 'connected') {
    try {
      const { data: d1 } = await lc.api.lobby.getEligiblePartyQueues()
      const { data: d2 } = await lc.api.lobby.getEligibleSelfQueues()

      eligiblePartyQueues.value = d1
      eligibleSelfQueues.value = d2
    } catch (error) {
      notification.warning({
        title: () => t('LobbyTool.loadEligibleQueuesFailedNotification.title'),
        content: () =>
          t('LobbyTool.loadEligibleQueuesFailedNotification.description', {
            reason: (error as Error).message
          })
      })
    }
  }
}

const queueOptions = computed(() => {
  if (lcs.gameData.queues === null) {
    return []
  }

  const eligiblePartyMap = new Map(eligiblePartyQueues.value.map((q) => [q.queueId, q]))
  const eligibleSelfMap = new Map(eligibleSelfQueues.value.map((q) => [q.queueId, q]))

  const availableQueues: number[] = []
  const unavailableQueues: number[] = []

  for (const v of Object.values(lcs.gameData.queues)) {
    if (eligiblePartyMap.has(v.id) && eligibleSelfMap.has(v.id)) {
      availableQueues.push(v.id)
    } else {
      unavailableQueues.push(v.id)
    }
  }

  const options: any[] = []

  if (availableQueues.length > 0) {
    options.push({
      key: 'akari',
      label: t('LobbyTool.queueOptions.available'),
      type: 'group',
      children: availableQueues.map((k) => ({
        value: k,
        label: `${lcs.gameData.queues[k].name} (${k})`
      }))
    })
  }

  if (unavailableQueues.length > 0) {
    options.push({
      key: 'kyoko',
      label: t('LobbyTool.queueOptions.unavailable'),
      type: 'group',
      children: unavailableQueues.map((k) => ({
        value: k,
        label: `${lcs.gameData.queues[k].name} (${k})`
      }))
    })
  }

  return options
})

const queueLobbySettings = reactive({
  queueId: null as number | null
})

const handleCreateQueueLobby = async () => {
  if (!queueLobbySettings.queueId) {
    return
  }

  try {
    await lc.api.lobby.createQueueLobby(queueLobbySettings.queueId)
  } catch (error) {
    notification.warning({
      title: () => t('LobbyTool.createIdLobby.failedNotification.title'),
      content: () =>
        t('LobbyTool.createIdLobby.failedNotification.description', {
          reason: (error as Error).message
        })
    })
  }
}
</script>

<style scoped></style>
