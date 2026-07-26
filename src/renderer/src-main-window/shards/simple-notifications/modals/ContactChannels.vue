<template>
  <section v-if="channels.length" class="mb-3 border-t border-black/10 pt-2.5 dark:border-white/10">
    <div class="grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-1.5">
      <div
        v-for="channel in channels"
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
          <div class="flex min-w-0 items-start gap-2">
            <div class="flex min-w-0 flex-1 items-center gap-1.5">
              <NEllipsis
                class="min-w-0 flex-1 text-sm font-medium text-black/85 dark:text-white/85"
              >
                {{ channel.name }}
              </NEllipsis>
              <NTag class="shrink-0" :bordered="false" size="tiny">
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
            class="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-black/60 dark:text-white/60"
          >
            <CopyableText class="contact-copyable" :text="channel.identifier" :icon-size="13">
              <NEllipsis class="block min-w-0 select-text">
                {{ channel.identifier }}
              </NEllipsis>
            </CopyableText>
            <template v-if="channel.password">
              <span class="shrink-0 text-black/25 dark:text-white/25" aria-hidden="true">·</span>
              <CopyableText class="contact-copyable" :text="channel.password" :icon-size="13">
                <NEllipsis class="block min-w-0 select-text">
                  {{ t('notices.modal.contacts.password', { password: channel.password }) }}
                </NEllipsis>
              </CopyableText>
            </template>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import CopyableText from '@renderer-shared/components/CopyableText.vue'
import ExternalLink from '@renderer-shared/components/ExternalLink.vue'
import type { AkariContactChannel, AkariContactChannelPlatform } from '@shared/shards/akari-api'
import { Discord, Envelope, Globe, Link, Qq, Telegram } from '@vicons/fa'
import { useTranslation } from 'i18next-vue'
import { NEllipsis, NIcon, NTag } from 'naive-ui'
import type { Component } from 'vue'

defineProps<{
  channels: AkariContactChannel[]
}>()

const { t } = useTranslation()

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
</script>

<style scoped>
.contact-copyable {
  min-width: 0;
  max-width: 100%;
  flex: 0 1 auto;
}

.contact-copyable :deep(.copyable__text) {
  min-width: 0;
  flex: 0 1 auto;
  margin-right: 4px;
}

.contact-copyable :deep(.copyable__icon) {
  flex-shrink: 0;
}
</style>
