<template>
  <div
    class="respawn-timer-item-story"
    :class="{ 'respawn-timer-item-story--collapsed': isCollapsed }"
  >
    <RespawnTimerItem :time-left="timeLeft" :total-time="totalTime" :is-collapsed="isCollapsed" />
  </div>
</template>

<script setup lang="ts">
import RespawnTimerItem from './RespawnTimerItem.vue'

withDefaults(
  defineProps<{
    timeLeft?: number
    totalTime?: number
    isCollapsed?: boolean
  }>(),
  {
    timeLeft: 26,
    totalTime: 42,
    isCollapsed: false
  }
)
</script>

<style scoped>
.respawn-timer-item-story {
  --la-sidebar-width-collapsed: 52px;
  --la-sidebar-width-expanded: 176px;
  --la-sidebar-icon-height: 36px;
  --la-sidebar-icon-horizontal-padding: 4px;

  width: var(--la-sidebar-width-expanded);
  overflow: hidden;
  box-sizing: border-box;
  border: 1px solid var(--la-sidebar-border);
  border-radius: 9px;
  background: var(--la-sidebar-bg);
}

.respawn-timer-item-story--collapsed {
  width: var(--la-sidebar-width-collapsed);
}
</style>
