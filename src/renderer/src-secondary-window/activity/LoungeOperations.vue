<template>
  <div class="flex flex-col gap-6">
    <SettingsSection :title="t('activity.lounge.operations.sections.accept')">
      <SettingsNavigationRow
        target-id="automation.gameflow.ready-check.enabled"
        :label="t('activity.lounge.operations.autoAccept.label')"
        :value="agfs.settings.autoAcceptEnabled"
        :description="
          isCustomGame
            ? t('activity.lounge.operations.autoAccept.unavailable')
            : formatDelayText(agfs.settings.autoAcceptDelaySeconds)
        "
      />
    </SettingsSection>

    <SettingsSection :title="t('activity.lounge.operations.sections.matchmaking')">
      <SettingsNavigationRow
        target-id="automation.gameflow.auto-matchmaking.enabled"
        :label="t('activity.lounge.operations.autoMatchmaking.label')"
        :value="agfs.settings.autoMatchmakingEnabled"
        :description="
          isCustomGame
            ? t('activity.lounge.operations.autoMatchmaking.unavailable')
            : formatDelayText(agfs.settings.autoMatchmakingDelaySeconds)
        "
      />
      <SettingsNavigationRow
        target-id="automation.gameflow.auto-matchmaking.minimum-members"
        :label="t('activity.lounge.operations.autoMatchmakingMinimumMembers.label')"
        :value="
          t('activity.lounge.operations.members', {
            count: agfs.settings.autoMatchmakingMinimumMembers
          })
        "
      />
      <SettingsNavigationRow
        target-id="automation.gameflow.auto-matchmaking.delay"
        :label="t('activity.lounge.operations.autoMatchmakingDelaySeconds.label')"
        :value="formatDelayText(agfs.settings.autoMatchmakingDelaySeconds)"
      />
      <SettingsNavigationRow
        target-id="automation.gameflow.auto-matchmaking.wait-for-invitees"
        :label="t('activity.lounge.operations.autoMatchmakingWaitForInvitees.label')"
        :value="agfs.settings.autoMatchmakingWaitForInvitees"
      />
    </SettingsSection>
  </div>
</template>

<script setup lang="ts">
import SettingsNavigationRow from '@secondary-window/components/SettingsNavigationRow.vue'
import SettingsSection from '@renderer-shared/components/settings-navigation/SettingsSection.vue'
import { useAutoGameflowStore } from '@renderer-shared/shards/auto-gameflow/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

const { t } = useTranslation()

const agfs = useAutoGameflowStore()
const lcs = useLeagueClientStore()

const isCustomGame = computed(() => lcs.gameflow.session?.gameData.isCustomGame)

const formatDelayText = (seconds: number) => {
  if (seconds === 0) {
    return t('activity.lounge.operations.immediately')
  }

  return t('activity.lounge.operations.delay', { seconds })
}
</script>
