<template>
  <NModal
    transform-origin="center"
    size="small"
    preset="card"
    v-model:show="show"
    :class="$style['ann-modal']"
  >
    <template #header>
      <span class="card-header-title">{{ t('notices.modal.title') }}</span>
    </template>
    <div>
      <NScrollbar
        style="max-height: 60vh"
        :class="$style['markdown-text-scroll-wrapper']"
        trigger="none"
      >
        <div class="markdown-container markdown-body" v-html="markdownHtmlText"></div>
      </NScrollbar>
      <div style="display: flex; justify-content: flex-end" v-if="notice">
        <NButton type="primary" v-if="hasRead" @click="show = false" size="small">{{
          t('notices.modal.close')
        }}</NButton>
        <NButton type="primary" v-else @click="emits('read', notice.revision)" size="small">{{
          t('notices.modal.read')
        }}</NButton>
      </div>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import { markdownIt } from '@renderer-shared/utils/markdown'
import type { AkariNotice } from '@shared/shards/akari-api'
import { useTranslation } from 'i18next-vue'
import { NButton, NModal, NScrollbar } from 'naive-ui'
import { computed } from 'vue'

const props = defineProps<{
  notice: AkariNotice | null
  hasRead: boolean
}>()

const emits = defineEmits<{
  read: [sha: string]
}>()

const { t } = useTranslation()

const markdownHtmlText = computed(() => {
  return markdownIt.render(props.notice?.content || t('notices.modal.noNoticeMd'))
})

const show = defineModel<boolean>('show', { default: false })
</script>

<style scoped>
.markdown-container {
  user-select: text;
  border-radius: 4px;
}
</style>

<style module>
.ann-modal {
  width: 90%;
  min-width: 720px;
  max-width: 1106px;
}

.markdown-text-scroll-wrapper {
  margin-top: 12px;
  margin-bottom: 12px;
}

.no-notice {
  margin-top: 12px;
}
</style>
