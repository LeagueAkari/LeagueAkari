<template>
  <NPopover
    raw
    trigger="hover"
    :placement="placement"
    :show-arrow="false"
    :keep-alive-on-hover="true"
  >
    <template #trigger>
      <slot />
    </template>

    <div
      class="w-120 max-w-[calc(100vw-32px)] overflow-hidden rounded bg-neutral-100 shadow-lg shadow-black/15 dark:bg-neutral-900 dark:shadow-black/40"
    >
      <NAlert type="error" :show-icon="false" class="w-full">
        <template #header>
          <div class="flex w-full min-w-0 items-baseline justify-between gap-4">
            <span class="min-w-0">{{ t('lastErrorTitle') }}</span>
            <time
              class="shrink-0 text-xs font-normal text-black/40 tabular-nums dark:text-white/38"
            >
              {{ occurredAtText }}
            </time>
          </div>
        </template>

        <NScrollbar class="max-h-72">
          <pre
            class="m-0 pr-3 font-mono text-xs leading-5 wrap-break-word whitespace-pre-wrap select-text"
            >{{ error.error }}</pre>
        </NScrollbar>
      </NAlert>
    </div>
  </NPopover>
</template>

<script setup lang="ts">
import type { InGameSendCustomTemplateLastError } from '@shared/shards/in-game-send'
import { useTranslation } from 'i18next-vue'
import { NAlert, NPopover, NScrollbar, type PopoverPlacement } from 'naive-ui'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    error: InGameSendCustomTemplateLastError
    placement?: PopoverPlacement
  }>(),
  {
    placement: 'bottom-end'
  }
)

const { t } = useTranslation('renderer', {
  keyPrefix: 'toolkit.inGameSend.presets.customTemplate'
})

const occurredAtText = computed(() => new Date(props.error.occurredAt).toLocaleString())
</script>
