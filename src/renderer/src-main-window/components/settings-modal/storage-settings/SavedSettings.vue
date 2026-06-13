<template>
  <NScrollbar class="h-full">
    <SettingsSection :title="t('SavedSettings.title')">
      <SettingsRow
        :label="t('SavedSettings.export.label')"
        :label-description="t('SavedSettings.export.description')"
        :label-width="400"
      >
        <NButton type="primary" secondary size="small" @click="handleExportSettings">
          {{ t('SavedSettings.export.button') }}
        </NButton>
      </SettingsRow>
      <SettingsRow
        :label="t('SavedSettings.import.label')"
        :label-description="t('SavedSettings.import.description')"
        :label-width="400"
      >
        <NButton type="primary" secondary size="small" @click="handleImportSettings">{{
          t('SavedSettings.import.button')
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
      message.success(() => t('SavedSettings.exported', { path: exportPath }))
    }
  } catch (error: any) {
    message.error(() => t('SavedSettings.errorExport', { reason: error.message }))
  }
}

// TODO I18N
const handleImportSettings = async () => {
  dialog.warning({
    title: () => t('SavedSettings.import.label'),
    content: () => t('SavedSettings.import.dialogWarning'),
    positiveText: t('SavedSettings.import.dialogPositiveText'),
    negativeText: t('SavedSettings.import.dialogNegativeText'),
    onPositiveClick: async () => {
      try {
        await s.importSettingsFromJsonFile()
      } catch (error: any) {
        if (error.code) {
          switch (error.code) {
            case 'InvalidSettingsFile':
            case 'InvalidSettingsData':
              message.error(() => t('SavedSettings.errorCode.InvalidSettingsFile'))
              break
            case 'InvalidDatabaseVersion':
              message.error(() => t('SavedSettings.errorCode.InvalidDatabaseVersion'))
              break
            default:
              message.error(() =>
                t('SavedSettings.errorCode.importDefault', { reason: error.message })
              )
              break
          }
        } else {
          message.error(() => t('SavedSettings.errorCode.importDefault', { reason: error.message }))
        }
      }
    }
  })
}
</script>
