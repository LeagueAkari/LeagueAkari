<template>
  <HorizontalExpand :show="tasks.length > 0" class="h-full">
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
                    'border border-blue-800/20 bg-blue-600 shadow-xs dark:border-blue-100/20 dark:bg-blue-300',
                    'font-[inherit] text-xs leading-none font-normal whitespace-nowrap text-white dark:text-blue-950',
                    'outline-hidden transition-colors hover:bg-blue-500 active:bg-blue-700',
                    'dark:hover:bg-blue-200 dark:active:bg-blue-400',
                    'focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1',
                    '[-webkit-app-region:no-drag]',
                    compact ? 'w-7 justify-center p-0' : 'px-2'
                  ]"
                  :aria-label="triggerLabel"
                  aria-haspopup="dialog"
                >
                  <NIcon
                    class="shrink-0 text-sm text-inherit"
                    :class="{ 'animate-spin [animation-duration:2s]': hasInProgressTask }"
                    aria-hidden="true"
                  >
                    <ArrowSync20FilledIcon />
                  </NIcon>
                  <span v-if="!compact">{{ triggerLabel }}</span>
                </button>
              </template>
              {{ triggerLabel }}
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
          :aria-label="t('titlebar.actions.backgroundTasks')"
        >
          <div class="px-3 py-2 text-sm font-semibold">
            {{ t('backgroundTasks.taskTitle', { count: tasks.length }) }}
          </div>

          <NScrollbar class="max-h-[min(26rem,calc(100vh-6rem))]">
            <div class="flex flex-col p-1">
              <article
                v-for="task in tasks"
                :key="task.id"
                class="min-h-12 rounded-md px-2 py-2 transition-colors"
                :class="getTaskItemHoverClass(task.status)"
              >
                <div class="flex min-w-0 items-start gap-2">
                  <span
                    class="mt-1 size-1.5 shrink-0 rounded-full"
                    :class="[
                      getTaskIndicatorClass(task.status),
                      { 'animate-pulse': task.inProgress }
                    ]"
                    aria-hidden="true"
                  />

                  <div class="flex min-w-0 flex-1 flex-col">
                    <span class="truncate text-xs leading-4 font-medium">
                      <component :is="renderText(task.name)" />
                    </span>
                    <span class="truncate text-xs leading-4 text-black/50 dark:text-white/50">
                      <component :is="renderText(task.description)" />
                    </span>
                  </div>

                  <span
                    v-if="task.progress !== null"
                    class="shrink-0 text-xs leading-4 font-semibold tabular-nums"
                    :class="getTaskStatusTextClass(task.status)"
                  >
                    {{ formatProgress(task.progress) }}
                  </span>
                </div>

                <div v-if="task.progress !== null" class="mt-1.5 pl-3.5">
                  <NProgress
                    class="w-full"
                    type="line"
                    :height="3"
                    :percentage="task.progress * 100"
                    :show-indicator="false"
                    :status="task.status"
                    :processing="task.inProgress"
                  />
                </div>

                <div
                  v-if="task.actions.length"
                  class="mt-2 ml-3.5 flex flex-wrap justify-end gap-1"
                >
                  <NButton
                    v-for="(action, index) in task.actions"
                    :key="index"
                    size="tiny"
                    v-bind="action.buttonProps"
                    @click="action.callback"
                  >
                    <component :is="renderText(action.label)" />
                  </NButton>
                </div>
              </article>
            </div>
          </NScrollbar>
        </section>
      </NPopover>
    </div>
  </HorizontalExpand>
</template>

<script setup lang="tsx">
import HorizontalExpand from '@renderer-shared/components/HorizontalExpand.vue'
import type { BackgroundTask } from '@renderer-shared/shards/background-tasks/store'
import { ArrowSync20Filled as ArrowSync20FilledIcon } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NPopover, NProgress, NScrollbar, NTooltip } from 'naive-ui'
import { computed, type VNodeChild } from 'vue'

const TITLE_BAR_POPOVER_Z_INDEX = 75000
const popoverThemeOverrides = {
  boxShadow: 'none'
}

const props = withDefaults(
  defineProps<{
    compact?: boolean
    tasks: readonly BackgroundTask[]
  }>(),
  {
    compact: false
  }
)
const popoverShow = defineModel<boolean>('open', { default: false })

const { t } = useTranslation()
const triggerLabel = computed(
  () => `${t('titlebar.actions.backgroundTasks')} (${props.tasks.length})`
)
const hasInProgressTask = computed(() => props.tasks.some((task) => task.inProgress))

const getTaskItemHoverClass = (status: BackgroundTask['status']) => {
  switch (status) {
    case 'error':
      return 'hover:bg-red-500/10'
    case 'warning':
      return 'hover:bg-amber-500/10'
    default:
      return 'hover:bg-black/5 dark:hover:bg-white/5'
  }
}

const getTaskIndicatorClass = (status: BackgroundTask['status']) => {
  switch (status) {
    case 'error':
      return 'bg-red-500 shadow-sm'
    case 'warning':
      return 'bg-amber-500 shadow-sm'
    default:
      return 'bg-black/40 shadow-sm dark:bg-white/40'
  }
}

const getTaskStatusTextClass = (status: BackgroundTask['status']) => {
  switch (status) {
    case 'error':
      return 'text-red-500 dark:text-red-400'
    case 'warning':
      return 'text-amber-600 dark:text-amber-400'
    default:
      return 'text-black/60 dark:text-white/60'
  }
}

const formatProgress = (progress: number) => `${Math.round(progress * 100)}%`

const renderText = (node: string | (() => VNodeChild)) => {
  if (typeof node === 'string') {
    return () => <span>{node}</span>
  }

  return node
}
</script>
