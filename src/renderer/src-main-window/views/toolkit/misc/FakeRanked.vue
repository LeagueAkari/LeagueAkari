<template>
  <SettingsSection :title="t('toolkit.fakeRanked.title')">
    <SettingsRow
      :label="t('toolkit.fakeRanked.set.label')"
      :label-description="t('toolkit.fakeRanked.set.description')"
      :label-width="260"
      :label-min-width="160"
      align="start"
    >
      <div class="flex w-115 max-w-full flex-wrap items-end justify-end gap-2">
        <div class="min-w-0 flex-[1_1_170px]">
          <div class="mb-1 text-xs leading-4 text-black/60 dark:text-white/60">
            {{ t('toolkit.fakeRanked.queue') }}
          </div>
          <NSelect
            class="w-full! max-w-full"
            :options="queueOptions"
            :disabled="isSetting"
            v-model:value="state.queue"
            size="small"
          ></NSelect>
        </div>
        <div class="min-w-0 flex-[1_1_112px]">
          <div class="mb-1 text-xs leading-4 text-black/60 dark:text-white/60">
            {{ t('toolkit.fakeRanked.tier') }}
          </div>
          <NSelect
            class="w-full! max-w-full"
            :options="tierOptions"
            :disabled="isSetting"
            v-model:value="state.tier"
            size="small"
          ></NSelect>
        </div>
        <div class="min-w-0 flex-[0_1_88px]">
          <div class="mb-1 text-xs leading-4 text-black/60 dark:text-white/60">
            {{ t('toolkit.fakeRanked.division') }}
          </div>
          <NSelect
            class="w-full! max-w-full"
            :options="divisionOptions"
            :disabled="
              isSetting ||
              state.tier === 'MASTER' ||
              state.tier === 'GRANDMASTER' ||
              state.tier === 'CHALLENGER'
            "
            v-model:value="state.division"
            size="small"
          ></NSelect>
        </div>
        <NButton
          class="min-w-16 flex-none"
          size="small"
          type="primary"
          :loading="isSetting"
          :disabled="isSetting"
          @click="() => handleSet()"
          >{{ t('toolkit.fakeRanked.set.button') }}</NButton
        >
        <div class="flex basis-full justify-end">
          <NTooltip>
            <template #trigger>
              <NCheckbox
                size="small"
                :checked="ams.settings.autoSetRankedStatusEnabled"
                @update:checked="(value) => am.setAutoSetRankedStatusEnabled(value)"
              >
                {{ t('toolkit.fakeRanked.resetOnLogin.label') }}
              </NCheckbox>
            </template>
            <div class="max-w-64 text-xs">
              {{ t('toolkit.fakeRanked.resetOnLogin.description') }}
            </div>
          </NTooltip>
        </div>
      </div>
    </SettingsRow>
  </SettingsSection>
</template>

<script setup lang="ts">
import SettingsRow from '@renderer-shared/components/SettingsRow.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useInstance } from '@renderer-shared/shards'
import { AutoMiscRenderer } from '@renderer-shared/shards/auto-misc'
import { useAutoMiscStore } from '@renderer-shared/shards/auto-misc/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import type {
  AutoMiscRankedDivision,
  AutoMiscRankedStatus,
  AutoMiscRankedTier
} from '@shared/shards/auto-misc'
import { useTranslation } from 'i18next-vue'
import { NButton, NCheckbox, NSelect, NTooltip, useMessage, useNotification } from 'naive-ui'
import { computed, reactive, ref, watchEffect } from 'vue'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const ams = useAutoMiscStore()
const am = useInstance(AutoMiscRenderer)

const notification = useNotification()

const state = reactive<AutoMiscRankedStatus>({
  queue: 'RANKED_SOLO_5x5',
  tier: 'CHALLENGER',
  division: 'I'
})

const message = useMessage()
const isSetting = ref(false)

watchEffect(() => {
  state.queue = ams.settings.rankedStatus.queue
  state.tier = ams.settings.rankedStatus.tier
  state.division = ams.settings.rankedStatus.division
})

const handleSet = async () => {
  if (isSetting.value) {
    return
  }

  try {
    isSetting.value = true
    const rankedStatus = { ...state }
    await am.setRankedStatus(rankedStatus)

    if (!lcs.isConnected) {
      message.success(t('toolkit.fakeRanked.saved'), { duration: 1000 })
      return
    }

    await am.applyRankedStatus(rankedStatus)
    message.success(t('toolkit.fakeRanked.commonSuccess'), { duration: 1000 })
  } catch (error) {
    notification.warning({
      title: () => t('toolkit.fakeRanked.set.failedNotification.title'),
      content: () =>
        t('toolkit.fakeRanked.set.failedNotification.description', {
          reason: (error as Error).message
        })
    })
  } finally {
    isSetting.value = false
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
  ] satisfies { label: string; value: AutoMiscRankedTier }[]
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
] satisfies { label: string; value: AutoMiscRankedDivision }[]

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
