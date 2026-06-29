<template>
  <NScrollbar class="h-full">
    <SettingsSection :title="t('settings.savedSettings.title')">
      <SettingsRow
        :label="t('settings.savedSettings.export.label')"
        :label-description="t('settings.savedSettings.export.description')"
        :label-width="400"
      >
        <NButton type="primary" secondary size="small" @click="handleExportSettings">
          {{ t('settings.savedSettings.export.button') }}
        </NButton>
      </SettingsRow>
      <SettingsRow
        :label="t('settings.savedSettings.import.label')"
        :label-description="t('settings.savedSettings.import.description')"
        :label-width="400"
      >
        <NButton type="primary" secondary size="small" @click="handleImportSettings">{{
          t('settings.savedSettings.import.button')
        }}</NButton>
      </SettingsRow>
    </SettingsSection>
  </NScrollbar>
</template>

<script setup lang="ts">
import SettingsRow from '@renderer-shared/components/SettingsRow.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useInstance } from '@renderer-shared/shards'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { useTranslation } from 'i18next-vue'
import { NButton, NScrollbar, useDialog, useMessage } from 'naive-ui'

const { t } = useTranslation()
const s = useInstance(SettingUtilsRenderer)

const dialog = useDialog()
const message = useMessage()

const handleExportSettings = async () => {
  try {
    const exportPath = await s.exportSettingsToJsonFile()

    if (exportPath) {
      message.success(() => t('settings.savedSettings.exported', { path: exportPath }))
    }
  } catch (error: any) {
    message.error(() => t('settings.savedSettings.errorExport', { reason: error.message }))
  }
}

// TODO I18N
const handleImportSettings = async () => {
  dialog.warning({
    title: () => t('settings.savedSettings.import.label'),
    content: () => t('settings.savedSettings.import.dialogWarning'),
    positiveText: t('settings.savedSettings.import.dialogPositiveText'),
    negativeText: t('settings.savedSettings.import.dialogNegativeText'),
    onPositiveClick: async () => {
      try {
        await s.importSettingsFromJsonFile()
      } catch (error: any) {
        if (error.code) {
          switch (error.code) {
            case 'InvalidSettingsFile':
            case 'InvalidSettingsData':
              message.error(() => t('settings.savedSettings.errorCode.InvalidSettingsFile'))
              break
            case 'InvalidDatabaseVersion':
              message.error(() => t('settings.savedSettings.errorCode.InvalidDatabaseVersion'))
              break
            default:
              message.error(() =>
                t('settings.savedSettings.errorCode.importDefault', { reason: error.message })
              )
              break
          }
        } else {
          message.error(() =>
            t('settings.savedSettings.errorCode.importDefault', { reason: error.message })
          )
        }
      }
    }
  })
}
</script>
