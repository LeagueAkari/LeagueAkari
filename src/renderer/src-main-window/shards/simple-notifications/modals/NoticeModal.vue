<template>
  <NModal
    transform-origin="center"
    size="small"
    preset="card"
    v-model:show="show"
    :auto-focus="false"
    :class="$style['ann-modal']"
  >
    <template #header>
      <div class="flex min-w-0 flex-col gap-0.5">
        <span class="card-header-title">{{ t('notices.modal.title') }}</span>
        <div
          v-if="noticeUpdatedAt"
          class="flex max-w-full min-w-0 items-center gap-1.5 text-xs font-normal text-black/60 dark:text-white/60"
        >
          <NTooltip :keep-alive-on-hover="false" placement="top-start">
            <template #trigger>
              <time class="shrink-0" :datetime="notice?.updatedAt">
                {{ t('notices.modal.updatedAt', { time: noticeRelativeTime }) }}
              </time>
            </template>
            {{ noticeUpdatedAt }}
          </NTooltip>
          <template v-if="notice?.summary">
            <span class="shrink-0" aria-hidden="true">·</span>
            <NTooltip :keep-alive-on-hover="false" placement="top-start">
              <template #trigger>
                <span class="block min-w-0 truncate">
                  {{ notice.summary }}
                </span>
              </template>
              <span class="block max-w-96 wrap-break-word whitespace-normal">
                {{ notice.summary }}
              </span>
            </NTooltip>
          </template>
        </div>
      </div>
    </template>
    <div>
      <NScrollbar
        style="max-height: 60vh"
        :class="$style['markdown-text-scroll-wrapper']"
        trigger="none"
      >
        <div class="markdown-container markdown-body" v-html="markdownHtmlText"></div>
      </NScrollbar>
      <ContactChannels :channels="contactChannels?.channels ?? []" />
      <div v-if="notice" class="flex justify-end">
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
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { markdownIt } from '@renderer-shared/utils/markdown'
import type { AkariContactChannels, AkariNotice } from '@shared/shards/akari-api'
import { useIntervalFn } from '@vueuse/core'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { NButton, NModal, NScrollbar, NTooltip } from 'naive-ui'
import { computed, ref } from 'vue'

import ContactChannels from './ContactChannels.vue'

const props = defineProps<{
  notice: AkariNotice | null
  contactChannels: AkariContactChannels | null
  hasRead: boolean
}>()

const emits = defineEmits<{
  read: [sha: string]
}>()

const { t } = useTranslation()
const appCommon = useAppCommonStore()

const relativeTimeNow = ref(Date.now())
useIntervalFn(() => (relativeTimeNow.value = Date.now()), 60_000)

const noticeTime = computed(() => {
  if (!props.notice?.updatedAt) {
    return null
  }

  const value = dayjs(props.notice.updatedAt)
  return value.isValid() ? value : null
})

const noticeRelativeTime = computed(() => {
  return (
    noticeTime.value?.locale(appCommon.settings.locale.toLowerCase()).from(relativeTimeNow.value) ??
    ''
  )
})

const noticeUpdatedAt = computed(() => {
  return noticeTime.value?.format('YYYY-MM-DD HH:mm:ss Z') ?? ''
})

const markdownHtmlText = computed(() => {
  return markdownIt.render(props.notice?.content || t('notices.modal.noNoticeMd'))
})

const show = defineModel<boolean>('show', { default: false })
</script>

<style scoped>
.markdown-container {
  user-select: text;
  padding: 16px 20px;
}
</style>

<style module>
.ann-modal {
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

.no-notice {
  margin-top: 12px;
}
</style>
