<template>
  <div class="tasks">
    <div class="task-title">{{ t('BackgroundTasks.taskTitle', { countV: bts.tasks.length }) }}</div>
    <template v-if="bts.tasks.length > 0">
      <NScrollbar style="max-height: calc(100vh - 80px)">
        <div
          class="task"
          :class="{
            error: task.status === 'error'
          }"
          v-for="task of bts.tasks"
          :key="task.id"
        >
          <div class="task-name">
            <component :is="renderText(task.name)" />
          </div>
          <NProgress
            v-if="task.progress !== null"
            class="task-progress"
            type="line"
            :border-radius="0"
            :percentage="task.progress * 100"
            :status="task.status"
          >
            {{ (task.progress * 100).toFixed(2) }}%
          </NProgress>
          <div class="task-description">
            <component :is="renderText(task.description)" />
          </div>
          <div class="actions" v-if="task.actions.length">
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
    <div class="empty-placeholder" v-if="bts.tasks.length === 0">
      {{ t('BackgroundTasks.emptyPlaceholder') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBackgroundTasksStore } from '@renderer-shared/shards/background-tasks/store'
import { useTranslation } from 'i18next-vue'
import { NButton, NProgress, NScrollbar } from 'naive-ui'
import { VNodeChild, h } from 'vue'

const { t } = useTranslation()
const bts = useBackgroundTasksStore()

const renderText = (node: string | (() => VNodeChild)) => {
  if (typeof node === 'string') {
    return h('span', node)
  }

  return { render: node }
}
</script>

<style lang="less" scoped>
.tasks {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  border: solid 1px #fff2;
  border-radius: 4px;
  background-color: var(--background-color-primary);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
  justify-content: flex-end;
}

.task-title {
  font-size: 14px;
  font-weight: bold;
  padding: 0 8px;
  margin-bottom: 4px;
}

.divider {
  height: 1px;
  background-color: #fff1;
}

.task {
  background-color: #fff1;
  border-radius: 2px;
  padding: 8px 8px;
  width: 320px;

  &.error {
    background-color: #ff4d4f20;
  }

  .task-name {
    font-size: 14px;
  }

  .task-progress {
    margin-top: 8px;
  }

  .task-description {
    font-size: 12px;
    margin-top: 8px;
    color: #fffc;
  }
}

.empty-placeholder {
  font-size: 12px;
  color: #fffc;
  text-align: center;
  padding: 8px;
}
</style>
