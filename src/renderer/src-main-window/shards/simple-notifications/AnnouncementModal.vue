<template>
  <NModal
    transform-origin="center"
    size="small"
    preset="card"
    v-model:show="show"
    :class="$style['ann-modal']"
  >
    <template #header>
      <span class="card-header-title">{{ t('AnnouncementModal.title') }}</span>
    </template>
    <div>
      <NScrollbar
        style="max-height: 60vh"
        :class="$style['markdown-text-scroll-wrapper']"
        trigger="none"
      >
        <div class="markdown-container markdown-body" v-html="markdownHtmlText"></div>
      </NScrollbar>
      <div style="display: flex; justify-content: flex-end" v-if="announcement">
        <NButton type="primary" v-if="hasRead" @click="show = false" size="small">{{
          t('AnnouncementModal.close')
        }}</NButton>
        <NButton type="primary" v-else @click="emits('read', announcement.uniqueId)" size="small">{{
          t('AnnouncementModal.read')
        }}</NButton>
      </div>
    </div>
  </NModal>
</template>

<script setup lang="ts">
import { Announcement } from '@renderer-shared/shards/remote-config/store'
import { markdownIt } from '@renderer-shared/utils/markdown'
import { useTranslation } from 'i18next-vue'
import { NButton, NModal, NScrollbar } from 'naive-ui'
import { computed } from 'vue'

const props = defineProps<{
  announcement: Announcement | null
  hasRead: boolean
}>()

const emits = defineEmits<{
  read: [sha: string]
}>()

const { t } = useTranslation()

const markdownHtmlText = computed(() => {
  return markdownIt.render(props.announcement?.content || t('AnnouncementModal.noAnnouncementMd'))
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
}
</style>

<style lang="less" module>
.ann-modal {
  width: 90%;
  min-width: 720px;
  max-width: 1106px;
}

.markdown-text-scroll-wrapper {
  margin-top: 12px;
  margin-bottom: 12px;
}

.no-announcement {
  margin-top: 12px;
}
</style>
