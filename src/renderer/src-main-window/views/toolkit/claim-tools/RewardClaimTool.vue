<template>
  <SettingsSection
    :title="t('toolkit.claim.rewards.title')"
    :footer="t('toolkit.claim.rewards.hint')"
  >
    <div class="p-3">
      <div class="mb-2 flex flex-wrap gap-1">
        <NButton
          :disabled="isLoading || !selectedGrantIds.length || !lcs.isConnected"
          size="small"
          type="primary"
          secondary
          @click="claim"
        >
          <template v-if="selectedGrantIds.length">
            {{ t('toolkit.claim.rewards.claimButtonC', { count: selectedGrantIds.length }) }}
          </template>
          <template v-else>
            {{ t('toolkit.claim.rewards.claimButton') }}
          </template>
        </NButton>
        <NButton
          v-show="isClaiming"
          size="small"
          type="warning"
          secondary
          @click="isClaiming = false"
        >
          {{ t('toolkit.claim.rewards.cancelButton') }}
        </NButton>
        <NButton
          :disabled="isLoading || !lcs.isConnected"
          size="small"
          secondary
          @click="updateClaimableRewardGrants(true)"
        >
          {{ t('toolkit.claim.rewards.refreshButton') }}
        </NButton>
      </div>
      <NDataTable
        :theme-overrides="dataTableThemeOverrides"
        :loading="isLoading"
        size="small"
        :columns="columns"
        :data="grants"
        :row-key="(row) => row.info.id"
        v-model:checked-row-keys="selectedGrantIds"
        :max-height="600"
      ></NDataTable>
    </div>
  </SettingsSection>
</template>

<script lang="tsx" setup>
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useActivated } from '@renderer-shared/composables/useActivated'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { RewardsGrant } from '@shared/types/league-client/rewards'
import { ChoiceMaker } from '@shared/utils/choice-maker'
import { useTranslation } from 'i18next-vue'
import { DataTableColumns, NButton, NDataTable, useMessage } from 'naive-ui'
import { computed, ref, shallowRef, watch } from 'vue'

import ClaimableItem from './ClaimableItem.vue'

const TARGET_REWARD_GRANT_STATUS = 'PENDING_SELECTION'

const { t } = useTranslation()

const as = useAppCommonStore()
const lc = useInstance(LeagueClientRenderer)
const log = useInstance(LoggerRenderer)
const lcs = useLeagueClientStore()

const COMP_NAMESPACE = 'comp:RewardClaimTool'

const message = useMessage()

const isLoading = ref(false)
const isClaiming = ref(false)
const selectedGrantIds = ref<string[]>([])
const grants = shallowRef<RewardsGrant[]>([])

const isActivated = useActivated()

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

const columns = computed<DataTableColumns<RewardsGrant>>(() => [
  {
    type: 'selection'
  },

  {
    title: () => t('toolkit.claim.rewards.columns.rewardList'),
    key: 'rewardList',
    render: (row) => {
      const items = row.rewardGroup.rewards.map((reward) => {
        return {
          id: reward.id,
          iconUrl: reward.media.iconUrl,
          name: reward.localizations.title
        }
      })

      return <ClaimableItem items={items} title={row.rewardGroup.localizations.title} />
    }
  }
])

const updateClaimableRewardGrants = async (manually = false) => {
  if (isLoading.value) {
    return
  }

  try {
    isLoading.value = true

    const { data } = await lc.api.rewards.getGrants(TARGET_REWARD_GRANT_STATUS)
    grants.value = data

    selectedGrantIds.value = selectedGrantIds.value.filter((id) =>
      data.some((grant) => grant.info.id === id)
    )

    if (manually) {
      message.success(() => t('toolkit.claim.rewards.refreshSuccess'))
    }
  } catch (error: any) {
    message.warning(() => t('toolkit.claim.rewards.refreshFailed', { reason: error.message }))
  } finally {
    isLoading.value = false
  }
}

const claim = async () => {
  if (isLoading.value || !selectedGrantIds.value.length) {
    return
  }

  try {
    isLoading.value = true
    isClaiming.value = true

    for (const grantId of selectedGrantIds.value) {
      if (!isClaiming.value) {
        break
      }

      const grant = grants.value.find((grant) => grant.info.id === grantId)

      if (grant) {
        const rewards = grant.rewardGroup.rewards

        const cm = new ChoiceMaker(Array(rewards.length).fill(1), rewards)
        const chosen = cm.choose(
          grant.rewardGroup.selectionStrategyConfig?.maxSelectionsAllowed || 1
        )

        await lc.api.rewards.postGrantSelection(grant.info.id, {
          grantId: grant.info.id,
          rewardGroupId: grant.rewardGroup.id,
          selections: chosen.map((c) => c.id)
        })

        log.info(COMP_NAMESPACE, `claimed ${chosen.map((c) => c.localizations.title).join(', ')}`)

        message.success(() =>
          t('toolkit.claim.rewards.claimed', {
            item: chosen.map((c) => c.localizations.title).join(', ')
          })
        )
      }
    }
  } catch (error: any) {
    message.warning(() => t('toolkit.claim.rewards.claimFailed', { reason: error.message }))
  } finally {
    isLoading.value = false
    isClaiming.value = false
  }
}

lc.onLcuEventVue<RewardsGrant[]>('/lol-rewards/v1/grants', ({ data }) => {
  grants.value = data.filter((grant) => grant.info.status === TARGET_REWARD_GRANT_STATUS)
  selectedGrantIds.value = selectedGrantIds.value.filter((id) =>
    grants.value.some((grant) => grant.info.id === id)
  )
})

const shouldReload = computed(() => {
  return isActivated.value && lcs.isConnected
})

watch(
  () => shouldReload.value,
  (should) => {
    if (should) {
      updateClaimableRewardGrants()
    }
  },
  { immediate: true }
)
</script>
