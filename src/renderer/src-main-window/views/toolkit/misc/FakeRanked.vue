<template>
  <NCard size="small">
    <template #header>
      <span class="card-header-title">{{ t('FakeRanked.title') }}</span>
    </template>
    <ControlItem
      class="control-item-margin"
      :label="t('FakeRanked.set.label')"
      :label-description="t('FakeRanked.set.description')"
      :label-width="260"
    >
      <NButton
        size="small"
        type="primary"
        :disabled="lcs.connectionState !== 'connected'"
        @click="() => handleSet()"
        >{{ t('FakeRanked.set.button') }}</NButton
      >
    </ControlItem>
    <ControlItem class="control-item-margin" :label="t('FakeRanked.queue')" :label-width="260">
      <NSelect
        :options="queueOptions"
        style="width: 180px"
        v-model:value="state.queue"
        size="small"
      ></NSelect>
    </ControlItem>
    <ControlItem class="control-item-margin" :label="t('FakeRanked.tier')" :label-width="260">
      <NSelect
        :options="tierOptions"
        style="width: 180px"
        v-model:value="state.tier"
        size="small"
      ></NSelect>
    </ControlItem>
    <ControlItem class="control-item-margin" :label="t('FakeRanked.division')" :label-width="260">
      <NSelect
        :options="divisionOptions"
        :disabled="
          state.tier === 'MASTER' || state.tier === 'GRANDMASTER' || state.tier === 'CHALLENGER'
        "
        style="width: 180px"
        v-model:value="state.division"
        size="small"
      ></NSelect>
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NSelect, useMessage, useNotification } from 'naive-ui'
import { computed, reactive } from 'vue'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const lc = useInstance(LeagueClientRenderer)

const notification = useNotification()

const state = reactive({
  queue: 'RANKED_SOLO_5x5',
  tier: 'CHALLENGER',
  division: 'I'
})

const message = useMessage()

const handleSet = async () => {
  try {
    await lc.api.chat.changeRanked(
      state.queue,
      state.tier,
      state.tier === 'MASTER' || state.tier === 'GRANDMASTER' || state.tier === 'CHALLENGER'
        ? undefined
        : state.division
    )
    message.success(t('FakeRanked.commonSuccess'), { duration: 1000 })
  } catch (error) {
    notification.warning({
      title: () => t('FakeRanked.set.failedNotification.title'),
      content: () =>
        t('FakeRanked.set.failedNotification.description', {
          reason: (error as Error).message
        })
    })
  }
}

const tierOptions = computed(() => {
  return [
    {
      label: t('tiers.IRON', { ns: 'common' }),
      value: 'IRON'
    },
    {
      label: t('tiers.BRONZE', { ns: 'common' }),
      value: 'BRONZE'
    },
    {
      label: t('tiers.SILVER', { ns: 'common' }),
      value: 'SILVER'
    },
    {
      label: t('tiers.GOLD', { ns: 'common' }),
      value: 'GOLD'
    },
    {
      label: t('tiers.PLATINUM', { ns: 'common' }),
      value: 'PLATINUM'
    },
    {
      label: t('tiers.EMERALD', { ns: 'common' }),
      value: 'EMERALD'
    },
    {
      label: t('tiers.DIAMOND', { ns: 'common' }),
      value: 'DIAMOND'
    },
    {
      label: t('tiers.MASTER', { ns: 'common' }),
      value: 'MASTER'
    },
    {
      label: t('tiers.GRANDMASTER', { ns: 'common' }),
      value: 'GRANDMASTER'
    },
    {
      label: t('tiers.CHALLENGER', { ns: 'common' }),
      value: 'CHALLENGER'
    }
  ]
})

const divisionOptions = [
  {
    label: 'I',
    value: 'I'
  },
  {
    label: 'II',
    value: 'II'
  },
  {
    label: 'III',
    value: 'III'
  },
  {
    label: 'IV',
    value: 'IV'
  }
]

const queueOptions = computed(() => {
  return [
    {
      label: t('queueTypes.RANKED_SOLO_5x5', { ns: 'common' }),
      value: 'RANKED_SOLO_5x5'
    },
    {
      label: t('queueTypes.RANKED_FLEX_SR', { ns: 'common' }),
      value: 'RANKED_FLEX_SR'
    },
    {
      label: t('queueTypes.RANKED_TFT', { ns: 'common' }),
      value: 'RANKED_TFT'
    },
    {
      label: t('queueTypes.RANKED_FLEX_TT', { ns: 'common' }),
      value: 'RANKED_FLEX_TT'
    },
    {
      label: t('queueTypes.CHERRY', { ns: 'common' }),
      value: 'CHERRY'
    },
    {
      label: t('queueTypes.RANKED_TFT_TURBO', { ns: 'common' }),
      value: 'RANKED_TFT_TURBO'
    },
    {
      label: t('queueTypes.RANKED_TFT_DOUBLE_UP', { ns: 'common' }),
      value: 'RANKED_TFT_DOUBLE_UP'
    }
  ]
})
</script>

<style lang="less" scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
