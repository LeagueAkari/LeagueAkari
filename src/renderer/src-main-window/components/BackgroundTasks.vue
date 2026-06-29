<template>
  <div
    class="flex flex-col gap-2 rounded border border-black/10 bg-(--la-background-color-primary) p-2 dark:border-white/13"
  >
    <div class="mb-1 px-2 text-sm font-bold">
      {{ t('backgroundTasks.taskTitle', { count: bts.tasks.length }) }}
    </div>
    <template v-if="bts.tasks.length > 0">
      <NScrollbar style="max-height: calc(100vh - 80px)">
        <div
          :class="[
            task.status === 'error'
              ? 'bg-red-500/10 dark:bg-red-500/12.5'
              : 'bg-black/5 dark:bg-white/6',
            'w-80 rounded-sm p-2'
          ]"
          v-for="task of bts.tasks"
          :key="task.id"
        >
          <div class="text-sm">
            <component :is="renderText(task.name)" />
          </div>
          <NProgress
            v-if="task.progress !== null"
            class="mt-2"
            type="line"
            :border-radius="0"
            :percentage="task.progress * 100"
            :status="task.status"
          >
            {{ (task.progress * 100).toFixed(2) }}%
          </NProgress>
          <div class="mt-2 text-xs text-black/70 dark:text-white/80">
            <component :is="renderText(task.description)" />
          </div>
          <div class="mt-2 flex flex-wrap justify-end gap-1" v-if="task.actions.length">
            <NButton
              size="tiny"
              v-for="action of task.actions"
              @click="action.callback"
              v-bind="action.buttonProps"
            >
              <component :is="renderText(action.label)" />
            </NButton>
          </div>
        </div>
      </NScrollbar>
    </template>
    <div
      class="p-2 text-center text-xs text-black/70 dark:text-white/80"
      v-if="bts.tasks.length === 0"
    >
      {{ t('backgroundTasks.emptyPlaceholder') }}
    </div>
  </div>
</template>

<script setup lang="tsx">
import { useBackgroundTasksStore } from '@renderer-shared/shards/background-tasks/store'
import { useTranslation } from 'i18next-vue'
import { NButton, NProgress, NScrollbar } from 'naive-ui'
import { VNodeChild } from 'vue'

const { t } = useTranslation()
const bts = useBackgroundTasksStore()

const renderText = (node: string | (() => VNodeChild)) => {
  if (typeof node === 'string') {
    return () => <span>{node}</span>
  }

  return node
}
</script>

<style scoped></style>
