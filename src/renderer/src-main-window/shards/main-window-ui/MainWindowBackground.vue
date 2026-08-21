<template>
  <div class="main-window-background" :class="{ 'is-mica': isMicaActive }">
    <Transition name="main-window-background-fade">
      <div
        v-if="backgroundMediaUrl && backgroundMediaType && !isMicaActive"
        :key="backgroundMediaUrl"
        class="main-window-background__visual"
      >
        <video
          v-if="backgroundMediaType === 'video'"
          class="main-window-background__media"
          :src="backgroundMediaUrl"
          autoplay
          loop
          muted
          playsinline
          @error="handleBackgroundMediaError"
        />
        <div
          v-else
          class="main-window-background__media"
          :style="{ backgroundImage: `url('${backgroundMediaUrl}')` }"
        />
        <div class="main-window-background__overlay" :style="{ opacity: overlayStrength }" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'

import { MainWindowUiRenderer } from '.'

const mainWindowUi = useInstance(MainWindowUiRenderer)
const { backgroundMediaUrl, backgroundMediaType, isMicaActive, overlayStrength } =
  mainWindowUi.useBackgroundPresentation()

const handleBackgroundMediaError = () => {
  if (backgroundMediaUrl.value) {
    mainWindowUi.reportBackgroundMediaLoadFailure(backgroundMediaUrl.value)
  }
}
</script>

<style scoped>
.main-window-background {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background-color: var(--la-background-color-primary);
  pointer-events: none;
}

.main-window-background.is-mica {
  background-color: transparent;
}

.main-window-background__visual,
.main-window-background__media,
.main-window-background__overlay {
  position: absolute;
  inset: 0;
}

.main-window-background__media {
  display: block;
  width: 100%;
  height: 100%;
  background-position: center;
  background-size: cover;
  object-fit: cover;
}

.main-window-background__overlay {
  background-color: var(--la-background-color-primary);
  transition: opacity 0.2s;
}

.main-window-background-fade-enter-active,
.main-window-background-fade-leave-active {
  transition: opacity 0.3s;
}

.main-window-background-fade-enter-from,
.main-window-background-fade-leave-to {
  opacity: 0;
}
</style>

<style>
body {
  background-color: var(--la-background-color-primary);
}

html.mica-enabled,
body.mica-enabled,
html.mica-enabled #app {
  background-color: transparent !important;
}

.mica-enabled .app-titlebar {
  backdrop-filter: none;
}
</style>
