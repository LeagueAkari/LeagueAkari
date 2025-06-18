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
          {{ release.isNew ? t('UpdateModal.newVersion') : t('UpdateModal.versionFeatures') }}
          {{ release.tag_name }}
        </template>
        <template v-else>
          {{ t('UpdateModal.noUpdate') }}
        </template>
      </span>
    </template>
    <div v-if="release">
      <div v-if="release.isNew" class="para">
        {{
          t('UpdateModal.newVersionAvailable', {
            version: release.tag_name,
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
        <ExternalLink
          class="small-link"
          v-if="release.archiveFile"
          :href="release.archiveFile.browser_download_url"
        >
          {{ t('UpdateModal.externalDownload') }}
        </ExternalLink>
        <NCheckbox
          v-if="release.isNew"
          @update:checked="(val) => emits('ignoreVersion', release!.tag_name, val)"
          :disabled="isUpdating"
          :checked="props.release?.tag_name === props.ignoreVersion"
          size="small"
        >
          {{ t('UpdateModal.ignoreThisVersion') }}
        </NCheckbox>
        <NButton
          v-if="release.isNew && release.archiveFile"
          :loading="isUpdating"
          size="small"
          type="primary"
          @click="emits('startDownload')"
        >
          {{ t('UpdateModal.startUpdate') }}
        </NButton>
      </div>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import ExternalLink from '@renderer-shared/components/ExternalLink.vue'
import { LatestReleaseWithMetadata } from '@renderer-shared/shards/remote-config/store'
import { markdownIt } from '@renderer-shared/utils/markdown'
import { useTranslation } from 'i18next-vue'
import { NButton, NCheckbox, NModal, NScrollbar } from 'naive-ui'
import { computed } from 'vue'

const props = defineProps<{
  release: LatestReleaseWithMetadata | null
  ignoreVersion: string | null
  isUpdating: boolean
}>()

const emits = defineEmits<{
  ignoreVersion: [version: string, ignore: boolean]
  startDownload: []
}>()

const { t } = useTranslation()

const markdownHtmlText = computed(() => {
  return markdownIt.render(props.release?.body || t('UpdateModal.noUpdateMd'))
})

const show = defineModel<boolean>('show', { default: false })
</script>

<style lang="less" scoped>
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

<style lang="less" module>
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
