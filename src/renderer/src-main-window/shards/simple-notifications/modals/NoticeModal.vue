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
        <section
          v-if="contactChannels?.channels.length"
          class="mt-3 border-t border-black/10 pt-2.5 dark:border-white/10"
        >
          <div class="grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-1.5">
            <div
              v-for="channel in contactChannels.channels"
              :key="channel.id"
              class="border-akari-500/25 bg-akari-500/5 hover:border-akari-500/45 hover:bg-akari-500/10 dark:border-akari-400/20 dark:bg-akari-400/8 dark:hover:border-akari-400/40 dark:hover:bg-akari-400/12 flex min-w-0 items-center gap-2.5 rounded-md border px-2.5 py-2 shadow-xs transition-colors"
            >
              <div
                class="flex size-8 shrink-0 items-center justify-center rounded-md bg-black/5 dark:bg-white/8"
              >
                <NIcon :size="18" :class="contactPlatformIconClasses[channel.platform]">
                  <component :is="contactPlatformIcons[channel.platform]" />
                </NIcon>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex min-w-0 items-start justify-between gap-2">
                  <div class="flex min-w-0 items-center gap-1.5">
                    <span class="truncate text-sm font-medium text-black/85 dark:text-white/85">
                      {{ channel.name }}
                    </span>
                    <NTag :bordered="false" size="tiny">
                      {{ t(`notices.modal.contacts.platforms.${channel.platform}`) }}
                    </NTag>
                  </div>
                  <ExternalLink
                    class="shrink-0 text-xs text-blue-600 dark:text-blue-400"
                    :href="channel.url"
                    :aria-label="t('notices.modal.contacts.openChannel', { name: channel.name })"
                  >
                    {{ t('notices.modal.contacts.open') }}
                  </ExternalLink>
                </div>
                <div
                  class="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-black/60 dark:text-white/60"
                >
                  <span class="truncate select-text">{{ channel.identifier }}</span>
                  <template v-if="channel.password">
                    <span class="shrink-0 text-black/25 dark:text-white/25" aria-hidden="true">
                      ·
                    </span>
                    <span class="shrink-0 select-text">
                      {{ t('notices.modal.contacts.password', { password: channel.password }) }}
                    </span>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </section>
      </NScrollbar>
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
import ExternalLink from '@renderer-shared/components/ExternalLink.vue'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { markdownIt } from '@renderer-shared/utils/markdown'
import type {
  AkariContactChannelPlatform,
  AkariContactChannels,
  AkariNotice
} from '@shared/shards/akari-api'
import { Discord, Envelope, Globe, Link, Qq, Telegram } from '@vicons/fa'
import { useIntervalFn } from '@vueuse/core'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NModal, NScrollbar, NTag, NTooltip } from 'naive-ui'
import { type Component, computed, ref } from 'vue'

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

const contactPlatformIcons = {
  qq: Qq,
  telegram: Telegram,
  discord: Discord,
  email: Envelope,
  website: Globe,
  other: Link
} satisfies Record<AkariContactChannelPlatform, Component>

const contactPlatformIconClasses = {
  qq: 'text-blue-500',
  telegram: 'text-blue-400',
  discord: 'text-indigo-500',
  email: 'text-emerald-500',
  website: 'text-violet-500',
  other: 'text-neutral-500'
} satisfies Record<AkariContactChannelPlatform, string>

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
