<template>
  <SettingsSection :title="t('toolkit.gameflowInProgress.title')">
    <SettingsRow
      :label="t('toolkit.gameflowInProgress.playAgain.label')"
      :label-description="t('toolkit.gameflowInProgress.playAgain.description')"
      :label-width="260"
    >
      <NButton type="primary" :disabled="!isInEndgamePhase" @click="handlePlayAgain" size="small">{{
        t('toolkit.gameflowInProgress.playAgain.button')
      }}</NButton>
    </SettingsRow>
    <SettingsRow
      :label="t('toolkit.gameflowInProgress.leaveLobby.label')"
      :label-description="t('toolkit.gameflowInProgress.leaveLobby.description')"
      :label-width="260"
    >
      <NButton
        :disabled="lcs.gameflow.phase !== 'Lobby'"
        @click="() => lc.api.lobby.deleteLobby()"
        size="small"
        >{{ t('toolkit.gameflowInProgress.leaveLobby.button') }}</NButton
      >
    </SettingsRow>
  </SettingsSection>
</template>

<script setup lang="ts">
import SettingsRow from '@renderer-shared/components/SettingsRow.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NButton, useNotification } from 'naive-ui'
import { computed } from 'vue'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const lc = useInstance(LeagueClientRenderer)

const notification = useNotification()

const isInEndgamePhase = computed(() => {
  return (
    lcs.gameflow.phase === 'WaitingForStats' ||
    lcs.gameflow.phase === 'PreEndOfGame' ||
    lcs.gameflow.phase === 'EndOfGame'
  )
})

const handlePlayAgain = async () => {
  try {
    await lc.api.lobby.playAgain()
  } catch (error) {
    notification.warning({
      title: () => t('toolkit.gameflowInProgress.playAgain.failedNotification.title'),
      content: () =>
        t('toolkit.gameflowInProgress.playAgain.failedNotification.description', {
          reason: (error as Error).message
        })
    })
  }
}
</script>
