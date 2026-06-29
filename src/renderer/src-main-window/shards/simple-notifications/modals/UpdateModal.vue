<template>
  <NModal
    transform-origin="center"
    size="small"
    preset="card"
    v-model:show="show"
    :class="$style['update-modal']"
  >
    <template #header>
      <span class="card-header-title">
        <template v-if="release">
          {{
            release.isNew
              ? t('notifications.updateModal.newVersion')
              : t('notifications.updateModal.versionFeatures')
          }}
          {{ release.version }}
        </template>
        <template v-else>
          {{ t('notifications.updateModal.noUpdate') }}
        </template>
      </span>
    </template>
    <div v-if="release">
      <div v-if="release.isNew" class="para">
        {{
          t('notifications.updateModal.newVersionAvailable', {
            version: release.version,
            currentVersion: release.currentVersion
          })
        }}
      </div>
      <NScrollbar
        style="max-height: 60vh"
        :class="$style['markdown-text-scroll-wrapper']"
        trigger="none"
      >
        <div class="markdown-container markdown-body" v-html="markdownHtmlText"></div>
      </NScrollbar>
      <div class="button-group">
        <ExternalLink class="small-link" v-if="externalDownloadUrl" :href="externalDownloadUrl">
          {{ t('notifications.updateModal.externalDownload') }}
        </ExternalLink>
        <NCheckbox
          v-if="release.isNew"
          @update:checked="(val) => emits('ignoreVersion', release!.version, val)"
          :disabled="isUpdating"
          :checked="props.release?.version === props.ignoreVersion"
          size="small"
        >
          {{ t('notifications.updateModal.ignoreThisVersion') }}
        </NCheckbox>
        <NButton
          v-if="release.isNew && release.archiveFile"
          :loading="isUpdating"
          :disabled="isUpdating"
          size="small"
          type="primary"
          @click="emits('startDownload')"
        >
          {{ updateButtonText }}
        </NButton>
      </div>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import ExternalLink from '@renderer-shared/components/ExternalLink.vue'
import { markdownIt } from '@renderer-shared/utils/markdown'
import { LatestReleaseInfo } from '@shared/types/akari'
import { UpdateProgressInfo } from '@shared/shards/self-update'
import { useTranslation } from 'i18next-vue'
import { NButton, NCheckbox, NModal, NScrollbar } from 'naive-ui'
import { computed } from 'vue'

const props = defineProps<{
  release: LatestReleaseInfo | null
  ignoreVersion: string | null
  updateProgressInfo: UpdateProgressInfo | null
}>()

const emits = defineEmits<{
  ignoreVersion: [version: string, ignore: boolean]
  startDownload: []
}>()

const { t } = useTranslation()

const markdownHtmlText = computed(() => {
  return markdownIt.render(
    props.release
      ? props.release.description || t('notifications.updateModal.noUpdateMd')
      : t('notifications.updateModal.noUpdateMd')
  )
})

const isUpdating = computed(() => props.updateProgressInfo !== null)

const updateButtonText = computed(() => {
  if (!props.updateProgressInfo) {
    return t('notifications.updateModal.startUpdate')
  }

  switch (props.updateProgressInfo.phase) {
    case 'downloading':
      return t('notifications.updateModal.downloading', {
        progress: (props.updateProgressInfo.downloadingProgress * 100).toFixed(0)
      })
    case 'waiting-for-restart':
      return t('notifications.updateModal.waitingForRestart')
    case 'download-failed':
      return t('notifications.updateModal.downloadFailed')
    default:
      return t('notifications.updateModal.startUpdate')
  }
})

const externalDownloadUrl = computed(() => {
  if (!props.release) {
    return null
  }

  return props.release.archiveFile.downloadUrl
})

const show = defineModel<boolean>('show', { default: false })
</script>

<style scoped>
.para,
.small-link {
  font-size: 13px;
}

.markdown-container {
  user-select: text;
  border-radius: 4px;
  padding: 4px;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}
</style>

<style module>
.update-modal {
  width: 90%;
  min-width: 720px;
  max-width: 1106px;
}

.markdown-text-scroll-wrapper {
  margin-top: 12px;
  margin-bottom: 12px;
}
</style>
