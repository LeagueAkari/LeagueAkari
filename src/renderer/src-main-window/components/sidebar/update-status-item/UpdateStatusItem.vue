<template>
  <NPopover placement="right-end" :duration="250">
    <template #trigger>
      <div
        class="update-status-item"
        :class="[
          `update-status-item--${status.phase}`,
          {
            'update-status-item--collapsed': isCollapsed,
            'update-status-item--actionable': isActionable
          }
        ]"
        @click="handleAction"
      >
        <span class="update-status-item__inner">
          <span class="update-status-item__icon-slot">
            <span class="update-status-item__progress-shell">
              <NProgress
                class="update-status-item__progress"
                type="circle"
                :percentage="progress"
                :show-indicator="false"
                :stroke-width="5"
                :gap-offset-degree="180"
                :color="progressColor"
                :rail-color="progressRailColor"
              />
            </span>

            <NIcon class="update-status-item__glyph">
              <component :is="statusIcon" />
            </NIcon>
          </span>

          <span class="update-status-item__label">{{ label }}</span>
        </span>
      </div>
    </template>

    <div class="update-status-popover">
      <div class="update-status-popover__title">{{ popoverTitle }}</div>

      <div v-if="release" class="update-status-popover__version">
        <span>{{ release.currentVersion }}</span>
        <span aria-hidden="true">→</span>
        <span>{{ release.version }}</span>
      </div>

      <template v-if="status.kind === 'downloading' && updateProgressInfo">
        <NProgress
          class="update-status-popover__progress"
          type="line"
          :percentage="progress"
          :show-indicator="false"
          :height="6"
          :border-radius="3"
          :fill-border-radius="3"
          :color="progressColor"
          :rail-color="progressRailColor"
        />
        <div class="update-status-popover__details">
          <span>
            {{
              t('settings.app.selfUpdate.updateProgress.finished', {
                progress: progress.toFixed(0)
              })
            }}
          </span>
          <span v-if="updateProgressInfo.downloadTimeLeft >= 0">
            {{
              t('settings.app.selfUpdate.updateProgress.remain', {
                time: formatSeconds(updateProgressInfo.downloadTimeLeft, 1)
              })
            }}
          </span>
        </div>
      </template>

      <div
        v-else-if="status.kind === 'waiting-for-restart'"
        class="update-status-popover__description"
      >
        {{ t('settings.app.selfUpdate.updateProgress.waitingForRestartDescription') }}
      </div>

      <div v-if="status.kind !== 'available'" class="update-status-popover__actions">
        <NButton size="tiny" secondary @click="emit('cancel')">
          {{ t('settings.app.selfUpdate.cancelUpdate') }}
        </NButton>
        <NButton
          v-if="status.kind === 'waiting-for-restart'"
          size="tiny"
          type="primary"
          @click="emit('restart')"
        >
          {{ t('settings.app.selfUpdate.restartNow') }}
        </NButton>
      </div>
    </div>
  </NPopover>
</template>

<script setup lang="ts">
import type { SelfUpdateReleaseInfo, UpdateProgressInfo } from '@shared/shards/self-update'
import { formatSeconds } from '@shared/utils/format'
import { ArrowDownload20Filled, ArrowSync20Filled, ArrowUp20Filled } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NPopover, NProgress } from 'naive-ui'
import { computed } from 'vue'

import type { UpdateStatusDisplay } from './status'

const props = withDefaults(
  defineProps<{
    status: UpdateStatusDisplay
    release: SelfUpdateReleaseInfo | null
    updateProgressInfo: UpdateProgressInfo | null
    isCollapsed?: boolean
  }>(),
  {
    isCollapsed: false
  }
)

const emit = defineEmits<{
  start: []
  cancel: []
  restart: []
}>()

const { t } = useTranslation()

const progress = computed(() => Math.min(100, Math.max(0, props.status.progress)))

const statusIcon = computed(() => {
  switch (props.status.phase) {
    case 'available':
      return ArrowUp20Filled
    case 'downloading':
      return ArrowDownload20Filled
    case 'ready':
      return ArrowSync20Filled
  }
})

const label = computed(() => {
  switch (props.status.kind) {
    case 'available':
      return t('navigation.sidebar.status.update.available')
    case 'downloading':
      return t('navigation.sidebar.status.update.downloading', {
        progress: Math.round(progress.value)
      })
    case 'download-failed':
      return t('navigation.sidebar.status.update.retry')
    case 'waiting-for-restart':
      return t('navigation.sidebar.status.update.ready')
  }
})

const popoverTitle = computed(() => {
  switch (props.status.kind) {
    case 'available':
      return t('settings.app.selfUpdate.newRelease')
    case 'downloading':
      return t('settings.app.selfUpdate.updateProgress.downloading')
    case 'download-failed':
      return t('settings.app.selfUpdate.updateProgress.downloadFailed')
    case 'waiting-for-restart':
      return t('settings.app.selfUpdate.updateProgress.waitingForRestart')
  }
})

const isActionable = computed(() => props.status.kind !== 'downloading')

const handleAction = () => {
  switch (props.status.kind) {
    case 'available':
    case 'download-failed':
      emit('start')
      break
    case 'waiting-for-restart':
      emit('restart')
      break
    case 'downloading':
      break
  }
}

const progressColor = 'var(--update-status-accent)'
const progressRailColor = 'color-mix(in oklch, var(--update-status-accent) 24%, transparent)'
</script>

<style scoped>
.update-status-item {
  --update-status-accent: var(--color-akari-700);

  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 0 var(--la-sidebar-icon-horizontal-padding, 4px);
  border: 0;
  color: var(--update-status-accent);
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: default;
  -webkit-app-region: no-drag;

  &.update-status-item--actionable {
    cursor: pointer;
  }
}

.update-status-item__inner {
  display: flex;
  position: relative;
  width: 100%;
  box-sizing: border-box;
  align-items: center;
  gap: 4px;
  border-radius: 8px;
  transition:
    background-color 0.2s,
    box-shadow 0.2s;
}

.update-status-item__icon-slot {
  display: grid;
  position: relative;
  width: calc(
    var(--la-sidebar-width-collapsed, 52px) - var(--la-sidebar-icon-horizontal-padding, 4px) * 2
  );
  height: var(--la-sidebar-icon-height, 36px);
  flex-shrink: 0;
  place-items: center;
}

.update-status-item__progress-shell,
.update-status-item__progress,
.update-status-item__glyph {
  position: absolute;
  width: 22px;
  height: 22px;
  transition:
    width 0.2s,
    height 0.2s,
    filter 0.2s,
    color 0.2s;
}

.update-status-item__progress-shell {
  display: grid;
  place-items: center;
}

.update-status-item__progress {
  inset: 0;
}

.update-status-item__glyph {
  display: grid;
  z-index: 1;
  place-items: center;
  font-size: 16px;
}

.update-status-item__label {
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

.update-status-item--collapsed {
  .update-status-item__progress-shell,
  .update-status-item__progress,
  .update-status-item__glyph {
    width: 24px;
    height: 24px;
  }

  .update-status-item__glyph {
    font-size: 18px;
  }

  .update-status-item__label {
    opacity: 0;
  }
}

.update-status-item--ready {
  .update-status-item__progress-shell,
  .update-status-item__glyph {
    filter: drop-shadow(0 0 5px color-mix(in oklch, var(--update-status-accent) 56%, transparent));
  }
}

.update-status-item:hover .update-status-item__inner {
  background-color: rgba(0, 0, 0, 0.05);
}

.update-status-item:hover .update-status-item__label {
  color: rgba(0, 0, 0, 1);
}

.update-status-popover {
  --update-status-accent: var(--color-akari-700);

  width: 248px;
  padding: 2px;
  color: rgba(0, 0, 0, 0.8);
}

.update-status-popover__title {
  color: rgba(0, 0, 0, 0.9);
  font-size: 13px;
  font-weight: 650;
}

.update-status-popover__version {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  color: rgba(0, 0, 0, 0.68);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.update-status-popover__progress {
  margin-top: 10px;
}

.update-status-popover__details {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 6px;
  color: rgba(0, 0, 0, 0.72);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.update-status-popover__description {
  margin-top: 8px;
  color: rgba(0, 0, 0, 0.72);
  font-size: 12px;
  line-height: 1.5;
}

.update-status-popover__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

[data-theme='dark'] {
  .update-status-item,
  .update-status-popover {
    --update-status-accent: var(--color-akari-300);
  }

  .update-status-item:hover .update-status-item__inner {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .update-status-item__label {
    color: rgba(255, 255, 255, 0.8);
  }

  .update-status-item:hover .update-status-item__label {
    color: rgba(255, 255, 255, 1);
  }

  .update-status-popover {
    color: rgba(255, 255, 255, 0.8);
  }

  .update-status-popover__title {
    color: rgba(255, 255, 255, 0.9);
  }

  .update-status-popover__version {
    color: rgba(255, 255, 255, 0.68);
  }

  .update-status-popover__details,
  .update-status-popover__description {
    color: rgba(255, 255, 255, 0.78);
  }
}

[data-theme-id]:not([data-theme-id='light']):not([data-theme-id='dark']) {
  .update-status-item:hover .update-status-item__inner {
    background-color: color-mix(in oklch, var(--la-color-link) 12%, transparent);
  }
}
</style>
