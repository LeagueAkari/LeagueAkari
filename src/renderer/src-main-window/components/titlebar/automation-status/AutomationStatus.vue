<template>
  <HorizontalExpand :show="automations.length > 0" appear class="h-full">
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
          <span class="automation-status-trigger">
            <NTooltip :disabled="!compact" :z-index="TITLE_BAR_POPOVER_Z_INDEX">
              <template #trigger>
                <button
                  type="button"
                  class="automation-status-button"
                  :class="{ 'is-compact': compact }"
                  :aria-label="automationTriggerLabel"
                  :aria-expanded="popoverShow"
                  aria-haspopup="dialog"
                >
                  <NIcon class="automation-status-button__icon" aria-hidden="true">
                    <Flash20FilledIcon />
                  </NIcon>
                  <span>{{ automationTriggerLabel }}</span>
                </button>
              </template>
              {{ automationTriggerLabel }}
            </NTooltip>
          </span>
        </template>

        <section
          class="automation-status-panel w-80 overflow-hidden rounded-lg border border-solid border-black/10 bg-neutral-100 text-(--la-color-text-primary) dark:border-white/10 dark:bg-neutral-900"
          role="dialog"
          :aria-label="t('titlebar.automation.title')"
        >
          <div class="px-3.5 pt-3 pb-2 text-[13px] leading-4.5 font-semibold">
            {{ t('titlebar.automation.title') }}
          </div>

          <NScrollbar style="max-height: min(420px, calc(100vh - 100px))">
            <div class="p-1">
              <button
                v-for="automation in automations"
                :key="automation.id"
                type="button"
                class="automation-status-item flex min-h-10.5 w-full cursor-pointer appearance-none items-center gap-2 rounded-sm border-0 bg-transparent px-2 py-1.5 text-left text-inherit outline-0 hover:bg-black/7 active:bg-black/10 dark:hover:bg-white/7 dark:active:bg-white/10"
                @click="handleNavigate(automation)"
              >
                <span
                  class="automation-status-item__indicator size-1.5 shrink-0 rounded-full bg-(--la-color-link)"
                  aria-hidden="true"
                />
                <span class="flex min-w-0 flex-1 flex-col">
                  <span class="truncate text-xs leading-4.25 font-medium">{{
                    automation.label
                  }}</span>
                  <span
                    v-if="automation.detail"
                    class="truncate text-[10px] leading-3.75 text-black/50 dark:text-white/50"
                  >
                    {{ automation.detail }}
                  </span>
                </span>
                <NIcon class="shrink-0 text-xs text-black/35 dark:text-white/35" aria-hidden="true">
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
import { useAkariNavigation } from '@renderer-shared/shards/akari-navigation'
import {
  ChevronRight12Regular as ChevronRight12RegularIcon,
  Flash20Filled as Flash20FilledIcon
} from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NIcon, NPopover, NScrollbar, NTooltip } from 'naive-ui'
import { computed, ref } from 'vue'

import { navigateToSetting } from '@main-window/settings-navigation'

import { type EnabledAutomation, useEnabledAutomations } from './use-enabled-automations'

const TITLE_BAR_POPOVER_Z_INDEX = 75000
const popoverThemeOverrides = {
  boxShadow: 'none'
}

defineProps<{ compact: boolean }>()

const { t } = useTranslation()
const navigation = useAkariNavigation()
const automations = useEnabledAutomations()
const popoverShow = ref(false)
const automationTriggerLabel = computed(() =>
  t('titlebar.automation.trigger', { count: automations.value.length })
)

const handleNavigate = (automation: EnabledAutomation) => {
  popoverShow.value = false
  void navigateToSetting(navigation, automation.targetId, automation.navigationOptions)
}
</script>

<style scoped>
.automation-status-trigger {
  display: flex;
}

.automation-status-button {
  display: flex;
  height: 24px;
  padding: 0 8px;
  appearance: none;
  flex-shrink: 0;
  align-items: center;
  gap: 5px;
  box-sizing: border-box;
  color: var(--la-color-bg-primary);
  border: 1px solid color-mix(in oklch, var(--la-color-link) 88%, black);
  border-radius: 6px;
  outline: 0;
  background-color: var(--la-color-link);
  box-shadow:
    0 1px 2px color-mix(in oklch, black 18%, transparent),
    inset 0 1px 0 color-mix(in oklch, white 18%, transparent);
  font: inherit;
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background-color 0.2s,
    color 0.2s,
    box-shadow 0.2s;
  -webkit-app-region: no-drag;
}

.automation-status-button:hover,
.automation-status-button[aria-expanded='true'] {
  border-color: color-mix(in oklch, var(--la-color-link) 82%, black);
  background-color: color-mix(in oklch, var(--la-color-link) 88%, white);
}

.automation-status-button:active {
  background-color: color-mix(in oklch, var(--la-color-link) 88%, black);
}

.automation-status-button:focus-visible {
  border-color: color-mix(in oklch, var(--la-color-link) 70%, transparent);
  box-shadow: 0 0 0 2px color-mix(in oklch, var(--la-color-link) 20%, transparent);
}

.automation-status-button__icon {
  flex-shrink: 0;
  color: inherit;
  font-size: 14px;
}

.automation-status-button.is-compact {
  width: 30px;
  padding: 0;
  justify-content: center;

  .automation-status-button__icon {
    font-size: 15px;
  }

  span {
    display: none;
  }
}

.automation-status-panel {
  -webkit-app-region: no-drag;
}

.automation-status-item {
  box-sizing: border-box;
  font: inherit;
}

.automation-status-item:focus-visible {
  box-shadow: inset 0 0 0 2px color-mix(in oklch, var(--la-color-link) 60%, transparent);
}

.automation-status-item__indicator {
  box-shadow: 0 0 6px color-mix(in oklch, var(--la-color-link) 55%, transparent);
}
</style>
