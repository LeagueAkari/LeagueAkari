<template>
  <div class="h-full w-full">
    <NScrollbar class="relative h-full max-w-full" ref="el">
      <div class="mx-auto flex max-w-[800px] flex-col gap-6 p-6">
        <SettingsSection :title="t('AutoGameflow.sections.readyCheck')">
          <SettingsRow
            :label="t('AutoGameflow.common.enabled')"
            :label-description="t('AutoGameflow.autoAcceptEnabled.description')"
            :label-width="260"
          >
            <NSwitch
              :value="store.settings.autoAcceptEnabled"
              @update:value="(val) => shard.setAutoAcceptEnabled(val)"
              size="small"
            />
          </SettingsRow>
          <SettingsRow
            :label="t('AutoGameflow.autoAcceptDelaySeconds.label')"
            :label-description="t('AutoGameflow.autoAcceptDelaySeconds.description')"
            :label-width="260"
          >
            <NInputNumber
              class="w-25!"
              :value="store.settings.autoAcceptDelaySeconds"
              @update:value="(value) => shard.setAutoAcceptDelaySeconds(value || 0)"
              :min="0"
              :max="10"
              size="small"
            />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection :title="t('AutoGameflow.sections.autoHonor')">
          <SettingsRow
            :label="t('AutoGameflow.common.enabled')"
            :label-description="t('AutoGameflow.autoHonorEnabled.description')"
            :label-width="260"
          >
            <NSwitch
              :value="store.settings.autoHonorEnabled"
              @update:value="(val) => shard.setAutoHonorEnabled(val)"
              size="small"
            />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection :title="t('AutoGameflow.sections.playAgain')">
          <SettingsRow :label="t('AutoGameflow.common.enabled')" :label-width="260">
            <template #labelDescription>
              <TranslationComponent
                :translation="t('AutoGameflow.playAgainEnabled.description.full')"
              >
                <template #autoHonor>
                  <span
                    class="cursor-pointer font-bold"
                    @click="() => shard.setAutoHonorEnabled(true)"
                  >
                    {{ t('AutoGameflow.playAgainEnabled.description.part2') }}
                  </span>
                </template>
              </TranslationComponent>
            </template>
            <NSwitch
              :value="store.settings.playAgainEnabled"
              @update:value="(val) => shard.setPlayAgainEnabled(val)"
              size="small"
            />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection :title="t('AutoGameflow.sections.autoMatchmaking')">
          <SettingsRow
            :label="t('AutoGameflow.common.enabled')"
            :label-description="t('AutoGameflow.autoMatchmakingEnabled.description')"
            :label-width="260"
          >
            <NSwitch
              :value="store.settings.autoMatchmakingEnabled"
              @update:value="(val) => shard.setAutoMatchmakingEnabled(val)"
              size="small"
            />
          </SettingsRow>
          <SettingsRow
            :label="t('AutoGameflow.autoMatchmakingMinimumMembers.label')"
            :label-description="
              t('AutoGameflow.autoMatchmakingMinimumMembers.description', {
                members: store.settings.autoMatchmakingMinimumMembers
              })
            "
            :label-width="260"
          >
            <NInputNumber
              class="w-25!"
              :value="store.settings.autoMatchmakingMinimumMembers"
              @update:value="(val) => shard.setAutoMatchmakingMinimumMembers(val || 1)"
              :min="1"
              :max="99"
              size="small"
            />
          </SettingsRow>
          <SettingsRow
            :label="t('AutoGameflow.autoMatchmakingDelaySeconds.label')"
            :label-description="t('AutoGameflow.autoMatchmakingDelaySeconds.description')"
            :label-width="260"
          >
            <NInputNumber
              class="w-25!"
              :value="store.settings.autoMatchmakingDelaySeconds"
              @update:value="(value) => shard.setAutoMatchmakingDelaySeconds(value || 0)"
              placeholder="秒"
              :min="0"
              size="small"
            />
          </SettingsRow>
          <SettingsRow
            :label="t('AutoGameflow.autoMatchmakingWaitForInvitees.label')"
            :label-description="t('AutoGameflow.autoMatchmakingWaitForInvitees.description')"
            :label-width="260"
          >
            <NSwitch
              :value="store.settings.autoMatchmakingWaitForInvitees"
              @update:value="(val) => shard.setAutoMatchmakingWaitForInvitees(val)"
              size="small"
            />
          </SettingsRow>
          <SettingsRow
            :label="t('AutoGameflow.autoMatchmakingRematchStrategy.label')"
            :label-description="t('AutoGameflow.autoMatchmakingRematchStrategy.description')"
            :label-width="260"
          >
            <NRadioGroup
              class="max-w-full"
              :value="store.settings.autoMatchmakingRematchStrategy"
              @update:value="(s) => shard.setAutoMatchmakingRematchStrategy(s)"
              size="small"
            >
              <NFlex :size="8" class="justify-end">
                <NRadio value="never">{{
                  t('AutoGameflow.autoMatchmakingRematchStrategy.options.never')
                }}</NRadio>
                <NRadio value="fixed-duration">{{
                  t('AutoGameflow.autoMatchmakingRematchStrategy.options.fixed-duration')
                }}</NRadio>
                <NRadio value="estimated-duration">{{
                  t('AutoGameflow.autoMatchmakingRematchStrategy.options.estimated-duration')
                }}</NRadio>
              </NFlex>
            </NRadioGroup>
          </SettingsRow>
          <SettingsRow
            :label="t('AutoGameflow.autoMatchmakingRematchFixedDuration.label')"
            :label-description="
              store.settings.autoMatchmakingRematchStrategy !== 'fixed-duration'
                ? t(
                    'AutoGameflow.autoMatchmakingRematchFixedDuration.description.no-fixed-duration'
                  )
                : t('AutoGameflow.autoMatchmakingRematchFixedDuration.description.fixed-duration')
            "
            :disabled="store.settings.autoMatchmakingRematchStrategy !== 'fixed-duration'"
            :label-width="260"
          >
            <NInputNumber
              :disabled="store.settings.autoMatchmakingRematchStrategy !== 'fixed-duration'"
              class="w-25!"
              :value="store.settings.autoMatchmakingRematchFixedDuration"
              @update:value="(value) => shard.setAutoMatchmakingRematchFixedDuration(value || 2)"
              :min="1"
              size="small"
            />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection :title="t('AutoGameflow.sections.autoReconnect')">
          <SettingsRow
            :label="t('AutoGameflow.common.enabled')"
            :label-description="t('AutoGameflow.autoReconnectEnabled.description')"
            :label-width="260"
          >
            <NSwitch
              :value="store.settings.autoReconnectEnabled"
              @update:value="(val) => shard.setAutoReconnectEnabled(val)"
              size="small"
            />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection :title="t('AutoGameflow.sections.leader')">
          <SettingsRow
            :label="t('AutoGameflow.common.enabled')"
            :label-description="t('AutoGameflow.autoSkipLeaderEnabled.description')"
            :label-width="260"
          >
            <NSwitch
              :value="store.settings.autoSkipLeaderEnabled"
              @update:value="(val) => shard.setAutoSkipLeaderEnabled(val)"
              size="small"
            />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection :title="t('AutoGameflow.sections.invitations')">
          <SettingsRow
            :label="t('AutoGameflow.common.enabled')"
            :label-description="t('AutoGameflow.autoHandleInvitationsEnabled.description')"
            :label-width="260"
          >
            <NSwitch
              :value="store.settings.autoHandleInvitationsEnabled"
              @update:value="(val) => shard.setAutoHandleInvitationsEnabled(val)"
              size="small"
            />
          </SettingsRow>
          <SettingsRow
            :label="t('AutoGameflow.rejectInvitationWhenAway.label')"
            :label-description="t('AutoGameflow.rejectInvitationWhenAway.description')"
            :label-width="260"
          >
            <NSwitch
              :value="store.settings.rejectInvitationWhenAway"
              @update:value="(val) => shard.setRejectInvitationWhenAway(val)"
              size="small"
            />
          </SettingsRow>
          <SettingsRow
            :label="t('AutoGameflow.invitationHandlingStrategies.label')"
            :label-description="t('AutoGameflow.invitationHandlingStrategies.description')"
            :label-width="260"
            align="start"
          >
            <NFlex vertical align="flex-start" class="max-w-full">
              <table class="max-w-full table-auto border-separate border-spacing-0">
                <tbody>
                  <tr v-for="s of invitationStrategiesArray" :key="s.queueType">
                    <td
                      class="max-w-40 truncate py-1 pr-4 text-[13px] font-bold text-black/80 dark:text-white/90"
                    >
                      {{ queueTypes[s.queueType]?.label || s.queueType }}
                    </td>
                    <td class="py-1">
                      <NRadioGroup
                        :value="s.strategy"
                        @update:value="(val) => handleChangeInvitationStrategy(s.queueType, val)"
                        size="small"
                      >
                        <NFlex :size="8">
                          <NRadio value="accept">{{
                            t('AutoGameflow.invitationHandlingStrategies.options.accept')
                          }}</NRadio>
                          <NRadio value="decline">{{
                            t('AutoGameflow.invitationHandlingStrategies.options.decline')
                          }}</NRadio>
                          <NRadio value="ignore">{{
                            t('AutoGameflow.invitationHandlingStrategies.options.ignore')
                          }}</NRadio>
                        </NFlex>
                      </NRadioGroup>
                    </td>
                  </tr>
                </tbody>
              </table>
              <NPopselect
                :options="queueTypeOptions"
                multiple
                trigger="click"
                :value="invitationStrategiesPopselectArray"
                @update:value="handleChangeInvitationStrategies"
              >
                <NButton size="tiny" type="primary">{{
                  t('AutoGameflow.invitationHandlingStrategies.button')
                }}</NButton>
              </NPopselect>
            </NFlex>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection>
          <template #header>
            <TooltipWithIcon>
              <span class="text-sm leading-5 font-bold text-black/80 dark:text-white/90">
                {{ t('AutoGameflow.sections.aramTeamSide') }}
              </span>
              <template #tooltip>
                <div class="max-w-90 text-xs leading-relaxed font-normal">
                  <img
                    :src="aramTeamSideMessageImage"
                    :alt="t('AutoGameflow.autoSendARAMTeamSideEnabled.tooltipImageAlt')"
                    class="mb-2 aspect-[1680/935] w-90 max-w-full rounded border border-black/10 object-cover dark:border-white/10"
                  />
                  <div>{{ t('AutoGameflow.autoSendARAMTeamSideEnabled.tooltipBody') }}</div>
                </div>
              </template>
            </TooltipWithIcon>
          </template>
          <SettingsRow
            :label="t('AutoGameflow.common.enabled')"
            :label-description="t('AutoGameflow.autoSendARAMTeamSideEnabled.description')"
            :label-width="260"
          >
            <div class="flex flex-col items-end gap-2">
              <NSwitch
                :value="store.settings.autoSendARAMTeamSideEnabled"
                @update:value="(val) => shard.setAutoSendARAMTeamSideEnabled(val)"
                size="small"
              />
              <NCheckbox
                size="small"
                class="text-[13px]"
                :disabled="!store.settings.autoSendARAMTeamSideEnabled"
                :checked="store.settings.autoSendARAMTeamSideVisibleToTeam"
                @update:checked="(val) => shard.setAutoSendARAMTeamSideVisibleToTeam(val)"
              >
                {{ t('AutoGameflow.autoSendARAMTeamSideVisibleToTeam.checkboxLabel') }}
              </NCheckbox>
            </div>
          </SettingsRow>
        </SettingsSection>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import SettingsRow from '@renderer-shared/components/SettingsRow.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import TooltipWithIcon from '@renderer-shared/components/TooltipWithIcon.vue'
import aramTeamSideMessageImage from '@renderer-shared/assets/automation/aram-team-side-message.webp'
import { useInstance } from '@renderer-shared/shards'
import { AutoGameflowRenderer } from '@renderer-shared/shards/auto-gameflow'
import { useAutoGameflowStore } from '@renderer-shared/shards/auto-gameflow/store'
import { TranslationComponent, useTranslation } from 'i18next-vue'
import {
  NButton,
  NCheckbox,
  NFlex,
  NInputNumber,
  NPopselect,
  NRadio,
  NRadioGroup,
  NScrollbar,
  NSwitch
} from 'naive-ui'
import { computed } from 'vue'

const store = useAutoGameflowStore()
const shard = useInstance(AutoGameflowRenderer)

const invitationStrategiesPopselectArray = computed(() => {
  return Object.keys(store.settings.invitationHandlingStrategies)
})

const handleChangeInvitationStrategies = (value: string[]) => {
  const newStrategies: Record<string, string> = {}

  for (const strategy of value) {
    if (store.settings.invitationHandlingStrategies[strategy]) {
      newStrategies[strategy] = store.settings.invitationHandlingStrategies[strategy]
    } else {
      newStrategies[strategy] = 'ignore'
    }
  }

  shard.setInvitationHandlingStrategies(newStrategies)
}

const { t } = useTranslation()

const queueTypes = computed(() => {
  return {
    '<DEFAULT>': {
      label: t('AutoGameflow.invitationHandlingStrategies.queueTypes.default'),
      order: 0
    },
    RANKED_SOLO_5x5: {
      label: t('queueTypes.RANKED_SOLO_5x5', { ns: 'common' }),
      order: 100
    },
    RANKED_FLEX_SR: {
      label: t('queueTypes.RANKED_FLEX_SR', { ns: 'common' }),
      order: 110
    },
    NORMAL: {
      label: t('queueTypes.NORMAL', { ns: 'common' }),
      order: 200
    },
    ARAM_UNRANKED_5x5: {
      label: t('queueTypes.ARAM_UNRANKED_5x5', { ns: 'common' }),
      order: 300
    },
    KIWI: {
      label: t('queueTypes.KIWI', { ns: 'common' }),
      order: 310
    },
    CHERRY: {
      label: t('queueTypes.CHERRY', { ns: 'common' }),
      order: 400
    },
    URF: {
      label: t('queueTypes.URF', { ns: 'common' }),
      order: 500
    },
    NORMAL_TFT: {
      label: t('queueTypes.NORMAL_TFT', { ns: 'common' }),
      order: 600
    },
    RANKED_TFT: {
      label: t('queueTypes.RANKED_TFT', { ns: 'common' }),
      order: 610
    },
    RANKED_TFT_TURBO: {
      label: t('queueTypes.RANKED_TFT_TURBO', { ns: 'common' }),
      order: 620
    },
    RANKED_TFT_DOUBLE_UP: {
      label: t('queueTypes.RANKED_TFT_DOUBLE_UP', { ns: 'common' }),
      order: 630
    }
  }
})

const invitationStrategiesArray = computed(() => {
  return Object.entries(store.settings.invitationHandlingStrategies)
    .map(([queueType, strategy]) => {
      return {
        queueType,
        strategy
      }
    })
    .toSorted((a, b) => {
      const aQueueTypeOrder = queueTypes[a.queueType] ? queueTypes[a.queueType].order : 0
      const bQueueTypeOrder = queueTypes[b.queueType] ? queueTypes[b.queueType].order : 0

      return aQueueTypeOrder - bQueueTypeOrder
    })
})

const queueTypeOptions = computed(() => {
  return Object.keys(queueTypes.value)
    .map((key) => {
      return {
        value: key,
        label: queueTypes.value[key].label
      }
    })
    .toSorted((a, b) => {
      return queueTypes.value[a.value].order - queueTypes.value[b.value].order
    })
})

const handleChangeInvitationStrategy = (queueType: string, strategy: string) => {
  const newObj = { ...store.settings.invitationHandlingStrategies }
  newObj[queueType] = strategy
  shard.setInvitationHandlingStrategies(newObj)
}
</script>
