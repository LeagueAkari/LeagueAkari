<template>
  <div class="relative isolate flex min-h-0 flex-1 flex-col overflow-hidden">
    <LcuImage
      v-if="splashPath"
      :key="splashPath"
      :src="splashPath"
      class="champion-header-art"
      :class="{ 'is-loaded': splashLoaded }"
      aria-hidden="true"
      @load="splashLoaded = true"
    />
    <div
      v-show="visible"
      class="champion-content relative flex min-h-0 flex-1 flex-col"
      :class="contentClass"
    >
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import { computed, ref, watch } from 'vue'

const {
  championId,
  visible = true,
  contentClass = ''
} = defineProps<{ championId: number; visible?: boolean; contentClass?: string }>()

const resources = useAkariResourceProvider()
const splashLoaded = ref(false)
const splashPath = computed(() => resources.champions.baseSplash(championId))
watch(splashPath, () => {
  splashLoaded.value = false
})
</script>
<style scoped>
.champion-header-art {
  position: absolute;
  z-index: -1;
  top: 0;
  right: 0;
  width: min(100%, 720px);
  height: auto;
  pointer-events: none;
  opacity: 0;
  transition: opacity 300ms ease-out;
  mask-image:
    linear-gradient(to right, transparent 8%, black 58%),
    linear-gradient(to bottom, black 8%, rgb(0 0 0 / 20%) 45%, transparent 90%);
  mask-composite: intersect;
}

.champion-header-art.is-loaded {
  opacity: 0.32;
}

[data-theme='dark'] .champion-header-art.is-loaded {
  opacity: 0.6;
}

.champion-content {
  animation: champion-content-in 300ms ease-out;
}

@keyframes champion-content-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .champion-header-art {
    transition: none;
  }

  .champion-content {
    animation: none;
  }
}
</style>
