<template>
  <div class="background-tasks-story">
    <section class="background-tasks-story__custom">
      <div class="background-tasks-story__section-heading">
        <span class="background-tasks-story__section-title">可调实例</span>
        <span class="background-tasks-story__section-detail">使用 Controls 调整任务状态</span>
      </div>

      <div class="background-tasks-story__titlebar">
        <BackgroundTasksStatus v-model:open="customOpen" :compact="compact" :tasks="customTasks" />
      </div>
    </section>

    <section>
      <div class="background-tasks-story__section-heading">
        <span class="background-tasks-story__section-title">状态对照</span>
        <span class="background-tasks-story__section-detail">点击任意胶囊查看对应任务列表</span>
      </div>

      <div class="background-tasks-story__grid">
        <article
          v-for="example in examples"
          :key="example.id"
          class="background-tasks-story__example"
        >
          <div class="background-tasks-story__example-copy">
            <span class="background-tasks-story__example-title">{{ example.label }}</span>
            <span class="background-tasks-story__example-detail">{{ example.detail }}</span>
          </div>
          <div class="background-tasks-story__titlebar is-example">
            <BackgroundTasksStatus :compact="example.compact" :tasks="example.tasks" />
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { i18next } from '@renderer-shared/i18n'
import type { BackgroundTask } from '@renderer-shared/shards/background-tasks/store'
import { computed, ref, watch } from 'vue'

import BackgroundTasksStatus from './BackgroundTasksStatus.vue'

const props = withDefaults(
  defineProps<{
    compact?: boolean
    open?: boolean
    taskCount?: number
    taskName?: string
    taskDescription?: string
    taskStatus?: BackgroundTask['status']
    inProgress?: boolean
    showProgress?: boolean
    progress?: number
    showAction?: boolean
  }>(),
  {
    compact: false,
    open: true,
    taskCount: 1,
    taskName: 'LCU 初始化',
    taskDescription: '已完成 8/12',
    taskStatus: 'default',
    inProgress: true,
    showProgress: true,
    progress: 67,
    showAction: false
  }
)

const customOpen = ref(props.open)

watch(
  () => props.open,
  (value) => {
    customOpen.value = value
  }
)

const createTask = (
  id: string,
  overrides: Partial<Omit<BackgroundTask, 'id'>> = {}
): BackgroundTask => ({
  id,
  createAt: 0,
  name: () => i18next.t('leagueClient.tasks.initialization-task.name'),
  description: () =>
    i18next.t('leagueClient.tasks.initialization-task.current', {
      finishedCount: 8,
      allCount: 12
    }),
  progress: 8 / 12,
  inProgress: true,
  status: 'default',
  actions: [],
  ...overrides
})

const customTasks = computed<BackgroundTask[]>(() => {
  const taskCount = Math.max(1, Math.round(props.taskCount))
  const progress = Math.min(Math.max(props.progress, 0), 100) / 100

  return Array.from({ length: taskCount }, (_, index) =>
    createTask(`storybook-custom-${index}`, {
      createAt: index,
      name: taskCount === 1 ? props.taskName : `${props.taskName} ${index + 1}`,
      description: props.taskDescription,
      progress: props.showProgress ? progress : null,
      inProgress: props.inProgress,
      status: props.taskStatus,
      actions: props.showAction
        ? [
            {
              label: () => i18next.t('navigation.sidebar.status.update.retry'),
              callback: () => undefined
            }
          ]
        : []
    })
  )
})

const activeTask = createTask('active')
const indeterminateTask = createTask('indeterminate', {
  name: () => i18next.t('leagueClient.tasks.connection-task.name'),
  description: () => i18next.t('leagueClient.tasks.connection-task.target', { target: 'HN1' }),
  progress: null,
  status: 'info'
})
const successTask = createTask('success', {
  description: () =>
    i18next.t('leagueClient.tasks.initialization-task.current', {
      finishedCount: 12,
      allCount: 12
    }),
  progress: 1,
  inProgress: false,
  status: 'success'
})
const warningTask = createTask('warning', {
  progress: 0.45,
  inProgress: false,
  status: 'warning'
})
const errorTask = createTask('error', {
  name: () => i18next.t('leagueClient.tasks.connection-task.name'),
  description: () => i18next.t('navigation.sidebar.status.noClient'),
  progress: null,
  inProgress: false,
  status: 'error',
  actions: [
    {
      label: () => i18next.t('navigation.sidebar.status.update.retry'),
      callback: () => undefined
    }
  ]
})

const examples = [
  {
    id: 'active',
    label: '进行中',
    detail: '确定进度，图标持续旋转',
    compact: false,
    tasks: [activeTask]
  },
  {
    id: 'indeterminate',
    label: '无确定进度',
    detail: '进行中但没有百分比',
    compact: false,
    tasks: [indeterminateTask]
  },
  {
    id: 'success',
    label: '已完成',
    detail: '任务完成，图标停止旋转',
    compact: false,
    tasks: [successTask]
  },
  {
    id: 'warning',
    label: '警告',
    detail: '使用语义化警告色',
    compact: false,
    tasks: [warningTask]
  },
  {
    id: 'error',
    label: '错误与操作',
    detail: '错误色并带有操作按钮',
    compact: false,
    tasks: [errorTask]
  },
  {
    id: 'mixed',
    label: '混合任务',
    detail: '同时展示完成、进行中和错误',
    compact: false,
    tasks: [successTask, activeTask, errorTask]
  },
  {
    id: 'compact',
    label: '紧凑模式',
    detail: '仅显示图标的标题栏形态',
    compact: true,
    tasks: [activeTask, indeterminateTask]
  }
] satisfies Array<{
  id: string
  label: string
  detail: string
  compact: boolean
  tasks: BackgroundTask[]
}>
</script>

<style scoped>
.background-tasks-story {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.background-tasks-story__custom {
  min-height: 500px;
}

.background-tasks-story__section-heading {
  display: flex;
  margin-bottom: 10px;
  align-items: baseline;
  gap: 8px;
}

.background-tasks-story__section-title {
  font-size: 13px;
  font-weight: 600;
}

.background-tasks-story__section-detail,
.background-tasks-story__example-detail {
  color: color-mix(in oklch, var(--la-color-text-primary) 50%, transparent);
  font-size: 11px;
}

.background-tasks-story__titlebar {
  display: flex;
  height: 40px;
  padding: 0 12px;
  align-items: center;
  justify-content: flex-end;
  box-sizing: border-box;
  border: 1px solid color-mix(in oklch, var(--la-color-text-primary) 10%, transparent);
  border-radius: 9px;
  background-color: color-mix(in oklch, var(--la-color-bg-primary) 88%, transparent);
}

.background-tasks-story__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.background-tasks-story__example {
  display: flex;
  min-width: 0;
  padding: 10px;
  flex-direction: column;
  gap: 8px;
  box-sizing: border-box;
  border: 1px solid color-mix(in oklch, var(--la-color-text-primary) 10%, transparent);
  border-radius: 9px;
  background-color: color-mix(in oklch, var(--la-color-text-primary) 3%, transparent);
}

.background-tasks-story__example-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.background-tasks-story__example-title {
  font-size: 12px;
  font-weight: 600;
}

.background-tasks-story__titlebar.is-example {
  height: 36px;
  padding: 0 8px;
  border-radius: 6px;
}
</style>
