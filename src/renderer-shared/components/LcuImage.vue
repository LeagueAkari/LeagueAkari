<template>
  <img @dragstart.prevent v-if="url" :src="url" class="lcu-image" @error="handleError" />
  <div v-else class="lcu-image-placeholder"></div>
</template>

<script lang="ts" setup>
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource/context'
import { ref, watchEffect } from 'vue'

const props = defineProps<{
  src?: string
}>()

const url = ref<string | null>(null)
const resources = useAkariResourceProvider()

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
  .lcu-image {
    display: block;
  }

  .lcu-image-placeholder {
    @apply box-border rounded bg-gray-500/40 dark:bg-black/20;
  }
}
</style>
