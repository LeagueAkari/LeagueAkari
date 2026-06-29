<template>
  <NCard size="small">
    <NFlex align="center" class="h-6 not-last:mb-0.5">
      <span class="flex-1 text-xs text-gray-600 dark:text-gray-400"
        >{{ t('auxWindow.lounge.operations.autoAccept.label') }} ({{
          isCustomGame
            ? t('auxWindow.lounge.operations.autoAccept.unavailable')
            : formatDelayText(agfs.settings.autoAcceptDelaySeconds)
        }})</span
      >
      <NSwitch
        size="small"
        :value="agfs.settings.autoAcceptEnabled"
        @update:value="(val) => agf.setAutoAcceptEnabled(val)"
      />
    </NFlex>

    <NPopover :show-arrow="false">
      <template #trigger>
        <NFlex align="center" class="h-6 not-last:mb-0.5">
          <div class="flex flex-1 items-center justify-start">
            <span class="text-xs text-gray-600 dark:text-gray-400"
              >{{ t('auxWindow.lounge.operations.autoMatchmaking.label') }} ({{
                isCustomGame
                  ? t('auxWindow.lounge.operations.autoMatchmaking.unavailable')
                  : formatDelayText(agfs.settings.autoMatchmakingDelaySeconds)
              }})</span
            >
            <NIcon class="ml-1 text-lg text-gray-600 dark:text-gray-400">
              <ExpandMoreSharpIcon />
            </NIcon>
          </div>
          <NSwitch
            size="small"
            :value="agfs.settings.autoMatchmakingEnabled"
            @update:value="(val) => agf.setAutoMatchmakingEnabled(val)"
          />
        </NFlex>
      </template>
      <NFlex class="w-[82vw] text-[11px]" vertical>
        <NFlex align="center" class="h-6 not-last:mb-0.5">
          <span class="flex-1 text-xs text-gray-600 dark:text-gray-400">{{
            t('auxWindow.lounge.operations.autoMatchmakingMinimumMembers.label')
          }}</span>
          <NInputNumber
            :value="agfs.settings.autoMatchmakingMinimumMembers"
            @update:value="(val) => agf.setAutoMatchmakingMinimumMembers(val || 1)"
            :min="1"
            :max="99"
            size="tiny"
            class="w-20"
          />
        </NFlex>
        <NFlex align="center" class="h-6 not-last:mb-0.5">
          <span class="flex-1 text-xs text-gray-600 dark:text-gray-400">{{
            t('auxWindow.lounge.operations.autoMatchmakingDelaySeconds.label')
          }}</span>
          <NInputNumber
            :value="agfs.settings.autoMatchmakingDelaySeconds"
            @update:value="(value) => agf.setAutoMatchmakingDelaySeconds(value || 0)"
            :placeholder="t('auxWindow.lounge.operations.second')"
            :min="0"
            size="tiny"
            class="w-20"
          />
        </NFlex>
        <NFlex align="center" class="h-6 not-last:mb-0.5">
          <span class="flex-1 text-xs text-gray-600 dark:text-gray-400">{{
            t('auxWindow.lounge.operations.autoMatchmakingWaitForInvitees.label')
          }}</span>
          <NSwitch
            :value="agfs.settings.autoMatchmakingWaitForInvitees"
            @update:value="(val) => agf.setAutoMatchmakingWaitForInvitees(val)"
            size="small"
          />
        </NFlex>
      </NFlex>
    </NPopover>
  </NCard>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { AutoGameflowRenderer } from '@renderer-shared/shards/auto-gameflow'
import { useAutoGameflowStore } from '@renderer-shared/shards/auto-gameflow/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { ExpandMoreSharp as ExpandMoreSharpIcon } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NCard, NFlex, NIcon, NInputNumber, NPopover, NSwitch } from 'naive-ui'
import { computed } from 'vue'

const { t } = useTranslation()

const agfs = useAutoGameflowStore()
const lcs = useLeagueClientStore()

const agf = useInstance(AutoGameflowRenderer)

const isCustomGame = computed(() => {
  if (!lcs.gameflow.session) {
    return null
  }

  return lcs.gameflow.session.gameData.isCustomGame
})

const formatDelayText = (d: number) => {
  if (d <= 0.05) {
    return t('auxWindow.lounge.operations.immediately')
  }
  return `${d.toFixed(1)} s`
}
</script>

<style scoped></style>
