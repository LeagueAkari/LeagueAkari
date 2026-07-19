<template>
  <NPopover placement="right-end" :duration="250" :disabled="!isCollapsed">
    <template #trigger>
      <div
        class="respawn-timer-item"
        :class="{ 'respawn-timer-item--collapsed': isCollapsed }"
        :aria-label="detailLabel"
      >
        <span class="respawn-timer-item__inner">
          <span class="respawn-timer-item__icon-slot">
            <NProgress
              class="respawn-timer-item__progress"
              type="circle"
              :percentage="percentage"
              :stroke-width="5"
              :gap-offset-degree="180"
              :color="progressColor"
              :rail-color="progressRailColor"
            >
              <span class="respawn-timer-item__countdown">{{ countdown }}</span>
            </NProgress>
          </span>

          <span class="respawn-timer-item__label">{{ detailLabel }}</span>
        </span>
      </div>
    </template>

    <span class="respawn-timer-item__popover">{{ detailLabel }}</span>
  </NPopover>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue'
import { NPopover, NProgress } from 'naive-ui'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    timeLeft: number
    totalTime: number
    isCollapsed?: boolean
  }>(),
  {
    isCollapsed: false
  }
)

const { t } = useTranslation()

const normalizedTimeLeft = computed(() => Math.max(0, props.timeLeft))
const normalizedTotalTime = computed(() => Math.max(0, props.totalTime))

const percentage = computed(() => {
  if (normalizedTotalTime.value === 0) {
    return 0
  }

  return Math.min(100, (normalizedTimeLeft.value / normalizedTotalTime.value) * 100)
})

const countdown = computed(() => {
  if (normalizedTimeLeft.value > 99) {
    return '99+'
  }

  return normalizedTimeLeft.value.toFixed(0)
})

const detailLabel = computed(() =>
  t('navigation.sidebar.status.respawnTimer.detail', {
    seconds: normalizedTimeLeft.value.toFixed(0),
    totalSeconds: normalizedTotalTime.value.toFixed(0)
  })
)

const progressColor = 'var(--respawn-timer-accent)'
const progressRailColor = 'color-mix(in oklch, var(--respawn-timer-accent) 24%, transparent)'
</script>

<style scoped>
.respawn-timer-item {
  --respawn-timer-accent: var(--color-akari-700);

  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 0 var(--la-sidebar-icon-horizontal-padding, 4px);
  color: var(--respawn-timer-accent);
  -webkit-app-region: no-drag;
}

.respawn-timer-item__inner {
  display: flex;
  position: relative;
  width: 100%;
  box-sizing: border-box;
  align-items: center;
  gap: 4px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.respawn-timer-item__icon-slot {
  display: grid;
  width: calc(
    var(--la-sidebar-width-collapsed, 52px) - var(--la-sidebar-icon-horizontal-padding, 4px) * 2
  );
  height: var(--la-sidebar-icon-height, 36px);
  flex-shrink: 0;
  place-items: center;
}

.respawn-timer-item__progress {
  width: 22px;
  height: 22px;
  transition:
    width 0.2s,
    height 0.2s;
}

.respawn-timer-item__countdown {
  color: var(--respawn-timer-accent);
  font-size: 10px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.respawn-timer-item__label {
  overflow: hidden;
  color: rgba(0, 0, 0, 0.8);
  font-size: 14px;
  text-overflow: ellipsis;
  text-wrap-mode: nowrap;
  opacity: 1;
  transition:
    color 0.2s,
    opacity 0.2s;
}

.respawn-timer-item:hover .respawn-timer-item__inner {
  background-color: rgba(0, 0, 0, 0.05);
}

.respawn-timer-item:hover .respawn-timer-item__label {
  color: rgba(0, 0, 0, 1);
}

.respawn-timer-item__popover {
  color: rgba(0, 0, 0, 0.8);
  font-size: 14px;
  font-weight: 650;
}

.respawn-timer-item--collapsed .respawn-timer-item__progress {
  width: 24px;
  height: 24px;
}

.respawn-timer-item--collapsed .respawn-timer-item__label {
  opacity: 0;
}

[data-theme='dark'] {
  .respawn-timer-item {
    --respawn-timer-accent: var(--color-akari-300);
  }

  .respawn-timer-item:hover .respawn-timer-item__inner {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .respawn-timer-item__label,
  .respawn-timer-item__popover {
    color: rgba(255, 255, 255, 0.8);
  }

  .respawn-timer-item:hover .respawn-timer-item__label {
    color: rgba(255, 255, 255, 1);
  }
}

[data-theme-id]:not([data-theme-id='light']):not([data-theme-id='dark']) {
  .respawn-timer-item:hover .respawn-timer-item__inner {
    background-color: color-mix(in oklch, var(--la-color-link) 12%, transparent);
  }
}
</style>
