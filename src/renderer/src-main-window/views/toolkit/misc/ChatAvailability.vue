<template>
  <SettingsSection :title="t('toolkit.chatAvailability.title')">
    <SettingsRow
      :label="t('toolkit.chatAvailability.availability.label')"
      :label-description="t('toolkit.chatAvailability.availability.description')"
      :label-width="260"
    >
      <NRadioGroup
        class="max-w-full"
        size="small"
        :disabled="!lcs.chat.me"
        name="radio-group"
        :value="lcs.chat.me?.availability"
        @update:value="(a) => handleChangeAvailability(a)"
      >
        <NFlex :size="4" class="justify-end">
          <NRadio value="chat">{{ t('toolkit.chatAvailability.availability.radio.chat') }}</NRadio>
          <NRadio value="mobile">{{
            t('toolkit.chatAvailability.availability.radio.mobile')
          }}</NRadio>
          <NRadio value="away">{{ t('toolkit.chatAvailability.availability.radio.away') }}</NRadio>
          <NRadio value="offline">{{
            t('toolkit.chatAvailability.availability.radio.offline')
          }}</NRadio>
          <NRadio value="dnd">{{ t('toolkit.chatAvailability.availability.radio.dnd') }}</NRadio>
          <NRadio value="spectating">{{
            t('toolkit.chatAvailability.availability.radio.spectating')
          }}</NRadio>
          <NRadio value="online">{{
            t('toolkit.chatAvailability.availability.radio.online')
          }}</NRadio>
        </NFlex>
      </NRadioGroup>
    </SettingsRow>
    <SettingsRow
      :label="t('toolkit.chatAvailability.lockOfflineStatus.label')"
      :label-description="t('toolkit.chatAvailability.lockOfflineStatus.description')"
      :label-width="260"
    >
      <NSwitch
        size="small"
        :value="ams.settings.lockOfflineStatus"
        @update:value="(val) => am.setLockOfflineStatus(val)"
      />
    </SettingsRow>
  </SettingsSection>
</template>

<script setup lang="ts">
import SettingsRow from '@renderer-shared/components/SettingsRow.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useInstance } from '@renderer-shared/shards'
import { AutoMiscRenderer } from '@renderer-shared/shards/auto-misc'
import { useAutoMiscStore } from '@renderer-shared/shards/auto-misc/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { AvailabilityType } from '@shared/http-api-axios-helper/league-client/chat'
import { useTranslation } from 'i18next-vue'
import { NFlex, NRadio, NRadioGroup, NSwitch, useNotification } from 'naive-ui'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const ams = useAutoMiscStore()
const lc = useInstance(LeagueClientRenderer)
const am = useInstance(AutoMiscRenderer)

const notification = useNotification()

const handleChangeAvailability = async (availability: string) => {
  if ((availability === 'away' || availability === 'chat') && ams.settings.lockOfflineStatus) {
    await am.setLockOfflineStatus(false)
  }

  try {
    await lc.api.chat.changeAvailability(availability as AvailabilityType)
  } catch (error) {
    notification.warning({
      title: () => t('toolkit.chatAvailability.availability.failedNotification.title'),
      content: () =>
        t('toolkit.chatAvailability.availability.failedNotification.description', {
          reason: (error as Error).message
        })
    })
  }
}
</script>
