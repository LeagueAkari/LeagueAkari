<template>
  <HorizontalExpand :show="items.length > 0" class="h-full">
    <div class="flex h-full items-center pr-1">
      <NPopover
        v-model:show="popoverShow"
        raw
        trigger="click"
        placement="bottom-end"
        :show-arrow="false"
        :theme-overrides="popoverThemeOverrides"
        :z-index="TITLE_BAR_POPOVER_Z_INDEX"
      >
        <template #trigger>
          <span class="flex">
            <NTooltip :disabled="!compact" :z-index="TITLE_BAR_POPOVER_Z_INDEX">
              <template #trigger>
                <button
                  type="button"
                  :class="[
                    'flex h-6 shrink-0 cursor-pointer appearance-none items-center gap-1 rounded-md',
                    'border border-white/20 bg-(--la-color-link) shadow-xs dark:border-black/10',
                    'font-[inherit] text-xs leading-none font-normal whitespace-nowrap text-(--la-color-bg-primary)',
                    'outline-hidden transition hover:brightness-105 active:brightness-95',
                    'focus-visible:ring-2 focus-visible:ring-(--la-color-link) focus-visible:ring-offset-1',
                    '[-webkit-app-region:no-drag]',
                    compact ? 'w-7 justify-center p-0' : 'px-2'
                  ]"
                  :aria-label="automationTriggerLabel"
                  aria-haspopup="dialog"
                >
                  <NIcon class="shrink-0 text-sm text-inherit" aria-hidden="true">
                    <Flash20FilledIcon />
                  </NIcon>
                  <span v-if="!compact">{{ automationTriggerLabel }}</span>
                </button>
              </template>
              {{ automationTriggerLabel }}
            </NTooltip>
          </span>
        </template>

        <section
          :class="[
            'w-80 overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg',
            'text-(--la-color-text-primary) dark:border-white/10 dark:bg-neutral-900',
            '[-webkit-app-region:no-drag]'
          ]"
          role="dialog"
          :aria-label="t('titlebar.automation.title')"
        >
          <div class="px-3 py-2 text-sm font-semibold">
            {{ t('titlebar.automation.title') }}
          </div>

          <NScrollbar class="max-h-[min(26rem,calc(100vh-6rem))]">
            <div class="p-1">
              <button
                v-for="item in items"
                :key="item.id"
                type="button"
                :class="[
                  'flex min-h-10 w-full cursor-pointer appearance-none items-center gap-2 rounded-md',
                  'border-0 bg-transparent px-2 py-1.5 text-left font-[inherit] text-xs text-inherit',
                  'outline-hidden transition-colors hover:bg-black/5 active:bg-black/10',
                  'focus-visible:ring-2 focus-visible:ring-(--la-color-link) focus-visible:ring-inset',
                  'dark:hover:bg-white/5 dark:active:bg-white/10'
                ]"
                @click="handleSelect(item.id)"
              >
                <span
                  class="size-1.5 shrink-0 rounded-full bg-(--la-color-link) shadow-sm"
                  aria-hidden="true"
                />
                <span class="flex min-w-0 flex-1 flex-col">
                  <span class="truncate leading-4 font-medium">{{ item.label }}</span>
                  <span
                    v-if="item.detail"
                    class="truncate leading-4 text-black/50 dark:text-white/50"
                  >
                    {{ item.detail }}
                  </span>
                </span>
                <NIcon class="shrink-0 text-xs text-black/40 dark:text-white/40" aria-hidden="true">
                  <ChevronRight12RegularIcon />
                </NIcon>
              </button>
            </div>
          </NScrollbar>
        </section>
      </NPopover>
    </div>
  </HorizontalExpand>
</template>

<script setup lang="ts">
import HorizontalExpand from '@renderer-shared/components/HorizontalExpand.vue'
import {
  ChevronRight12Regular as ChevronRight12RegularIcon,
  Flash20Filled as Flash20FilledIcon
} from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NIcon, NPopover, NScrollbar, NTooltip } from 'naive-ui'
import { computed } from 'vue'

import type { AutomationStatusItem } from './types'

const TITLE_BAR_POPOVER_Z_INDEX = 75000
const popoverThemeOverrides = {
  boxShadow: 'none'
}

const props = defineProps<{
  compact: boolean
  items: readonly AutomationStatusItem[]
}>()
const emit = defineEmits<{
  select: [id: string]
}>()
const popoverShow = defineModel<boolean>('open', { default: false })

const { t } = useTranslation()
const automationTriggerLabel = computed(() =>
  t('titlebar.automation.trigger', { count: props.items.length })
)

const handleSelect = (id: string) => {
  popoverShow.value = false
  emit('select', id)
}
</script>
