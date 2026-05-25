<template>
  <NCard size="small">
    <template #header>
      <span class="card-header-title">
        {{ t('ChatAvailability.title') }}
      </span>
    </template>
    <ControlItem
      class="control-item-margin"
      :label="t('ChatAvailability.availability.label')"
      :label-description="t('ChatAvailability.availability.description')"
      :label-width="260"
    >
      <NRadioGroup
        size="small"
        :disabled="!lcs.chat.me"
        name="radio-group"
        :value="lcs.chat.me?.availability"
        @update:value="(a) => handleChangeAvailability(a)"
      >
        <NFlex :size="4">
          <NRadio value="chat">{{ t('ChatAvailability.availability.radio.chat') }}</NRadio>
          <NRadio value="mobile">{{ t('ChatAvailability.availability.radio.mobile') }}</NRadio>
          <NRadio value="away">{{ t('ChatAvailability.availability.radio.away') }}</NRadio>
          <NRadio value="offline">{{ t('ChatAvailability.availability.radio.offline') }}</NRadio>
          <NRadio value="dnd">{{ t('ChatAvailability.availability.radio.dnd') }}</NRadio>
          <NRadio value="spectating">{{
            t('ChatAvailability.availability.radio.spectating')
          }}</NRadio>
          <NRadio value="online">{{ t('ChatAvailability.availability.radio.online') }}</NRadio>
        </NFlex>
      </NRadioGroup>
    </ControlItem>
    <ControlItem
      class="control-item-margin"
      :label="t('ChatAvailability.lockOfflineStatus.label')"
      :label-description="t('ChatAvailability.lockOfflineStatus.description')"
      :label-width="260"
    >
      <NSwitch
        size="small"
        :value="ams.settings.lockOfflineStatus"
        @update:value="(val) => am.setLockOfflineStatus(val)"
      />
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { AutoMiscRenderer } from '@renderer-shared/shards/auto-misc'
import { useAutoMiscStore } from '@renderer-shared/shards/auto-misc/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { AvailabilityType } from '@shared/http-api-axios-helper/league-client/chat'
import { useTranslation } from 'i18next-vue'
import { NCard, NFlex, NRadio, NRadioGroup, NSwitch, useNotification } from 'naive-ui'

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
      title: () => t('ChatAvailability.availability.failedNotification.title'),
      content: () =>
        t('ChatAvailability.availability.failedNotification.description', {
          reason: (error as Error).message
        })
    })
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
