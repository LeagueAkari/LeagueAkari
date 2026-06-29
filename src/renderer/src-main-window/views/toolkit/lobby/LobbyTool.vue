<template>
  <SettingsSection :title="t('toolkit.lobby.title')">
    <SettingsRow
      :label="t('toolkit.lobby.createIdLobby.label')"
      :label-description="t('toolkit.lobby.createIdLobby.description')"
      :label-width="260"
    >
      <div class="flex max-w-full items-center gap-2">
        <NSelect
          :placeholder="t('toolkit.lobby.createIdLobby.selectPlaceholder')"
          class="w-45!"
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
            !lcs.isConnected ||
            queueLobbySettings.queueId === null ||
            Number.isNaN(Number(queueLobbySettings.queueId))
          "
          @click="handleCreateQueueLobby"
          size="small"
          >{{ t('toolkit.lobby.createIdLobby.button') }}</NButton
        >
      </div>
    </SettingsRow>
  </SettingsSection>
</template>

<script setup lang="ts">
import SettingsRow from '@renderer-shared/components/SettingsRow.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import type { QueueEligibility } from '@shared/types/league-client/lobby'
import { useTranslation } from 'i18next-vue'
import { NButton, NSelect, useNotification } from 'naive-ui'
import { computed, reactive, shallowRef } from 'vue'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const lc = useInstance(LeagueClientRenderer)

const notification = useNotification()

const eligiblePartyQueues = shallowRef<QueueEligibility[]>([])
const eligibleSelfQueues = shallowRef<QueueEligibility[]>([])

const handleLoadEligibleQueues = async (show: boolean) => {
  if (show && lcs.isConnected) {
    try {
      const { data: d1 } = await lc.api.lobby.getEligiblePartyQueues()
      const { data: d2 } = await lc.api.lobby.getEligibleSelfQueues()

      eligiblePartyQueues.value = d1
      eligibleSelfQueues.value = d2
    } catch (error) {
      notification.warning({
        title: () => t('toolkit.lobby.loadEligibleQueuesFailedNotification.title'),
        content: () =>
          t('toolkit.lobby.loadEligibleQueuesFailedNotification.description', {
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
      label: t('toolkit.lobby.queueOptions.available'),
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
      label: t('toolkit.lobby.queueOptions.unavailable'),
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
      title: () => t('toolkit.lobby.createIdLobby.failedNotification.title'),
      content: () =>
        t('toolkit.lobby.createIdLobby.failedNotification.description', {
          reason: (error as Error).message
        })
    })
  }
}
</script>
