<template>
  <div v-if="shouldShow" class="ftue-spotlight-layer" @click="onMaskClick">
    <div class="ftue-spotlight" :style="spotlightStyle" @click.stop />

    <div class="ftue-card" :style="cardStyle" @click.stop>
      <div class="ftue-title">{{ ftue.active?.title }}</div>
      <div class="ftue-description">{{ ftue.active?.description }}</div>

      <div class="ftue-actions">
        <NButton size="small" type="primary" @click="ftue.confirmActive()">
          {{ ftue.active?.confirmText || t('Ftue.confirm') }}
        </NButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue'
import { NButton } from 'naive-ui'
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'

import { useFtueStore } from '@main-window/shards/ftue/store'

type Placement = 'top' | 'bottom' | 'left' | 'right'

interface ViewportSize {
  width: number
  height: number
}

interface RectBox {
  top: number
  left: number
  width: number
  height: number
  right: number
  bottom: number
}

const { t } = useTranslation()
const ftue = useFtueStore()

const targetRect = ref<DOMRect | null>(null)
const viewport = ref<ViewportSize>({
  width: window.innerWidth,
  height: window.innerHeight
})

let rafId = 0
let missingTicks = 0

const clamp = (v: number, min: number, max: number) => {
  return Math.min(Math.max(v, min), max)
}

const refreshViewport = () => {
  viewport.value = {
    width: window.innerWidth,
    height: window.innerHeight
  }
}

const refreshTargetRect = () => {
  const task = ftue.active

  if (!task) {
    targetRect.value = null
    return
  }

  const el = document.querySelector(task.targetSelector) as HTMLElement | null

  if (!el) {
    targetRect.value = null
    missingTicks += 1

    if (missingTicks >= 360) {
      ftue.closeActive()
    }
    return
  }

  missingTicks = 0
  targetRect.value = el.getBoundingClientRect()
}

const runFrame = () => {
  refreshTargetRect()
  rafId = window.requestAnimationFrame(runFrame)
}

const stopTracking = () => {
  if (rafId) {
    window.cancelAnimationFrame(rafId)
    rafId = 0
  }

  window.removeEventListener('resize', refreshViewport)
  window.removeEventListener('scroll', refreshTargetRect, true)
  window.removeEventListener('keydown', onKeyDown)
}

const startTracking = async () => {
  stopTracking()
  missingTicks = 0
  refreshViewport()
  await nextTick()
  refreshTargetRect()

  rafId = window.requestAnimationFrame(runFrame)
  window.addEventListener('resize', refreshViewport)
  window.addEventListener('scroll', refreshTargetRect, true)
  window.addEventListener('keydown', onKeyDown)
}

const onKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    ftue.closeActive()
  }
}

watch(
  () => ftue.active,
  (task) => {
    if (task) {
      startTracking()
    } else {
      stopTracking()
      targetRect.value = null
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  stopTracking()
})

const spotlightRect = computed<RectBox | null>(() => {
  const rect = targetRect.value
  const task = ftue.active

  if (!rect || !task) {
    return null
  }

  const safePadding = Math.max(0, task.spotlightPadding ?? 6)
  const margin = 6
  const top = clamp(rect.top - safePadding, margin, viewport.value.height - margin)
  const left = clamp(rect.left - safePadding, margin, viewport.value.width - margin)
  const right = clamp(rect.right + safePadding, margin, viewport.value.width - margin)
  const bottom = clamp(rect.bottom + safePadding, margin, viewport.value.height - margin)

  if (right - left <= 2 || bottom - top <= 2) {
    return null
  }

  return {
    top,
    left,
    right,
    bottom,
    width: right - left,
    height: bottom - top
  }
})

const resolvePlacement = (preferred: Placement | 'auto', rect: RectBox): Placement => {
  if (preferred !== 'auto') {
    return preferred
  }

  const margin = 14
  const offset = ftue.active?.offset ?? 12
  const estimatedHeight = 190

  const topSpace = rect.top - margin - offset
  const bottomSpace = viewport.value.height - rect.bottom - margin - offset
  const leftSpace = rect.left - margin - offset
  const rightSpace = viewport.value.width - rect.right - margin - offset

  if (bottomSpace >= estimatedHeight) {
    return 'bottom'
  }

  if (topSpace >= estimatedHeight) {
    return 'top'
  }

  return rightSpace >= leftSpace ? 'right' : 'left'
}

const cardStyle = computed(() => {
  const rect = spotlightRect.value

  if (!rect) {
    return {}
  }

  const margin = 14
  const offset = ftue.active?.offset ?? 12
  const width = Math.min(360, viewport.value.width - margin * 2)
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  const placement = resolvePlacement(ftue.active?.placement || 'auto', rect)

  if (placement === 'bottom') {
    return {
      width: `${width}px`,
      left: `${clamp(centerX - width / 2, margin, viewport.value.width - width - margin)}px`,
      top: `${rect.bottom + offset}px`
    }
  }

  if (placement === 'top') {
    return {
      width: `${width}px`,
      left: `${clamp(centerX - width / 2, margin, viewport.value.width - width - margin)}px`,
      top: `${rect.top - offset}px`,
      transform: 'translateY(-100%)'
    }
  }

  if (placement === 'left') {
    return {
      width: `${width}px`,
      left: `${rect.left - offset}px`,
      top: `${clamp(centerY - 86, margin, viewport.value.height - 172 - margin)}px`,
      transform: 'translateX(-100%)'
    }
  }

  return {
    width: `${width}px`,
    left: `${rect.right + offset}px`,
    top: `${clamp(centerY - 86, margin, viewport.value.height - 172 - margin)}px`
  }
})

const spotlightStyle = computed(() => {
  const rect = spotlightRect.value

  if (!rect) {
    return {}
  }

  return {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`
  }
})

const shouldShow = computed(() => {
  return !!ftue.active && !!spotlightRect.value
})

const onMaskClick = () => {
  if (ftue.active?.dismissOnMaskClick === false) {
    return
  }

  ftue.closeActive()
}
</script>

<style scoped>
.ftue-spotlight-layer {
  position: fixed;
  inset: 0;
  z-index: 4500;
}

.ftue-spotlight {
  position: fixed;
  border-radius: 10px;
  box-shadow:
    0 0 0 9999px rgb(8 15 30 / 72%),
    0 0 0 1px rgb(255 255 255 / 55%),
    0 0 22px rgb(16 185 129 / 35%);
}

[data-theme='dark'] .ftue-spotlight {
  box-shadow:
    0 0 0 9999px rgb(3 6 12 / 78%),
    0 0 0 1px rgb(255 255 255 / 65%),
    0 0 24px rgb(16 185 129 / 45%);
}

.ftue-card {
  position: fixed;
  border-radius: 10px;
  border: 1px solid rgb(16 185 129 / 28%);
  background: rgb(248 250 252 / 97%);
  padding: 12px 14px;
  box-shadow: 0 10px 24px rgb(2 6 23 / 35%);
}

[data-theme='dark'] .ftue-card {
  border-color: rgb(52 211 153 / 30%);
  background: rgb(14 20 34 / 97%);
  box-shadow: 0 12px 24px rgb(0 0 0 / 48%);
}

.ftue-title {
  color: rgb(15 23 42 / 95%);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
}

[data-theme='dark'] .ftue-title {
  color: rgb(241 245 249 / 96%);
}

.ftue-description {
  margin-top: 6px;
  color: rgb(30 41 59 / 74%);
  font-size: 12px;
  line-height: 1.55;
}

[data-theme='dark'] .ftue-description {
  color: rgb(226 232 240 / 74%);
}

.ftue-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
