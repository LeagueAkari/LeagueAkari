<template>
  <video
    v-bind="$attrs"
    :loop
    :autoplay
    v-if="url"
    :src="url"
    class="lcu-video"
    @error="handleError"
  />
  <div v-else class="lcu-video-placeholder"></div>
</template>

<script lang="ts" setup>
import { useGameResourceProvider } from '@renderer-shared/providers/game-resource'
import { ref, watchEffect } from 'vue'

const props = defineProps<{
  src?: string
  loop?: boolean
  autoplay?: boolean
}>()

const url = ref<string | null>(null)
const resources = useGameResourceProvider()

watchEffect(() => {
  if (!props.src) {
    url.value = null
    return
  }

  url.value = resources.assets.resolve(props.src)
})

const handleError = () => {
  url.value = null
}
</script>

<style scoped>
@reference '@renderer-shared/assets/css/tailwind.css';

@layer components {
  .lcu-video {
    display: block;
  }

  .lcu-video-placeholder {
    @apply box-border rounded bg-gray-500/40 dark:bg-black/20;
  }
}
</style>
