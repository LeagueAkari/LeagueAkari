<template>
  <NModal
    transform-origin="center"
    size="small"
    preset="card"
    v-model:show="show"
    :auto-focus="false"
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
      <NScrollbar
        style="max-height: 60vh"
        :class="$style['markdown-text-scroll-wrapper']"
        trigger="none"
      >
        <div class="markdown-container markdown-body" v-html="markdownHtmlText"></div>
      </NScrollbar>
      <ContactChannels :channels="contactChannels?.channels ?? []" />
      <div class="button-group">
        <NButton
          v-if="externalDownloadUrl"
          tag="a"
          :href="externalDownloadUrl"
          target="_blank"
          rel="noreferrer"
          secondary
          size="small"
        >
          <template #icon>
            <NIcon><ExternalLinkIcon /></NIcon>
          </template>
          {{ t('notifications.updateModal.externalDownload') }}
        </NButton>
        <NCheckbox
          v-if="release.isNew && release.isUpdateSupported"
          @update:checked="(val) => emits('ignoreVersion', release!.version, val)"
          :disabled="updatePhase !== null"
          :checked="props.release?.version === props.ignoreVersion"
          size="small"
        >
          {{ t('notifications.updateModal.ignoreThisVersion') }}
        </NCheckbox>
        <span v-if="updateStatusText" class="update-status-text">
          {{ updateStatusText }}
        </span>
        <NButton
          v-if="release.isNew && release.isUpdateSupported && updatePhase !== null"
          secondary
          type="warning"
          size="small"
          @click="emits('cancelUpdate')"
        >
          {{ t('notifications.updateModal.cancelUpdate') }}
        </NButton>
        <NButton
          v-if="release.isNew && release.isUpdateSupported && updatePhase === 'waiting-for-restart'"
          type="primary"
          size="small"
          @click="emits('closeAndUpdate')"
        >
          {{ t('notifications.updateModal.waitingForRestart') }}
        </NButton>
        <NButton
          v-if="release.isNew && release.isUpdateSupported && updatePhase === 'download-failed'"
          type="primary"
          size="small"
          @click="emits('startDownload')"
        >
          {{ t('notifications.updateModal.retryUpdate') }}
        </NButton>
        <NButton
          v-if="release.isNew && release.isUpdateSupported && updatePhase === null"
          type="primary"
          size="small"
          @click="emits('startDownload')"
        >
          {{ t('notifications.updateModal.startUpdate') }}
        </NButton>
      </div>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import { markdownIt } from '@renderer-shared/utils/markdown'
import type { AkariContactChannels } from '@shared/shards/akari-api'
import type { SelfUpdateReleaseInfo, UpdateProgressInfo } from '@shared/shards/self-update'
import { ExternalLink as ExternalLinkIcon } from '@vicons/tabler'
import { useTranslation } from 'i18next-vue'
import { NButton, NCheckbox, NIcon, NModal, NScrollbar } from 'naive-ui'
import { computed } from 'vue'

import ContactChannels from './ContactChannels.vue'

const props = defineProps<{
  release: SelfUpdateReleaseInfo | null
  contactChannels: AkariContactChannels | null
  ignoreVersion: string | null
  updateProgressInfo: UpdateProgressInfo | null
}>()

const emits = defineEmits<{
  ignoreVersion: [version: string, ignore: boolean]
  startDownload: []
  cancelUpdate: []
  closeAndUpdate: []
}>()

const { t } = useTranslation()

const markdownHtmlText = computed(() => {
  return markdownIt.render(props.release?.description || t('notifications.updateModal.noUpdateMd'))
})

const updatePhase = computed(() => props.updateProgressInfo?.phase ?? null)

const updateStatusText = computed(() => {
  switch (updatePhase.value) {
    case 'downloading':
      return t('notifications.updateModal.downloading', {
        progress: ((props.updateProgressInfo?.downloadingProgress ?? 0) * 100).toFixed(0)
      })
    case 'download-failed':
      return t('notifications.updateModal.downloadFailed')
    default:
      return null
  }
})

const externalDownloadUrl = computed(() => {
  return props.release?.artifact?.downloadUrl ?? null
})

const show = defineModel<boolean>('show', { default: false })
</script>

<style scoped>
.update-status-text {
  color: rgba(0, 0, 0, 0.55);
  font-size: 12px;
  font-variant-numeric: tabular-nums;

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.55);
  }
}

.markdown-container {
  user-select: text;
  padding: 16px 20px;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
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
  margin-bottom: 12px;
  overflow: hidden;
  border-radius: 8px;
  background-color: color-mix(in srgb, var(--la-color-bg-primary) 94%, black);
}
</style>
