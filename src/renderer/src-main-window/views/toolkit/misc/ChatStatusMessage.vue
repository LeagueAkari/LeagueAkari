<template>
  <NCard size="small">
    <template #header>
      <span class="card-header-title">{{ t('ChatStatusMessage.title') }}</span>
    </template>
    <ControlItem
      :label="t('ChatStatusMessage.resetOnLogin.label')"
      class="control-item-margin"
      :label-description="t('ChatStatusMessage.resetOnLogin.description')"
      :label-width="260"
    >
      <NSwitch
        size="small"
        :value="ams.settings.autoSetStatusMessageEnabled"
        @update:value="(value) => am.setAutoSetStatusMessageEnabled(value)"
      ></NSwitch>
    </ControlItem>
    <ControlItem
      :label="t('ChatStatusMessage.text.label')"
      class="control-item-margin"
      :label-description="t('ChatStatusMessage.text.description')"
      :label-width="260"
    >
      <div style="width: 360px">
        <NInput
          style="width: 100%; font-family: monospace"
          type="textarea"
          v-model:value="text"
          :disabled="isSetting"
          :autosize="{ maxRows: 6, minRows: 3 }"
          :placeholder="t('ChatStatusMessage.text.placeholder')"
          @blur="handleSetChatStatusMessage"
          size="small"
        ></NInput>
        <div class="mt-1 flex justify-end">
          <NButton
            :loading="isSetting"
            @mousedown.prevent
            @click="handleSetChatStatusMessage"
            type="primary"
            size="tiny"
            :disabled="isSetting"
            >{{ t('ChatStatusMessage.text.save') }}</NButton
          >
        </div>
      </div>
    </ControlItem>
  </NCard>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { AutoMiscRenderer } from '@renderer-shared/shards/auto-misc'
import { useAutoMiscStore } from '@renderer-shared/shards/auto-misc/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NInput, NSwitch, useMessage, useNotification } from 'naive-ui'
import { ref, watchEffect } from 'vue'

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const ams = useAutoMiscStore()
const am = useInstance(AutoMiscRenderer)

const text = ref('')
const isSetting = ref(false)
const message = useMessage()
const notification = useNotification()

watchEffect(() => {
  text.value = ams.settings.statusMessage
})

const handleSetChatStatusMessage = async () => {
  if (isSetting.value || text.value === ams.settings.statusMessage) {
    return
  }

  try {
    isSetting.value = true
    await am.setStatusMessage(text.value)

    if (lcs.connectionState !== 'connected') {
      message.success(t('ChatStatusMessage.message.saved'))
      return
    }

    await am.applyStatusMessage(text.value)
    message.success(t('ChatStatusMessage.message.success'))
  } catch (error) {
    notification.warning({
      title: () => t('ChatStatusMessage.message.failedNotification.title'),
      content: () =>
        t('ChatStatusMessage.message.failedNotification.description', {
          reason: (error as Error).message
        })
    })
  } finally {
    isSetting.value = false
  }
}
</script>

<style scoped></style>
