<template>
  <NModal
    transform-origin="center"
    size="small"
    preset="card"
    v-model:show="show"
    :class="$style['settings-modal']"
  >
    <template #header>
      <span class="card-header-title"
        >{{ release?.isNew ? t('UpdateModal.newVersion') : t('UpdateModal.versionFeatures') }}
        {{ release?.tag_name }}</span
      >
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
      <div>
        <a
          v-if="release.archiveFile?.browser_download_url"
          class="small-link"
          target="_blank"
          :href="release.archiveFile.browser_download_url"
        >
          {{ t('UpdateModal.download') }}</a
        >
      </div>
      <NScrollbar
        style="max-height: 60vh"
        :class="$style['markdown-text-scroll-wrapper']"
        trigger="none"
      >
        <div class="markdown-container markdown-body" v-html="markdownHtmlText"></div>
      </NScrollbar>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import { LatestReleaseWithMetadata } from '@renderer-shared/shards/remote-config/store'
import { markdownIt } from '@renderer-shared/utils/markdown'
import { useTranslation } from 'i18next-vue'
import { NModal, NScrollbar } from 'naive-ui'
import { computed } from 'vue'

const props = defineProps<{
  release: LatestReleaseWithMetadata | null
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
</style>

<style lang="less" module>
.settings-modal {
  width: 90%;
  max-width: 1024px;
}

.markdown-text-scroll-wrapper {
  margin-top: 12px;
  margin-bottom: 12px;
}
</style>
