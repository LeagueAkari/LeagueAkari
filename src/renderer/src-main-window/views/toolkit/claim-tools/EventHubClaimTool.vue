<template>
  <SettingsSection
    :title="t('toolkit.claim.eventHub.title')"
    :footer="t('toolkit.claim.eventHub.hint')"
  >
    <div class="p-3">
      <div class="mb-2 flex flex-wrap gap-1">
        <NButton
          :disabled="isLoading || !selectedEventIds.length || !lcs.isConnected"
          size="small"
          type="primary"
          secondary
          @click="claim"
        >
          <template v-if="selectedEventIds.length">{{
            t('toolkit.claim.eventHub.claimButtonC', { count: selectedEventIds.length })
          }}</template>
          <template v-else>
            {{ t('toolkit.claim.eventHub.claimButton') }}
          </template>
        </NButton>
        <NButton
          v-show="isClaiming"
          size="small"
          type="warning"
          secondary
          @click="isClaiming = false"
        >
          {{ t('toolkit.claim.eventHub.cancelButton') }}
        </NButton>
        <NButton
          :disabled="isLoading || !lcs.isConnected"
          size="small"
          secondary
          @click="updateClaimableEventHubEvents(true)"
        >
          {{ t('toolkit.claim.eventHub.refreshButton') }}
        </NButton>
      </div>
      <NDataTable
        :theme-overrides="dataTableThemeOverrides"
        :loading="isLoading"
        size="small"
        :columns="columns"
        :data="events"
        :row-key="(row) => row.eventId"
        v-model:checked-row-keys="selectedEventIds"
        :max-height="600"
      ></NDataTable>
    </div>
  </SettingsSection>
</template>

<script lang="tsx" setup>
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { EventHubEvents } from '@shared/types/league-client/event-hub'
import { sleep } from '@shared/utils/sleep'
import { useTranslation } from 'i18next-vue'
import { DataTableColumns, NButton, NDataTable, useMessage } from 'naive-ui'
import { computed, markRaw, ref, shallowRef, watch } from 'vue'

import ClaimableItem from './ClaimableItem.vue'

const REWARD_STATE_UNSELECTED = 'Unselected'

const { t } = useTranslation()

const as = useAppCommonStore()
const lc = useInstance(LeagueClientRenderer)
const lcs = useLeagueClientStore()

const message = useMessage()

const isClaiming = ref(false)
const isLoading = ref(false)
const selectedEventIds = ref<string[]>([])
const cachedEventHubRewardGroups = ref<
  Record<
    string,
    {
      rewardGroupId: string
      rewardName: string
      thumbIconPath: string
    }[]
  >
>({})
const events = shallowRef<EventHubEvents[]>([])

const dataTableThemeOverrides = computed(() => {
  if (as.colorTheme === 'dark') {
    return {
      thColor: 'rgba(23, 23, 23, 0.3)',
      tdColor: 'rgba(23, 23, 23, 0.2)'
    }
  }

  return {
    thColor: 'rgba(15, 23, 42, 0.04)',
    tdColor: 'rgba(15, 23, 42, 0.02)'
  }
})

const columns = computed<DataTableColumns<EventHubEvents>>(() => [
  {
    type: 'selection'
  },
  {
    title: () => t('toolkit.claim.eventHub.columns.rewardList'),
    key: 'rewardList',
    render: (row) => {
      const items = (cachedEventHubRewardGroups.value[row.eventId] || []).map((reward) => {
        return {
          id: reward.rewardGroupId,
          iconUrl: reward.thumbIconPath,
          name: reward.rewardName
        }
      })

      return <ClaimableItem title={row.eventInfo.eventName} items={items} />
    }
  }
])

const updateClaimableEventHubEvents = async (manually = false) => {
  if (isLoading.value) {
    return
  }

  try {
    isLoading.value = true

    const { data } = await lc.api.eventHub.getEvents()
    events.value = data.filter((event) => event.eventInfo.unclaimedRewardCount)

    selectedEventIds.value = selectedEventIds.value.filter((id) =>
      events.value.some((event) => event.eventId === id)
    )

    if (manually) {
      message.success(() => t('toolkit.claim.eventHub.refreshSuccess'))
    }

    if (!events.value.length) {
      return
    }

    const updateTrackItems = async (eventId: string) => {
      const { data: items1 } = await lc.api.eventHub.getRewardTrackItems(eventId)
      const { data: items2 } = await lc.api.eventHub.getRewardTrackBonusItems(eventId)

      const rewards = [...items1, ...items2]
        .map((item) => item.rewardOptions)
        .flat()
        .filter((reward) => reward.state === REWARD_STATE_UNSELECTED)
        .map((reward) => ({
          rewardGroupId: reward.rewardGroupId,
          rewardName: reward.rewardName,
          thumbIconPath: reward.thumbIconPath
        }))

      cachedEventHubRewardGroups.value[eventId] = markRaw(rewards)
    }

    Promise.allSettled(events.value.map((event) => updateTrackItems(event.eventId)))
  } catch (error: any) {
    message.warning(() => t('toolkit.claim.eventHub.refreshFailed', { reason: error.message }))
  } finally {
    isLoading.value = false
  }
}

const claim = async () => {
  if (isLoading.value || !selectedEventIds.value.length) {
    return
  }

  try {
    isLoading.value = true
    isClaiming.value = true

    for (const eventId of selectedEventIds.value) {
      if (!isClaiming.value) {
        break
      }

      await lc.api.eventHub.postRewardTrackClaimAll(eventId)

      const eventInfo = events.value.find((event) => event.eventId === eventId)

      if (eventInfo) {
        message.success(() =>
          t('toolkit.claim.eventHub.claimed', { item: eventInfo.eventInfo.eventName })
        )
      }
    }
  } catch (error: any) {
    message.warning(() => t('toolkit.claim.eventHub.claimFailed', { reason: error.message }))
  } finally {
    isLoading.value = false
    isClaiming.value = false
  }

  await sleep(2000) // 可能会更新不及时, 这里在后面再刷新一次
  await updateClaimableEventHubEvents().catch(() => {})
}

watch(
  () => lcs.isConnected,
  (isConnected) => {
    if (isConnected) {
      updateClaimableEventHubEvents()
    }
  },
  { immediate: true }
)
</script>
