<template>
  <SettingsSection :title="t('ChatStatusMessage.title')">
    <SettingsRow
      :label="t('ChatStatusMessage.text.label')"
      :label-description="t('ChatStatusMessage.text.description')"
      :label-width="260"
      align="start"
    >
      <div class="w-90 max-w-full">
        <NInput
          class="w-full! font-mono"
          type="textarea"
          v-model:value="text"
          :disabled="isSetting"
          :autosize="{ maxRows: 6, minRows: 3 }"
          :placeholder="t('ChatStatusMessage.text.placeholder')"
          @blur="handleSetChatStatusMessage"
          size="small"
        ></NInput>
        <div class="mt-1 flex items-center justify-between gap-2">
          <NTooltip>
            <template #trigger>
              <NCheckbox
                size="small"
                :checked="ams.settings.autoSetStatusMessageEnabled"
                @update:checked="(value) => am.setAutoSetStatusMessageEnabled(value)"
              >
                {{ t('ChatStatusMessage.resetOnLogin.label') }}
              </NCheckbox>
            </template>
            <div class="max-w-64 text-xs">
              {{ t('ChatStatusMessage.resetOnLogin.description') }}
            </div>
          </NTooltip>
          <NButton
            :loading="isSetting"
            @mousedown.prevent
            @click="handleSetChatStatusMessage"
            type="primary"
            size="small"
            :disabled="isSetting"
            >{{ t('ChatStatusMessage.text.save') }}</NButton
          >
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
import { useTranslation } from 'i18next-vue'
import { NButton, NCheckbox, NInput, NTooltip, useMessage, useNotification } from 'naive-ui'
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
  if (isSetting.value) {
    return
  }

  if (!lcs.isConnected && text.value === ams.settings.statusMessage) {
    return
  }

  try {
    isSetting.value = true

    if (text.value !== ams.settings.statusMessage) {
      await am.setStatusMessage(text.value)
    }

    if (!lcs.isConnected) {
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
