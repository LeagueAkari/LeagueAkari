<template>
  <BackgroundTasksStatus :compact="compact" :tasks="backgroundTasks.tasks" />
</template>

<script setup lang="ts">
import { useBackgroundTasksStore } from '@renderer-shared/shards/background-tasks/store'

import BackgroundTasksStatus from './BackgroundTasksStatus.vue'

defineProps<{ compact: boolean }>()

const backgroundTasks = useBackgroundTasksStore()
</script>
